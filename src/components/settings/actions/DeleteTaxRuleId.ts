'use server';

import { prisma } from '@/lib/prisma';

export async function deleteTaxRuleId(id: number) {

    const tax = await prisma.tbl_tax.findUnique({
        where: { tax_id : id },
    });

    if (!tax) {
        throw new Error('Tax not found');
    }

    await prisma.tbl_tax.delete({
        where: { tax_id: id },
    });

    

}