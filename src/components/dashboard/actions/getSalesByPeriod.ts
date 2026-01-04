'use server'
import { prisma } from '@/lib/prisma'

export async function getSalesByPeriod() {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfWeek = new Date(startOfDay)
  startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay())
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfYear = new Date(now.getFullYear(), 0, 1)

  const orders = await prisma.tbl_order.findMany({
    where: { order_status: 2 },
    select: { grand_total: true, order_date: true }
  })

  const dailySales = orders.filter(o => o.order_date >= startOfDay)
    .reduce((sum, o) => sum + Number(o.grand_total), 0)

  const weeklySales = orders.filter(o => o.order_date >= startOfWeek)
    .reduce((sum, o) => sum + Number(o.grand_total), 0)

  const monthlySales = orders.filter(o => o.order_date >= startOfMonth)
    .reduce((sum, o) => sum + Number(o.grand_total), 0)

  const yearlySales = orders.filter(o => o.order_date >= startOfYear)
    .reduce((sum, o) => sum + Number(o.grand_total), 0)

  return { dailySales, weeklySales, monthlySales, yearlySales }
}
