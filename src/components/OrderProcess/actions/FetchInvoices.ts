'use server'

import { prisma } from '@/lib/prisma'

export type SerializedInvoice = {
  invoice_id: number
  invoice_no: number | null
  invoice_date: string
  order_id: number
  order: {
    order_no: number
    grand_total: number
    sales_person: string
    payment_method: string
    customer: {
      customer_name: string
      phone: string
    }
  }
}

export async function FetchInvoices(): Promise<SerializedInvoice[]> {
  try {
    const invoices = await prisma.tbl_invoice.findMany({
      include: {
        order: {
          include: {
            customer: true,
          },
        },
      },
      orderBy: {
        invoice_date: 'desc',
      },
    })

    return invoices.map((inv) => ({
      ...inv,
      invoice_date: inv.invoice_date.toISOString(),
      order: {
        ...inv.order,
        grand_total: Number(inv.order.grand_total), // Convert Decimal to number
        
        // Include other order fields that might be needed
        order_no: inv.order.order_no,
        sales_person: inv.order.sales_person,
        payment_method: inv.order.payment_method,
        customer: {
          customer_name: inv.order.customer.customer_name,
          phone: inv.order.customer.phone,
        }
      }
    }))
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return []
  }
}