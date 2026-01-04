'use server'
import { prisma } from '@/lib/prisma'

export type ProductSummary = {
  id: number
  sku: string
  name: string
  cost: number
  qty: number
  measurement_units: string
  stockValue: number
  packet_size: number
}

export default async function FetchProduct(): Promise<ProductSummary[]> {
  const products = await prisma.tbl_product.findMany({
    include: {
      inventories: {
        select: { product_quantity: true },
      },
      prices: {
        select: { buying_price: true },
      },
    },
  })

  return products.map((p) => {
    const qty = Number(p.inventories?.[0]?.product_quantity) ?? 0  // Convert to number
    const cost = Number(p.prices?.[0]?.buying_price) ?? 0         // Convert to number
    const measurement_units = p.measurement_units ?? 'N/A'
    const packet_size = p.packet_size === null ? 0 : Number(p.packet_size) ?? 0  // Convert to number

    return {
      id: p.product_id,
      sku: p.product_code,
      name: p.product_name,
      cost,  // Now this is a number
      qty,   // Now this is a number
      measurement_units,
      stockValue: cost * qty,  // This works with numbers
      packet_size,  // Now this is a number
    }
  })
}