'use server'

import { prisma } from '@/lib/prisma'

export async function AddSupplier(formData: FormData) {
  const company_name = formData.get('company_name') as string
  const supplier_name = formData.get('supplier_name') as string
  const email = formData.get('email') as string
  const phone = formData.get('phone') as string
  const address = formData.get('address') as string

  try {
    await prisma.tbl_supplier.create({
      data: {
        company_name,
        supplier_name,
        email,
        phone,
        address,
      },
    })

    return {
      success: true,
      message: '🎉 Supplier added successfully!',
    }
  } catch (error: any) {
    console.error('Error adding supplier:', error)
    return {
      success: false,
      message: '❌ Failed to add supplier: ' + (error?.message ?? 'Unknown error'),
    }
  }
}
