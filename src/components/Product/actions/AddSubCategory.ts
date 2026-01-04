'use server' 
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
export async function AddSubCategory(category_id: number, subcategory_name: string) {
    try {
        const subCategory = await prisma.tbl_subcategory.create({
            data: {
                category_id,
                subcategory_name,
                created_datetime: new Date(),
            },
        });

        return { success: true, category_id: subCategory.category_id };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
