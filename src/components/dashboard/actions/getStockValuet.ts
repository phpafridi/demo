'use server'

import { prisma } from '@/lib/prisma'

export async function getStockValue() {
  try {
    // Use raw SQL for better performance
    const result: any[] = await prisma.$queryRaw`
      SELECT 
        SUM(i.product_quantity * COALESCE(pp.buying_price, 0)) as total_value
      FROM tbl_inventory i
      LEFT JOIN tbl_product p ON i.product_id = p.product_id
      LEFT JOIN (
        SELECT product_id, buying_price 
        FROM tbl_product_price 
        WHERE product_price_id IN (
          SELECT MAX(product_price_id) 
          FROM tbl_product_price 
          GROUP BY product_id
        )
      ) pp ON p.product_id = pp.product_id
    `

    const totalValue = Number(result[0]?.total_value || 0)
    
    return {
      success: true,
      totalValue: totalValue,
      formattedValue: totalValue.toFixed(2)
    }
  } catch (error: any) {
    console.error('Error calculating stock value:', error)
    return {
      success: false,
      totalValue: 0,
      formattedValue: '0.00',
      error: error.message
    }
  }
}