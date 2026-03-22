'use server'

import { prisma } from '@/lib/prisma'

export type BatchItem = {
  product_id: number
  qty: number
  buying_price: number
  selling_price: number
  expiry_date?: string
  manufacture_date?: string
  batch_number?: string       // custom batch number; auto-generated if not provided
  is_existing_batch?: boolean // true = top-up existing batch qty_remaining
}

export type BatchPurchasePayload = {
  supplier_id: number
  purchase_ref: string
  payment_method: string
  purchase_date?: string
  cart: BatchItem[]
}

export async function SaveBatchPurchase(data: BatchPurchasePayload) {
  try {
    if (!data.supplier_id || !data.cart || data.cart.length === 0) {
      throw new Error('Supplier and at least one product are required')
    }

    const purchaseDate = data.purchase_date ? new Date(data.purchase_date) : new Date()

    const supplier = await prisma.tbl_supplier.findUnique({
      where: { supplier_id: data.supplier_id },
    })
    if (!supplier) throw new Error('Supplier not found')

    const grandTotal = data.cart.reduce((sum, item) => sum + item.qty * item.buying_price, 0)

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create purchase header
      const purchase = await tx.tbl_purchase.create({
        data: {
          purchase_order_number: Math.floor(100000 + Math.random() * 900000),
          supplier_id: data.supplier_id,
          supplier_name: supplier.supplier_name,
          grand_total: grandTotal,
          purchase_ref: data.purchase_ref,
          payment_method: data.payment_method,
          payment_ref: '',
          purchase_by: 'Admin',
          datetime: purchaseDate,
        },
      })

      // Fetch product details
      const productDetails = await tx.tbl_product.findMany({
        where: { product_id: { in: data.cart.map((i) => i.product_id) } },
        select: { product_id: true, product_code: true, product_name: true },
      })
      const productMap = new Map(productDetails.map((p) => [p.product_id, p]))

      for (const item of data.cart) {
        const product = productMap.get(item.product_id)
        const qty = Number(item.qty)
        const buyingPrice = Number(item.buying_price)
        const sellingPrice = Number(item.selling_price)

        // 2. Always record in tbl_purchase_product for audit trail
        await tx.$executeRaw`
          INSERT INTO tbl_purchase_product (
            purchase_id, product_id, product_code, product_name,
            qty, unit_price, sub_total
          ) VALUES (
            ${purchase.purchase_id}, ${item.product_id},
            ${product?.product_code || ''}, ${product?.product_name || ''},
            ${qty}, ${buyingPrice}, ${qty * buyingPrice}
          )
        `

        // 3. Batch record — either top-up existing or create new
        if (item.is_existing_batch && item.batch_number) {
          // ── Top-up existing batch ─────────────────────────────────────────
          // Increase qty_remaining and update prices
          await tx.$executeRaw`
            UPDATE tbl_purchase_batch
            SET
              qty           = qty + ${qty},
              qty_remaining = qty_remaining + ${qty},
              buying_price  = ${buyingPrice},
              selling_price = ${sellingPrice},
              is_active     = true
            WHERE product_id   = ${item.product_id}
              AND batch_number = ${item.batch_number}
            LIMIT 1
          `
        } else {
          // ── Create new batch record ───────────────────────────────────────
          const batchNumber = (item.batch_number && item.batch_number.trim())
            ? item.batch_number.trim()
            : `B${purchase.purchase_id}-${item.product_id}-${Date.now()}`
          const expiryDate = item.expiry_date     ? new Date(item.expiry_date)     : null
          const mfgDate    = item.manufacture_date ? new Date(item.manufacture_date) : null

          await tx.$executeRaw`
            INSERT INTO tbl_purchase_batch (
              purchase_id, product_id, product_code, product_name,
              batch_number, qty, qty_remaining,
              buying_price, selling_price,
              expiry_date, manufacture_date, purchase_date, is_active
            ) VALUES (
              ${purchase.purchase_id}, ${item.product_id},
              ${product?.product_code || ''}, ${product?.product_name || ''},
              ${batchNumber}, ${qty}, ${qty},
              ${buyingPrice}, ${sellingPrice},
              ${expiryDate}, ${mfgDate}, ${purchaseDate}, true
            )
          `
        }

        // 4. Update inventory (always — regardless of new/existing batch)
        const inv = await tx.tbl_inventory.findFirst({
          where: { product_id: item.product_id },
        })

        if (inv) {
          const newQty = Number(inv.product_quantity) + qty
          await tx.$executeRaw`
            UPDATE tbl_inventory
            SET product_quantity = CAST(${newQty} AS DECIMAL(10,1))
            WHERE inventory_id = ${inv.inventory_id}
          `
        } else {
          await tx.$executeRaw`
            INSERT INTO tbl_inventory (product_id, product_quantity, notify_quantity)
            VALUES (${item.product_id}, ${qty}, 0)
          `
        }

        // 5. Update product default price
        const existingPrice = await tx.tbl_product_price.findFirst({
          where: { product_id: item.product_id },
        })
        if (existingPrice) {
          await tx.tbl_product_price.update({
            where: { product_price_id: existingPrice.product_price_id },
            data: { buying_price: buyingPrice, selling_price: sellingPrice },
          })
        }
      }

      return purchase
    })

    return {
      success: true,
      message: 'Batch purchase saved successfully',
      purchase_id: result.purchase_id,
    }
  } catch (err: any) {
    console.error('❌ SaveBatchPurchase error:', err)
    return { success: false, message: err.message || 'Failed to save batch purchase' }
  }
}

export async function FetchBatchesByProduct(product_id: number) {
  try {
    const batches = await prisma.tbl_purchase_batch.findMany({
      where: { product_id, is_active: true },
      orderBy: [{ expiry_date: 'asc' }, { purchase_date: 'asc' }],
    })
    return batches.map((b) => ({
      ...b,
      qty:              Number(b.qty),
      qty_remaining:    Number(b.qty_remaining),
      buying_price:     Number(b.buying_price),
      selling_price:    Number(b.selling_price),
      expiry_date:      b.expiry_date      ? b.expiry_date.toISOString().slice(0, 10)      : null,
      manufacture_date: b.manufacture_date ? b.manufacture_date.toISOString().slice(0, 10) : null,
      purchase_date:    b.purchase_date.toISOString(),
    }))
  } catch {
    return []
  }
}

export async function FetchAllBatches() {
  try {
    const batches = await prisma.tbl_purchase_batch.findMany({
      include: {
        product:  { select: { product_name: true, product_code: true, measurement_units: true } },
        purchase: { select: { purchase_order_number: true, supplier_name: true } },
      },
      orderBy: [{ expiry_date: 'asc' }, { purchase_date: 'desc' }],
    })
    return batches.map((b) => ({
      ...b,
      qty:              Number(b.qty),
      qty_remaining:    Number(b.qty_remaining),
      buying_price:     Number(b.buying_price),
      selling_price:    Number(b.selling_price),
      expiry_date:      b.expiry_date      ? b.expiry_date.toISOString().slice(0, 10)      : null,
      manufacture_date: b.manufacture_date ? b.manufacture_date.toISOString().slice(0, 10) : null,
      purchase_date:    b.purchase_date.toISOString(),
    }))
  } catch {
    return []
  }
}
