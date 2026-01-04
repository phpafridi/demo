'use server';

import { prisma } from '@/lib/prisma';

export async function deleteCategoryById(id: number) {

    const category = await prisma.tbl_category.findUnique({
        where: { category_id : id },
    });

    if (!category) {
        throw new Error('Category not found');
    }

    await prisma.tbl_category.delete({
        where: { category_id: id },
    });

    

}