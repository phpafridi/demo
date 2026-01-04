'use server'
import { prisma } from '@/lib/prisma'


export async function FetchCategory() {
    const categories = await prisma.tbl_category.findMany();
    return categories;

}
