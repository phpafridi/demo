'use server'
import { prisma } from '@/lib/prisma'

export async function ProductById(id: string) {
    const pid = Number(id);
  const product = await prisma.tbl_product.findUnique({
    where: { product_id: pid },
    include: {
      inventories: true,
      prices: true,
      tier_prices: true,
      special_offers: true,
      attributes: true,
      tags: true,
      tax: true,
      subcategory: { include: { category: true } },
      // ADDED: Include product images if you have them
      images: true
    }
  })

  // Return the product with all the expiration fields
  // These will be available once you update your Prisma schema
  return product
}