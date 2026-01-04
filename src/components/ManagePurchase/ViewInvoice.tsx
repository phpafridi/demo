'use client'

import React, { useEffect, useState } from 'react'
import FetchPurchaseHistory from '../ManagePurchase/actions/FetchPurchaseHistory'
import PurchaseInvoicePDF from './InvoicePDF'

type PurchaseDetail = {
  product_name: string
  qty: number
  unit_price: number
  sub_total: number
  measurement_unit: string
  packet_size: number
}

type PurchaseData = {
  purchase_order_number: string
  supplier_name: string
  supplier_address: string
  supplier_phone: string
  supplier_email: string
  purchase_by: string
  datetime: string
  details: PurchaseDetail[]
  grand_total: number
}

type Props = {
  id: string
}

export default function ViewInvoice({ id }: Props) {
  const [purchase, setPurchase] = useState<PurchaseData | null>(null)

  const getDisplayQuantity = (detail: PurchaseDetail) => {
    const packetSize = detail.packet_size
    const isMultiplePackets = packetSize > 0 && detail.qty % packetSize === 0
    const displayQty = isMultiplePackets ? (detail.qty / packetSize) : detail.qty
    const displayUnit = isMultiplePackets ? 'packet' : detail.measurement_unit
    
    return { displayQty, displayUnit }
  }

  const printInvoice = (id: string) => {
    const printContents = document.getElementById(id)?.innerHTML
    if (!printContents) return
    const originalContents = document.body.innerHTML
    document.body.innerHTML = printContents
    window.print()
    document.body.innerHTML = originalContents
    window.location.reload()
  }

  useEffect(() => {
    const fetchPurchase = async () => {
      const allPurchases = await FetchPurchaseHistory()

      const p = allPurchases.find(p => p.purchase_id === Number(id))
      if (!p) return

      const mapped: PurchaseData = {
        purchase_order_number: `PUR${p.purchase_order_number}`,
        supplier_name: p.supplier?.supplier_name || '',
        supplier_address: p.supplier?.address || '',
        supplier_phone: p.supplier?.phone || '',
        supplier_email: p.supplier?.email || '',
        purchase_by: p.purchase_by,
        datetime: new Date(p.datetime).toLocaleDateString(),
        details: p.details.map(d => ({
          product_name: d.product?.product_name || '',
          qty: Number(d.qty),
          unit_price: Number(d.unit_price),
          sub_total: Number(d.sub_total),
          measurement_unit: d.product?.measurement_units || '',
          packet_size: Number(d.product?.packet_size) || 0, // Convert packet_size to number
        })),
        grand_total: Number(p.grand_total),
      }

      setPurchase(mapped)
    }

    fetchPurchase()
  }, [id])

  if (!purchase) return <div>Loading...</div>

  return (
    <div className="right-side">
      <section className="content-header">
        <ol className="breadcrumb">
          <li>
            <a href="/dashboard/manage-purchase">Purchase History</a>
          </li>
          <li>
            <a href="#">Purchase</a>
          </li>
          <li>
            <a href="#">Manage Purchase</a>
          </li>
        </ol>
      </section>

      <br />
      <div className="container-fluid">
        <div className="box">
          <div className="box-header box-header-background with-border">
            <h3 className="box-title">Purchase Invoice</h3>
            <div className="btn-group pull-right">
              <button onClick={() => printInvoice('printableArea')} className="btn btn-default">
                Print
              </button>
               {purchase &&  <span className='btn btn-default'><PurchaseInvoicePDF purchase={purchase} /></span>}
            </div>
          </div>

          <div className="box-body">
            <div id="printableArea">
              <div className="row">
                <div className="col-md-8 col-md-offset-2">
                  <main>
                    <div id="details" className="clearfix">
                      <div id="client">
                        <div className="to">SUPPLIER:</div>
                        <h2 className="name">{purchase.supplier_name}</h2>
                        <div className="address">
                          <p>{purchase.supplier_address}</p>
                        </div>
                        <div className="address">{purchase.supplier_phone}</div>
                        <div className="email">{purchase.supplier_email}</div>
                      </div>

                      <div id="invoice">
                        <h1>{purchase.purchase_order_number}</h1>
                        <div className="date">Date of Invoice: {purchase.datetime}</div>
                        <div className="date">Purchase by: {purchase.purchase_by}</div>
                      </div>
                    </div>

                    <table border={0} cellSpacing={0} cellPadding={0}>
                      <thead>
                        <tr>
                          <th className="no text-right">#</th>
                          <th className="desc">DESCRIPTION</th>
                          <th className="unit text-right">UNIT PRICE</th>
                          <th className="qty text-right">QUANTITY</th>
                          <th className="total text-right">TOTAL</th>
                        </tr>
                      </thead>
                      <tbody>
                        {purchase.details.map((d, idx) => {
                          const { displayQty, displayUnit } = getDisplayQuantity(d)
                          
                          return (
                            <tr key={idx}>
                              <td className="no">{idx + 1}</td>
                              <td className="desc">{d.product_name}</td>
                              <td className="unit">{d.unit_price.toFixed(2)}</td>
                              <td className="qty">
                                {displayQty} {displayUnit}
                              </td>
                              <td className="total">{d.sub_total.toFixed(2)}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={2}></td>
                          <td colSpan={2}>GRAND TOTAL</td>
                          <td>{purchase.grand_total.toFixed(2)}</td>
                        </tr>
                      </tfoot>
                    </table>
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