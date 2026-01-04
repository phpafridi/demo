'use server'

import { prisma } from '@/lib/prisma'

export async function FetchSuppliers() {
  return await prisma.tbl_supplier.findMany({
    orderBy: {  supplier_id: 'desc' }, // latest first
  })
}
