'use server';
import { prisma } from '@/lib/prisma';

export default async function FetchProduct() {
  const products = await prisma.tbl_product.findMany({
    include: {
      inventories: true,
      prices: true,
      special_offers: true,
      tier_prices: true,
      tax: true,
    }
  });
  
  return products.map(product => ({
    ...product,
    packet_size: product.packet_size ?? 0 // Ensure packet_size is included and defaults to 0
  }));
}