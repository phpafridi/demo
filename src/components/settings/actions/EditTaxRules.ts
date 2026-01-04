'use server'

import { prisma } from '@/lib/prisma';

export async function EditTaxRules(id: number, title: string, rate: number, taxType: number) {
  try {
    await prisma.tbl_tax.update({
      where: { tax_id: id },
      data: {
        tax_title: title,
        tax_rate: rate,
        tax_type: taxType,
      },
    })
    return { success: true }
  } catch (error) {
    console.error(error)
    return { success: false, error: 'Failed to update tax rule' }
  }
}
