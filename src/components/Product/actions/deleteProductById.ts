'use server';

import { prisma } from '@/lib/prisma';

export async function deleteProductById(id: number) {

    const product = await prisma.tbl_product.findUnique({
        where: { product_id: id },
    });

    if (!product) {
        throw new Error('Product not found');
    }

    await prisma.tbl_product.delete({
        where: { product_id: id },
    });

    

}