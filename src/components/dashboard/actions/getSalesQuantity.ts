'use server'
import { prisma } from '@/lib/prisma'

export async function getSalesQuantity() {
  // Count confirmed + exchanged orders (both represent completed sales)
  const result: any[] = await prisma.$queryRaw`
    SELECT COUNT(*) AS cnt FROM tbl_order WHERE order_status IN (2, 4)
  `
  return Number(result[0]?.cnt || 0)
}
