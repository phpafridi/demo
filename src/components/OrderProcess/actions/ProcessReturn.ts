'use server'

import { prisma } from '@/lib/prisma'

export type ReturnItem = {
  product_id: number
  product_name: string
  product_code: string
  qty: number
  unit_price: number
}

export type ExchangeItem = {
  product_id: number
  product_name: string
  product_code: string
  qty: number
  unit_price: number
}

export type ReturnPayload = {
  order_id: number
  return_type: 'payment' | 'exchange'
  returned_items: ReturnItem[]
  exchange_items?: ExchangeItem[]   // only for exchange type
  note?: string
  processed_by: string
}

export async function ProcessReturn(payload: ReturnPayload) {
  try {
    const { order_id, return_type, returned_items, exchange_items, note, processed_by } = payload

    if (!returned_items || returned_items.length === 0) {
      throw new Error('No return items specified')
    }

    if (return_type === 'exchange') {
      // Validate exchange items exist and amounts match approximately
      if (!exchange_items || exchange_items.length === 0) {
        throw new Error('Exchange items are required for exchange return type')
      }

      const returnTotal = returned_items.reduce((s, i) => s + i.qty * i.unit_price, 0)
      const exchangeTotal = exchange_items.reduce((s, i) => s + i.qty * i.unit_price, 0)
      const diff = Math.abs(returnTotal - exchangeTotal)

      // Allow up to 5% difference (rounding, tax differences)
      if (diff > returnTotal * 0.05 + 1) {
        throw new Error(
          `Exchange value mismatch: returned ${returnTotal.toFixed(2)} vs exchange ${exchangeTotal.toFixed(2)}`
        )
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const returnNo = Math.floor(Date.now() / 1000)

      // 1. Create return record
      const returnRecord = await tx.tbl_return.create({
        data: {
          return_no: returnNo,
          order_id,
          return_type,
          note: note || '',
          processed_by,
        },
      })

      // 2. Create return items (products coming back to store)
      for (const item of returned_items) {
        await tx.$executeRaw`
          INSERT INTO tbl_return_item (
            return_id, product_id, product_name, product_code,
            qty, unit_price, sub_total, item_type
          ) VALUES (
            ${returnRecord.return_id}, ${item.product_id},
            ${item.product_name}, ${item.product_code},
            CAST(${item.qty} AS DECIMAL(10,1)),
            CAST(${item.unit_price} AS DECIMAL(10,2)),
            CAST(${item.qty * item.unit_price} AS DECIMAL(10,2)),
            'returned'
          )
        `

        // 3. Restore inventory for returned items
        const inv = await tx.tbl_inventory.findFirst({
          where: { product_id: item.product_id },
        })

        if (inv) {
          const newQty = Number(inv.product_quantity) + Number(item.qty)
          await tx.$executeRaw`
            UPDATE tbl_inventory
            SET product_quantity = CAST(${newQty} AS DECIMAL(10,1))
            WHERE inventory_id = ${inv.inventory_id}
          `
        }
      }

      if (return_type === 'payment') {
        // 4a. Payment return: mark the original order as returned (status 3)
        await tx.$executeRaw`
          UPDATE tbl_order SET order_status = 3 WHERE order_id = ${order_id}
        `

        // Remove invoice (void it) - update status only, keep record
        await tx.$executeRaw`
          UPDATE tbl_invoice SET invoice_no = NULL WHERE order_id = ${order_id}
        `
      } else if (return_type === 'exchange' && exchange_items) {
        // 4b. Exchange: create exchange items and deduct exchange product inventory
        for (const exItem of exchange_items) {
          await tx.$executeRaw`
            INSERT INTO tbl_return_item (
              return_id, product_id, product_name, product_code,
              qty, unit_price, sub_total, item_type
            ) VALUES (
              ${returnRecord.return_id}, ${exItem.product_id},
              ${exItem.product_name}, ${exItem.product_code},
              CAST(${exItem.qty} AS DECIMAL(10,1)),
              CAST(${exItem.unit_price} AS DECIMAL(10,2)),
              CAST(${exItem.qty * exItem.unit_price} AS DECIMAL(10,2)),
              'exchange'
            )
          `

          // Deduct inventory for exchange product going out
          const inv = await tx.tbl_inventory.findFirst({
            where: { product_id: exItem.product_id },
          })

          if (inv) {
            const newQty = Math.max(0, Number(inv.product_quantity) - Number(exItem.qty))
            await tx.$executeRaw`
              UPDATE tbl_inventory
              SET product_quantity = CAST(${newQty} AS DECIMAL(10,1))
              WHERE inventory_id = ${inv.inventory_id}
            `
          }
        }

        // Mark order as partially returned (status 4)
        await tx.$executeRaw`
          UPDATE tbl_order SET order_status = 4 WHERE order_id = ${order_id}
        `
      }

      return returnRecord
    })

    return {
      success: true,
      return_id: result.return_id,
      return_no: result.return_no,
      message: return_type === 'payment'
        ? 'Payment return processed successfully. Stock restored.'
        : 'Exchange processed successfully. Stock updated.',
    }
  } catch (err: any) {
    console.error('❌ ProcessReturn error:', err)
    return { success: false, message: err.message || 'Failed to process return' }
  }
}

export async function FetchReturnByOrder(order_id: number) {
  try {
    const returns = await prisma.tbl_return.findMany({
      where: { order_id },
      include: { items: { include: { product: true } } },
      orderBy: { return_date: 'desc' },
    })
    return returns.map((r) => ({
      ...r,
      return_date: r.return_date.toISOString(),
      items: r.items.map((item) => ({
        ...item,
        qty: Number(item.qty),
        unit_price: Number(item.unit_price),
        sub_total: Number(item.sub_total),
      })),
    }))
  } catch {
    return []
  }
}

export async function FetchAllReturns() {
  try {
    const returns = await prisma.tbl_return.findMany({
      include: {
        order: { select: { order_no: true, customer_name: true, grand_total: true } },
        items: true,
      },
      orderBy: { return_date: 'desc' },
    })
    return returns.map((r) => ({
      ...r,
      return_date: r.return_date.toISOString(),
      order: {
        ...r.order,
        grand_total: Number(r.order.grand_total),
      },
      items: r.items.map((item) => ({
        ...item,
        qty: Number(item.qty),
        unit_price: Number(item.unit_price),
        sub_total: Number(item.sub_total),
      })),
    }))
  } catch {
    return []
  }
}
