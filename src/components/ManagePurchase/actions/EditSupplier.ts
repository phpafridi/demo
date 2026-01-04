'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// 1. Get supplier by ID
export async function GetSupplier(id: number | string) {
  return await prisma.tbl_supplier.findUnique({
    where: { supplier_id: Number(id) }, // ✅ ensure it's an Int
  })
}

// 2. Update supplier
export async function UpdateSupplier(id: number | string, formData: FormData) {
  const company_name = formData.get('company_name') as string
  const supplier_name = formData.get('supplier_name') as string
  const email = formData.get('email') as string
  const phone = formData.get('phone') as string
  const address = formData.get('address') as string

  await prisma.tbl_supplier.update({
    where: { supplier_id: Number(id) }, // ✅ cast to number
    data: {
      company_name,
      supplier_name,
      email,
      phone,
      address,
    },
  })

  // Refresh list after edit
  revalidatePath('/dashboard/manage-purchase/supplier/manage-supplier')

  // Redirect back to list
  redirect('/dashboard/manage-purchase/supplier/manage-supplier')
}
