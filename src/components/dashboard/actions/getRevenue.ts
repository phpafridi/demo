'use server'
import { prisma } from '@/lib/prisma'

export async function getRevenue() {
  // Status 2 = confirmed, Status 4 = exchanged (money stays, products swapped)
  // Status 3 = refunded (money returned to customer) — excluded
  const result: any[] = await prisma.$queryRaw`
    SELECT COALESCE(SUM(CAST(grand_total AS DOUBLE)), 0) AS total
    FROM tbl_order
    WHERE order_status IN (2, 4)
  `
  return Number(result[0]?.total || 0)
}
