'use server'

import { prisma } from '@/lib/prisma'

export async function updateOrderStatus(orderId: number, status: number) {
  // ✅ Update order status
  const order = await prisma.tbl_order.update({
    where: { order_id: orderId },
    data: { order_status: status },
  })

  // ✅ Fetch order details (used for cancel)
  const orderDetails = await prisma.tbl_order_details.findMany({
    where: { order_id: orderId },
    select: { product_id: true, product_quantity: true },
  })

  if (status === 1) {
    // ❌ Cancel → Increment inventory
    for (const detail of orderDetails) {
      const inventory = await prisma.tbl_inventory.findFirst({
        where: { product_id: detail.product_id },
        select: { inventory_id: true },
      })

      if (inventory) {
        await prisma.tbl_inventory.update({
          where: { inventory_id: inventory.inventory_id },
          data: {
            product_quantity: {
              increment: detail.product_quantity,
            },
          },
        })
      }
    }
  }

  if (status === 2) {
    // ✅ Confirm → Update payment method to cash & Generate invoice

    await prisma.tbl_order.update({
      where: { order_id: orderId },
      data: { payment_method: 'cash' }, // ✅ force update
    })

    // Get last invoice_no
    const lastInvoice = await prisma.tbl_invoice.findFirst({
      orderBy: { invoice_no: 'desc' },
    })
    const nextInvoiceNo = (lastInvoice?.invoice_no ?? 0) + 1

    const invoice = await prisma.tbl_invoice.create({
      data: {
        order_id: orderId,
        invoice_no: nextInvoiceNo,
      },
    })

    return { order, invoice }
  }

  return { order }
}
