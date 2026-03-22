'use server'
import { prisma } from '@/lib/prisma'

export async function getRevenue() {
  // Only count confirmed orders — exclude returned (3) and exchanged (4)
  const result: any[] = await prisma.$queryRaw`
    SELECT COALESCE(SUM(CAST(grand_total AS DOUBLE)), 0) AS total
    FROM tbl_order
    WHERE order_status = 2
  `
  return Number(result[0]?.total || 0)
}
