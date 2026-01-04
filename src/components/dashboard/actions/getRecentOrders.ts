'use server'
import { prisma } from '@/lib/prisma'

export async function getRecentOrders(limit: number = 10) {
  return await prisma.tbl_order.findMany({
    where: { order_status: 2 },
    orderBy: { order_date: 'desc' },
    take: limit,
    select: {
      order_id: true,
      order_date: true,
      grand_total: true,
      customer: { select: { customer_name: true } },
      order_status: true
    }
  })
}
