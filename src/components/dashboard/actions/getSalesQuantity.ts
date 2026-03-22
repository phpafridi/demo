'use server'
import { prisma } from '@/lib/prisma'

export async function getSalesQuantity() {
  // Count only confirmed orders — returned (3) and exchanged (4) excluded
  const result: any[] = await prisma.$queryRaw`
    SELECT COUNT(*) AS cnt FROM tbl_order WHERE order_status = 2
  `
  return Number(result[0]?.cnt || 0)
}
