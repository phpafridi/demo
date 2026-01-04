'use client'

import React, { useState } from 'react'
import FetchPurchaseReport, { PurchaseReportRow } from './actions/FetchPurchaseReport'
import PurchaseReportPDF from './PurchaseReportPDF'
import { PDFDownloadLink } from '@react-pdf/renderer'

export default function PurchaseReport() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [report, setReport] = useState<PurchaseReportRow[]>([])
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!startDate || !endDate) return
    setLoading(true)
    const data = await FetchPurchaseReport(startDate, endDate)
    setReport(data)
    setLoading(false)
  }

  const totalQty = report.reduce((s, r) => s + r.items.reduce((x, i) => x + i.qty, 0), 0)
  const totalAmount = report.reduce((s, r) => s + r.grandTotal, 0)

  return (
    <section className="content">
      <div className="row">
        <div className="col-md-12">
          <div className="box box-primary">
            <div className="box-header text-center">
              <h3 className="box-title">Purchase Report</h3>
            </div>

            {/* Buttons only if report exists */}
            {report.length > 0 && (
              <div className="text-center mt-3 mb-3 no-print">
                <button
                  onClick={() => window.print()}
                  className="btn btn-info btn-flat mr-2"
                >
                  Print
                </button>
                <PDFDownloadLink
                  document={
                    <PurchaseReportPDF
                      startDate={startDate}
                      endDate={endDate}
                      report={report}
                      totals={{ totalQty, totalAmount }}
                    />
                  }
                  fileName={`purchase-report-${startDate}-to-${endDate}.pdf`}
                >
                  {({ loading }) =>
                    loading ? (
                      <button className="btn btn-warning btn-flat">Preparing PDF...</button>
                    ) : (
                      <button className="btn btn-success btn-flat">Download PDF</button>
                    )
                  }
                </PDFDownloadLink>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-3 no-print">
              <div className="row mb-3">
                <div className="col-md-6">
                  <label>Start Date *</label>
                  <input
                    type="date"
                    className="form-control"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label>End Date *</label>
                  <input
                    type="date"
                    className="form-control"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="text-center">
                <button type="submit" className="btn bg-navy btn-flat">
                  {loading ? 'Loading...' : 'Generate Report'}
                </button>
              </div>
            </form>

            {/* Report Table */}
            <div className="p-3">
              {report.length === 0 ? (
                <p className="text-center">No records to display</p>
              ) : (
                <div id="printableArea">
                  <h4 className="text-center mb-4">
                    Purchase Report from <strong>{startDate}</strong> to{' '}
                    <strong>{endDate}</strong>
                  </h4>

                  {report.map((purchase) => (
                    <div key={purchase.id} className="mb-5">
                      <h5 className="text-center">
                        Ref: <strong>{purchase.ref}</strong> | Supplier:{' '}
                        <strong>{purchase.supplier}</strong> | Date:{' '}
                        <strong>{purchase.date}</strong>
                      </h5>

                      <table className="table table-bordered text-center">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Product Code</th>
                            <th>Description</th>
                            <th>Buying Price</th>
                            <th>Qty</th>
                            <th>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {purchase.items.map((item, i) => (
                            <tr key={i}>
                              <td>{i + 1}</td>
                              <td>{item.code}</td>
                              <td>{item.name}</td>
                              <td>{item.price.toFixed(2)}</td>
                              <td>
                                {item.qty} {item.unit}
                              </td>
                              <td>{item.total.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td colSpan={5}>
                              <strong>Grand Total</strong>
                            </td>
                            <td>
                              <strong>{purchase.grandTotal.toFixed(2)}</strong>
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  ))}

                  {/* Overall totals */}
                  <div className="mt-4 text-right">
                    <h5>
                      Total Qty: <strong>{totalQty}</strong>
                    </h5>
                    <h5>
                      Total Amount: <strong>{totalAmount.toFixed(2)}</strong>
                    </h5>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}