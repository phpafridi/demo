'use server'

import { prisma } from '@/lib/prisma'

// Type definition for returning order
export type OrderWithDetails = {
  order_id: number
  order_no: number
  order_date: string  // Changed from Date to string for serialization
  customer_name: string
  customer_email: string
  customer_phone: string
  customer_address: string
  shipping_address: string
  sales_person: string
  total_tax: number
  grand_total: number
  order_status: number
  details: {
    product_name: string
    product_quantity: number
    selling_price: number
    sub_total: number
    product: {
      measurement_units: string
      packet_size: number
    } | null
  }[]
}

export default async function FetchOrderById(orderId: number): Promise<OrderWithDetails | null> {
  try {
    if (!orderId || isNaN(orderId)) {
      throw new Error('Invalid order ID')
    }

    const order = await prisma.tbl_order.findUnique({
      where: { order_id: orderId },
      include: {
        details: {
          include: { 
            product: {
              select: {
                measurement_units: true,
                packet_size: true
              }
            }
          },
        },
      },
    })

    if (!order) return null

    // Convert all Decimal fields to numbers
    return {
      order_id: order.order_id,
      order_no: order.order_no,
      order_date: order.order_date.toISOString(), // Convert Date to string
      customer_name: order.customer_name,
      customer_email: order.customer_email,
      customer_phone: order.customer_phone,
      customer_address: order.customer_address,
      shipping_address: order.shipping_address,
      sales_person: order.sales_person,
      total_tax: Number(order.total_tax), // Convert Decimal to number
      grand_total: Number(order.grand_total), // Convert Decimal to number
      order_status: order.order_status,
      details: order.details.map(detail => ({
        product_name: detail.product_name,
        product_quantity: Number(detail.product_quantity), // Convert Decimal to number
        selling_price: Number(detail.selling_price), // Convert Decimal to number
        sub_total: Number(detail.sub_total), // Convert Decimal to number
        product: detail.product ? {
          measurement_units: detail.product.measurement_units || '',
          packet_size: Number(detail.product.packet_size) || 0 // Convert Decimal to number
        } : null
      }))
    }
  } catch (err) {
    console.error(`❌ FetchOrderById error for ID ${orderId}:`, err)
    throw new Error('Failed to fetch order')
  }
}