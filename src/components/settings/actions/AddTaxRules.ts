'use server'
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

type AddTax = {
    title: string,
    rate: number,
    taxType: number
}


export async function AddTaxRules({ title, rate, taxType }: AddTax) {
    try {

        const TaxRule = await prisma.tbl_tax.create({
            data: {
                tax_title: title,
                tax_rate: rate,
                tax_type: taxType
            }
        })

        return { success: true, tax_id: TaxRule.tax_id }; // ✅ plain object
    } catch (error: any) {
        return { success: false, error: error.message };
    }



}
