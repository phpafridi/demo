'use server';

import { prisma } from '@/lib/prisma';

export async function deleteSubCategoryById(id: number) {

    const subcategory = await prisma.tbl_subcategory.findUnique({
        where: { subcategory_id : id },
    });

    if (!subcategory) {
        throw new Error('Category not found');
    }

    await prisma.tbl_subcategory.delete({
        where: { subcategory_id: id },
    });

    

}