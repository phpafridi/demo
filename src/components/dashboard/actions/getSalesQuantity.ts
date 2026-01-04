'use server'
import { prisma } from '@/lib/prisma'

export async function getSalesQuantity() {
  const orders = await prisma.tbl_order.count({
    where: { order_status: 2 }
  })
  return orders
}
