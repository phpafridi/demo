'use server'
import { prisma } from '@/lib/prisma'

export async function getProfit() {
  const orders = await prisma.tbl_order.findMany({
    where: { order_status: 2 },
    select: { grand_total: true, total_tax: true, discount_amount: true }
  })
  return orders.reduce(
    (sum, o) =>
      sum + (Number(o.grand_total) - Number(o.total_tax) - Number(o.discount_amount)),
    0
  )
}
