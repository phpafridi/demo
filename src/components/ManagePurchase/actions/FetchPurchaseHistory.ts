'use server'

import { prisma } from '@/lib/prisma'

export default async function FetchPurchaseHistory() {
  try {
    const purchases = await prisma.tbl_purchase.findMany({
      orderBy: {
        purchase_id: 'desc',
      },
      include: {
        supplier: true,
        details: {
          include: {
            product: {
              select: {
                product_name: true,
                measurement_units: true,
                packet_size: true,
              },
            },
          },
        },
      },
    })

    // Convert all Decimal fields to numbers
    return purchases.map(purchase => ({
      ...purchase,
      grand_total: Number(purchase.grand_total), // Convert Decimal to number
      datetime: purchase.datetime.toISOString(),
      details: purchase.details.map(detail => ({
        ...detail,
        qty: Number(detail.qty), // Convert Decimal to number
        unit_price: Number(detail.unit_price), // Convert Decimal to number
        sub_total: Number(detail.sub_total), // Convert Decimal to number
        product: detail.product ? {
          ...detail.product,
          packet_size: detail.product.packet_size ? Number(detail.product.packet_size) : null // Convert Decimal to number
        } : null
      }))
    }))
  } catch (err) {
    console.error('FetchPurchaseHistory error:', err)
    return []
  }
}