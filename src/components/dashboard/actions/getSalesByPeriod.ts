'use server'
import { prisma } from '@/lib/prisma'

export async function getSalesByPeriod() {
  const now = new Date()
  const startOfDay   = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfWeek  = new Date(startOfDay)
  startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay())
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfYear  = new Date(now.getFullYear(), 0, 1)

  // Status 2 = confirmed, Status 4 = exchanged (money kept)
  const [daily, weekly, monthly, yearly] = await Promise.all([
    prisma.$queryRaw`SELECT COALESCE(SUM(CAST(grand_total AS DOUBLE)),0) AS v FROM tbl_order WHERE order_status IN (2,4) AND order_date >= ${startOfDay}`,
    prisma.$queryRaw`SELECT COALESCE(SUM(CAST(grand_total AS DOUBLE)),0) AS v FROM tbl_order WHERE order_status IN (2,4) AND order_date >= ${startOfWeek}`,
    prisma.$queryRaw`SELECT COALESCE(SUM(CAST(grand_total AS DOUBLE)),0) AS v FROM tbl_order WHERE order_status IN (2,4) AND order_date >= ${startOfMonth}`,
    prisma.$queryRaw`SELECT COALESCE(SUM(CAST(grand_total AS DOUBLE)),0) AS v FROM tbl_order WHERE order_status IN (2,4) AND order_date >= ${startOfYear}`,
  ]) as any[][]

  return {
    dailySales:   Number(daily[0]?.v   || 0),
    weeklySales:  Number(weekly[0]?.v  || 0),
    monthlySales: Number(monthly[0]?.v || 0),
    yearlySales:  Number(yearly[0]?.v  || 0),
  }
}
