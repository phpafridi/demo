'use server'

import { prisma } from '@/lib/prisma'

export default async function FetchOrderHistory() {
  try {
    const orders = await prisma.tbl_order.findMany({
      orderBy: {
        order_no: 'desc', // latest orders first
      },
      include: {
        customer: true,      // include customer info
        details: true,       // include line items
        invoices: true,      // include related invoices
      },
    })

    return orders
  } catch (err) {
    console.error('❌ FetchOrderHistory error:', err)
    throw new Error('Failed to fetch order history')
  }
}
