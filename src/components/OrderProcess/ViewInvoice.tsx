'use client'

import React, { useEffect, useState } from 'react'
import FetchOrderById, { OrderWithDetails } from './actions/FetchOrderById'
import { getCompanyLogo, getCompanyName } from './actions/FetchCompanyDetails'
import InvoicePDF from './InvoicePDF'

// Types for mapped data
type OrderDetail = {
  product_name: string
  product_quantity: number
  selling_price: number
  sub_total: number
  measurement_units: string
  packet_size: number
}

type OrderData = {
  order_no: string
  customer_name: string
  customer_email: string
  customer_phone: string
  customer_address: string
  sales_person: string
  tax: number
  datetime: string
  order_status: number
  details: OrderDetail[]
  grand_total: number
}

type Props = {
  id: string
  isOrder: boolean
}

export default function ViewInvoice({ id, isOrder }: Props) {
  const [order, setOrder] = useState<OrderData | null>(null)
  const [companyName, setCompanyName] = useState<string>("")
  const [companyLogo, setCompanyLogo] = useState<string>("")

  const getDisplayQuantity = (detail: OrderDetail) => {
    const packetSize = detail.packet_size
    const isMultiplePackets = packetSize > 0 && detail.product_quantity % packetSize === 0
    const displayQty = isMultiplePackets ? (detail.product_quantity / packetSize) : detail.product_quantity
    const displayUnit = isMultiplePackets ? 'packet' : detail.measurement_units
    
    return { displayQty, displayUnit }
  }

  const printInvoice = (id: string) => {
    const printContents = document.getElementById(id)?.innerHTML
    if (!printContents) return

    const printWindow = window.open('', '', 'width=800,height=600')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Invoice</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
              th.desc, td.desc { text-align: left; }
              h1, h2 { margin: 0; }
              .status { font-weight: bold; padding: 4px 8px; border-radius: 6px; display: inline-block; }
              .pending { color: #b7791f; }
              .cancelled { color: #c53030; }
              .confirmed { color: #2f855a; }
              .company { margin-top: 20px; text-align: center; font-weight: bold; }
            </style>
          </head>
          <body>${printContents}</body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  useEffect(() => {
    const fetchOrder = async () => {
      const o = await FetchOrderById(Number(id))
      if (!o) return

      const mapped: OrderData = {
        order_no: `${o.order_no}`,
        customer_name: o.customer_name,
        customer_email: o.customer_email,
        customer_phone: o.customer_phone,
        customer_address: o.customer_address,
        sales_person: o.sales_person,
        order_status: o.order_status,
        tax: o.total_tax,
        datetime: new Date(o.order_date).toLocaleString(),
        details: o.details.map(d => ({
          product_name: d.product_name,
          product_quantity: d.product_quantity,
          selling_price: d.selling_price,
          sub_total: d.sub_total,
          measurement_units: d.product?.measurement_units || "",
          packet_size: d.product?.packet_size || 0,
        })),
        grand_total: o.grand_total,
      }

      setOrder(mapped)
    }

    const fetchCompany = async () => {
      const name = await getCompanyName()
      const logo = await getCompanyLogo()
      if (name) setCompanyName(name)
      if (logo) setCompanyLogo(logo)
    }

    fetchOrder()
    fetchCompany()
  }, [id])

  if (!order) return <div>Loading...</div>

  const statusMap: Record<number, { label: string; className: string }> = {
    0: { label: "Pending", className: "status pending" },
    1: { label: "Cancelled", className: "status cancelled" },
    2: { label: "Confirmed", className: "status confirmed" },
  }

  return (
    <div className="right-side">
      <section className="content-header">
        <ol className="breadcrumb">
          <li><a href="/dashboard/manage-order">Order History</a></li>
          <li><a href="#">Order</a></li>
          <li><a href="#">Manage Order</a></li>
        </ol>
      </section>

      <br />
      <div className="container-fluid">
        <div className="box">
          <div className="box-header box-header-background with-border">
            <h3 className="box-title">Order Invoice</h3>
            <div className="btn-group pull-right">
              <button
                onClick={() => printInvoice('printableArea')}
                className="btn btn-default"
              >
                Print
              </button>

              <span className='btn btn-default'><InvoicePDF order={order} /></span>
              
            </div>
          </div>

          {companyLogo && (
            <div className="flex justify-center">
              <img src={`/api/uploads/${encodeURIComponent(companyLogo ?? 'default.jpg')}`} alt="Company Logo" className="h-50" />
            </div>
          )}

          <div className="box-body">
            <div id="printableArea">
              <div className="row">
                <div className="col-md-8 col-md-offset-2">
                  <main>
                    <div id="details" className="clearfix">
                      {!isOrder && (
                        <div id="client">
                          <div className="to">CUSTOMER:</div>
                          <h2 className="name">{order.customer_name}</h2>
                          <div className="address">{order.customer_address}</div>
                          <div className="address">{order.customer_phone}</div>
                          <div className="email">{order.customer_email}</div>
                        </div>
                      )}

                      <div id="invoice">
                        <h1>{isOrder ? `ORD ${order.order_no}` : `INV ${order.order_no}`}</h1>
                        <div className="date">Date of Order: {order.datetime}</div>
                        <div className="date">Sales Person: {order.sales_person}</div>
                        {isOrder && (
                          <div className={statusMap[order.order_status]?.className || ""}>
                            Order Status : {statusMap[order.order_status]?.label || "Unknown"}
                          </div>
                        )}
                      </div>
                    </div>

                    <table>
                      <thead>
                        <tr>
                          <th className="no">#</th>
                          <th className="desc">DESCRIPTION</th>
                          <th className="unit">UNIT PRICE</th>
                          <th className="unit">TAX</th>
                          <th className="qty">QUANTITY</th>
                          <th className="unit">UNIT</th>
                          <th className="total">TOTAL</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.details.map((d, idx) => {
                          const { displayQty, displayUnit } = getDisplayQuantity(d)
                          
                          return (
                            <tr key={idx}>
                              <td>{idx + 1}</td>
                              <td className="desc">{d.product_name}</td>
                              <td>{d.selling_price.toFixed(2)}</td>
                              <td>{order.tax}</td>
                              <td>{displayQty}</td>
                              <td>{displayUnit}</td>
                              <td>{d.sub_total.toFixed(2)}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={5}></td>
                          <td>GRAND TOTAL</td>
                          <td>{order.grand_total.toFixed(2)}</td>
                        </tr>
                      </tfoot>
                    </table>

                    <div className="company">
                      {companyName || "Company Name"}
                    </div>
                  </main>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}