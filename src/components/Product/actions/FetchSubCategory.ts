'use server'
import { prisma } from '@/lib/prisma'


export async function FetchSubCategory() {
    const Subcategories = await prisma.tbl_subcategory.findMany({
        include : {
           category : true,
        }
    });
    return Subcategories;

}
