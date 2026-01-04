'use client'
import React, { useState } from 'react'
import FetchSalesReport, { SalesReportRow } from './actions/FetchSalesReport'
import SalesReportPDF from './SalesReportPDF'
import { PDFDownloadLink } from '@react-pdf/renderer'

export default function SalesReport() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [report, setReport] = useState<SalesReportRow[]>([])
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!startDate || !endDate) return
    setLoading(true)
    const data = await FetchSalesReport(startDate, endDate)
    setReport(data)
    setLoading(false)
  }

  const totalCost = report.reduce((s, r) => s + r.buyingCost, 0)
  const totalRevenue = report.reduce((s, r) => s + r.sellingCost, 0)
  const totalProfit = report.reduce((s, r) => s + r.profit, 0)
  const totalGrand = report.reduce((s, r) => s + r.grandTotal, 0)

  return (
    <section className="content">
      <div className="row">
        <div className="col-md-12">
          <div className="box box-primary">
            <div className="box-header text-center">
              <h3 className="box-title">Sales Report</h3>
            </div>

            {/* Show buttons only if report is generated */}
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
                    <SalesReportPDF
                      startDate={startDate}
                      endDate={endDate}
                      report={report}
                      totals={{ totalCost, totalRevenue, totalProfit, totalGrand }}
                    />
                  }
                  fileName={`sales-report-${startDate}-to-${endDate}.pdf`}
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

            {/* Report */}
            <div className="p-3">
              {report.length === 0 ? (
                <p className="text-center">No records to display</p>
              ) : (
                <div id="printableArea">
                  <h4 className="text-center mb-4">
                    Sales Report from <strong>{startDate}</strong> to{' '}
                    <strong>{endDate}</strong>
                  </h4>

                  <table className="table table-bordered text-center">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Invoice No</th>
                        <th>Date</th>
                        <th>Buying (cost)</th>
                        <th>Selling</th>
                        <th>Tax</th>
                        <th>Discount</th>
                        <th>Grand Total</th>
                        <th>Profit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.map((row, i) => (
                        <tr key={row.id}>
                          <td>{i + 1}</td>
                          <td>{row.invoiceNo ?? '-'}</td>
                          <td>{new Date(row.invoiceDate).toLocaleDateString()}</td>
                          <td>{row.buyingCost.toFixed(2)}</td>
                          <td>{row.sellingCost.toFixed(2)}</td>
                          <td>{row.tax.toFixed(2)}</td>
                          <td>{row.discount.toFixed(2)}</td>
                          <td>{row.grandTotal.toFixed(2)}</td>
                          <td>{row.profit.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={3}></td>
                        <td><strong>{totalCost.toFixed(2)}</strong></td>
                        <td><strong>{totalRevenue.toFixed(2)}</strong></td>
                        <td></td>
                        <td></td>
                        <td><strong>{totalGrand.toFixed(2)}</strong></td>
                        <td><strong>{totalProfit.toFixed(2)}</strong></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
