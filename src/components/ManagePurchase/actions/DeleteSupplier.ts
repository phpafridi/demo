'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function DeleteSupplier(id: number) {
  await prisma.tbl_supplier.delete({
    where: { supplier_id: id },
  })

  // ✅ Refresh the supplier list page after delete
  revalidatePath('/dashboard/manage-purchase/supplier/manage-supplier')
}
