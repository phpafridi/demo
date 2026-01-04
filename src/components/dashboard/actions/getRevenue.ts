'use server'
import { prisma } from '@/lib/prisma'

export async function getRevenue() {
  const orders = await prisma.tbl_order.findMany({
    where: { order_status: 2 }, // Completed
    select: { grand_total: true }
  })
  return orders.reduce((sum, o) => sum + Number(o.grand_total), 0)
}
