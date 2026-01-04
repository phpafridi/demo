'use server'

import { prisma } from '@/lib/prisma'

export interface SalesReportRow {
  id: number
  invoiceDate: Date
  invoiceNo: number | null
  buyingCost: number
  sellingCost: number
  tax: number
  discount: number
  grandTotal: number
  profit: number
}

export default async function FetchSalesReport(
  startDate: string,
  endDate: string
): Promise<SalesReportRow[]> {
  // Convert to start and end of day
  const start = new Date(startDate)
  start.setHours(0, 0, 0, 0)
  const end = new Date(endDate)
  end.setHours(23, 59, 59, 999)

  // Fetch invoices with related order details
  const invoices = await prisma.tbl_invoice.findMany({
    where: {
      invoice_date: {
        gte: start,
        lte: end,
      },
    },
    include: {
      order: {
        include: {
          details: true,
        },
      },
    },
  })

  // Map to report rows
  const rows: SalesReportRow[] = invoices.map((invoice) => {
    const details = invoice.order.details

    // Convert all Decimal fields to numbers
    const buyingCost = details.reduce(
      (sum, d) => sum + (Number(d.buying_price) * Number(d.product_quantity)),
      0
    )
    
    const sellingCost = details.reduce(
      (sum, d) => sum + (Number(d.selling_price) * Number(d.product_quantity)),
      0
    )
    
    const tax = details.reduce(
      (sum, d) => sum + Number(d.product_tax),
      0
    )
    
    const discount = Number(invoice.order.discount_amount) ?? 0
    const grandTotal = Number(invoice.order.grand_total)
    const profit = sellingCost - buyingCost - discount + tax

    return {
      id: invoice.invoice_id,
      invoiceDate: invoice.invoice_date,
      invoiceNo: invoice.invoice_no ?? null,
      buyingCost,
      sellingCost,
      tax,
      discount,
      grandTotal,
      profit,
    }
  })

  return rows
}