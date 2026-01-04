'use server'
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

type AddCategory = {
    category_name: string,

}


export async function AddCategory({ category_name }: AddCategory) {
    try {

        const Category = await prisma.tbl_category.create({
            data: {
                category_name,
                created_datetime: new Date(),
            }
        })

        return { success: true, category_id: Category.category_id }; // ✅ plain object
    } catch (error: any) {
        return { success: false, error: error.message };
    }



}
