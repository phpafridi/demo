'use client'

import React, { useEffect, useState } from 'react'
import FetchOrderById, { OrderWithDetails } from './actions/FetchOrderById'
import { getCompanyLogo, getCompanyName } from './actions/FetchCompanyDetails'
import { FetchReturnByOrder } from './actions/ProcessReturn'
import InvoicePDF from './InvoicePDF'
import ReturnModal from './ReturnModal'
import ReturnInvoice from './ReturnInvoice'
import FetchProducts from '../Product/actions/FetchProduct'
import { useSession } from 'next-auth/react'

type OrderDetail = {
  product_id: number
  product_name: string
  product_code: string
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

type AllProduct = {
  product_id: number
  product_name: string
  product_code: string
  selling_price: number
  inventory: number
}

type ReturnRecord = {
  return_id: number
  return_no: number
  return_type: string
  return_date: string
  note: string | null
  processed_by: string
  items: {
    return_item_id: number
    product_name: string
    product_code: string
    qty: number
    unit_price: number
    sub_total: number
    item_type: string
  }[]
}

type Props = {
  id: string
  isOrder: boolean
}

export default function ViewInvoice({ id, isOrder }: Props) {
  const { data: session } = useSession()
  const [order, setOrder] = useState<OrderData | null>(null)
  const [rawDetails, setRawDetails] = useState<OrderDetail[]>([])
  const [companyName, setCompanyName] = useState<string>('')
  const [companyLogo, setCompanyLogo] = useState<string>('')
  const [showReturnModal, setShowReturnModal] = useState(false)
  const [returns, setReturns] = useState<ReturnRecord[]>([])
  const [showReturnInvoice, setShowReturnInvoice] = useState<ReturnRecord | null>(null)
  const [allProducts, setAllProducts] = useState<AllProduct[]>([])
  const orderId = Number(id)

  const getDisplayQuantity = (detail: OrderDetail) => {
    const packetSize = detail.packet_size
    const isMultiplePackets = packetSize > 0 && detail.product_quantity % packetSize === 0
    const displayQty = isMultiplePackets ? detail.product_quantity / packetSize : detail.product_quantity
    const displayUnit = isMultiplePackets ? 'packet' : detail.measurement_units
    return { displayQty, displayUnit }
  }

  const printInvoice = (id: string) => {
    const printContents = document.getElementById(id)?.innerHTML
    if (!printContents) return
    const printWindow = window.open('', '', 'width=800,height=600')
    if (printWindow) {
      printWindow.document.write(`
        <html><head><title>Invoice</title>
        <style>
          body{font-family:Arial,sans-serif;padding:20px;}
          table{width:100%;border-collapse:collapse;margin-top:20px;}
          th,td{border:1px solid #ddd;padding:8px;text-align:right;}
          th.desc,td.desc{text-align:left;}
          h1,h2{margin:0;}
          .status{font-weight:bold;padding:4px 8px;border-radius:6px;display:inline-block;}
          .pending{color:#b7791f;}.cancelled{color:#c53030;}.confirmed{color:#2f855a;}
          .returned{color:#c53030;}.exchanged{color:#2b6cb0;}
          .company{margin-top:20px;text-align:center;font-weight:bold;}
        </style></head>
        <body>${printContents}</body></html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const loadReturns = async () => {
    const data = await FetchReturnByOrder(orderId)
    setReturns(
      (data as any[]).map((r) => ({
        return_id: r.return_id,
        return_no: r.return_no,
        return_type: r.return_type,
        return_date: typeof r.return_date === 'string' ? r.return_date : r.return_date.toISOString(),
        note: r.note,
        processed_by: r.processed_by,
        items: r.items.map((item: any) => ({
          return_item_id: item.return_item_id,
          product_name: item.product_name,
          product_code: item.product_code,
          qty: Number(item.qty),
          unit_price: Number(item.unit_price),
          sub_total: Number(item.sub_total),
          item_type: item.item_type,
        })),
      }))
    )
  }

  useEffect(() => {
    const fetchOrder = async () => {
      const o = await FetchOrderById(orderId)
      if (!o) return
      const details: OrderDetail[] = (o.details as any[]).map((d) => ({
        product_id: (d as any).product_id || 0,
        product_name: d.product_name,
        product_code: (d as any).product_code || '',
        product_quantity: d.product_quantity,
        selling_price: d.selling_price,
        sub_total: d.sub_total,
        measurement_units: d.product?.measurement_units || '',
        packet_size: d.product?.packet_size || 0,
      }))
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
        details,
        grand_total: o.grand_total,
      }
      setOrder(mapped)
      setRawDetails(details)
    }
    const fetchCompany = async () => {
      const name = await getCompanyName()
      const logo = await getCompanyLogo()
      if (name) setCompanyName(name)
      if (logo) setCompanyLogo(logo)
    }
    const fetchProducts = async () => {
      const res = await FetchProducts()
      setAllProducts(
        (res || []).map((p: any) => ({
          product_id: p.product_id,
          product_name: p.product_name,
          product_code: p.product_code,
          selling_price: Number(p.prices?.[0]?.selling_price) || 0,
          inventory: Number(p.inventories?.[0]?.product_quantity) || 0,
        }))
      )
    }
    fetchOrder()
    fetchCompany()
    loadReturns()
    fetchProducts()
  }, [id])

  if (!order) return <div>Loading...</div>

  const statusMap: Record<number, { label: string; className: string }> = {
    0: { label: 'Pending', className: 'status pending' },
    1: { label: 'Cancelled', className: 'status cancelled' },
    2: { label: 'Confirmed', className: 'status confirmed' },
    3: { label: 'Returned (Refunded)', className: 'status returned' },
    4: { label: 'Exchanged', className: 'status exchanged' },
  }

  const canReturn = order.order_status === 2

  return (
    <div className="right-side">
      <section className="content-header">
        <ol className="breadcrumb">
          <li><a href="/dashboard/order-process/manage-order">Order History</a></li>
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
              <button onClick={() => printInvoice('printableArea')} className="btn btn-default">Print</button>
              <span className="btn btn-default"><InvoicePDF order={order} /></span>
              {canReturn && (
                <button className="btn btn-danger" onClick={() => setShowReturnModal(true)}>
                  <i className="fa fa-undo" /> Return / Exchange
                </button>
              )}
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
                          <div className={statusMap[order.order_status]?.className || ''}>
                            Order Status: {statusMap[order.order_status]?.label || 'Unknown'}
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

                    {returns.length > 0 && (
                      <div style={{ marginTop: 20, borderTop: '2px dashed #ccc', paddingTop: 12 }}>
                        <strong style={{ color: '#d9534f' }}>
                          <i className="fa fa-undo" /> RETURN / EXCHANGE HISTORY
                        </strong>
                        {returns.map((r) => (
                          <div key={r.return_id} style={{ marginTop: 6, background: '#fff8f8', border: '1px solid #f5c6cb', borderRadius: 4, padding: '4px 10px', fontSize: 13 }}>
                            <strong>RET-{r.return_no}</strong> — {r.return_type === 'payment' ? 'Payment Refund' : 'Exchange'} — {new Date(r.return_date).toLocaleDateString()} — by {r.processed_by}
                            {r.note && <span className="text-muted"> | Note: {r.note}</span>}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="company">{companyName || 'Company Name'}</div>
                  </main>
                </div>
              </div>
            </div>
          </div>
        </div>

        {returns.length > 0 && (
          <div className="box" style={{ marginTop: 20 }}>
            <div className="box-header with-border" style={{ background: '#f9dede' }}>
              <h3 className="box-title"><i className="fa fa-undo" /> Return / Exchange Records</h3>
            </div>
            <div className="box-body">
              <table className="table table-bordered table-hover">
                <thead>
                  <tr>
                    <th>Return No</th><th>Type</th><th>Date</th><th>Processed By</th><th>Items</th><th>Note</th><th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {returns.map((r) => (
                    <tr key={r.return_id}>
                      <td>RET-{r.return_no}</td>
                      <td>{r.return_type === 'payment' ? <span className="label label-danger">Refund</span> : <span className="label label-info">Exchange</span>}</td>
                      <td>{new Date(r.return_date).toLocaleDateString()}</td>
                      <td>{r.processed_by}</td>
                      <td>{r.items.filter((i) => i.item_type === 'returned').length} item(s)</td>
                      <td>{r.note || '—'}</td>
                      <td><button className="btn btn-xs btn-default" onClick={() => setShowReturnInvoice(r)}><i className="fa fa-eye" /> View</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showReturnModal && (
        <ReturnModal
          orderId={orderId}
          orderNo={Number(order.order_no)}
          orderDetails={rawDetails}
          allProducts={allProducts}
          processedBy={session?.user?.name || session?.user?.email || 'Staff'}
          onClose={() => setShowReturnModal(false)}
          onSuccess={async () => {
            setShowReturnModal(false)
            await loadReturns()
            const o = await FetchOrderById(orderId)
            if (o) setOrder((prev) => prev ? { ...prev, order_status: o.order_status } : prev)
          }}
        />
      )}

      {showReturnInvoice && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, overflowY: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 40 }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowReturnInvoice(null) }}>
          <div style={{ background: '#fff', borderRadius: 8, padding: 24, maxWidth: 750, width: '95%' }}>
            <ReturnInvoice
              returnData={{
                return_no: showReturnInvoice.return_no,
                return_type: showReturnInvoice.return_type as 'payment' | 'exchange',
                return_date: showReturnInvoice.return_date,
                order_no: Number(order.order_no),
                customer_name: order.customer_name,
                customer_phone: order.customer_phone,
                processed_by: showReturnInvoice.processed_by,
                note: showReturnInvoice.note || undefined,
                items: showReturnInvoice.items.map(i => ({ ...i, item_type: i.item_type as 'exchange' | 'returned' })),

                companyName,
              }}
              onClose={() => setShowReturnInvoice(null)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
