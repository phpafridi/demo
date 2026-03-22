'use server'
import { prisma } from '@/lib/prisma'

export async function getProfit() {
  // Only confirmed orders — exclude returned (3) and exchanged (4)
  const result: any[] = await prisma.$queryRaw`
    SELECT
      COALESCE(SUM(CAST(grand_total AS DOUBLE)), 0)      AS total,
      COALESCE(SUM(CAST(total_tax AS DOUBLE)), 0)        AS tax,
      COALESCE(SUM(CAST(discount_amount AS DOUBLE)), 0)  AS discount
    FROM tbl_order
    WHERE order_status = 2
  `
  const row = result[0] || {}
  return Number(row.total || 0) - Number(row.tax || 0) - Number(row.discount || 0)
}
