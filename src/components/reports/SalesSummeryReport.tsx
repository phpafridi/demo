'use client'
import React, { useState } from 'react'
import type { SalesReportRow } from './actions/FetchSalesReport'
import FetchSalesReport from './actions/FetchSalesReport'
import { PDFDownloadLink } from '@react-pdf/renderer'
import SalesSummaryPDF from './SalesSummaryPDF'

export default function SalesSummeryReport() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [report, setReport] = useState<SalesReportRow[]>([]) // Change to SalesReportRow
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!startDate || !endDate) return
    setLoading(true)
    const data = await FetchSalesReport(startDate, endDate) // Use FetchSalesReport
    setReport(data)
    setLoading(false)
  }

  const handlePrint = () => {
    const printContent = document.getElementById('printableArea')?.innerHTML
    if (!printContent) return
    const win = window.open('', '', 'width=900,height=650')
    win?.document.write(`
      <html>
        <head>
          <title>Sales Summary Report</title>
          <style>
            table { width: 100%; border-collapse: collapse; text-align: center; }
            th, td { border: 1px solid #000; padding: 6px; }
            h4 { text-align: center; margin-bottom: 15px; }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `)
    win?.document.close()
    win?.print()
  }

  return (
    <section className="content">
      <div className="row">
        <div className="col-md-12">
          <div className="box box-primary">
            <div className="box-header with-border text-center">
              <h3 className="box-title">Sales Summary Report</h3>
            </div>

            {/* Form */}
            <div className="box-background p-3">
              <form onSubmit={handleSubmit} className="text-center">
                <div className="row justify-center mb-3">
                  <div className="col-md-4 col-sm-12">
                    <label>Start Date *</label>
                    <input
                      type="date"
                      className="form-control"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-4 col-sm-12">
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
                <button type="submit" className="btn bg-navy btn-flat">
                  {loading ? 'Loading...' : 'Generate Report'}
                </button>
              </form>
            </div>

            {/* Report */}
            <div className="box-body mt-3">
              {report.length === 0 ? (
                <p className="text-center">
                  {loading ? 'Loading report...' : 'No record to display'}
                </p>
              ) : (
                <>
                  {/* Buttons */}
                  <div className="text-center mb-3">
                    <button onClick={handlePrint} className="btn btn-info btn-flat mr-2">
                      Print
                    </button>
                    <PDFDownloadLink
                      document={
                        <SalesSummaryPDF
                          startDate={startDate}
                          endDate={endDate}
                          report={report}
                        />
                      }
                      fileName={`sales-summary-${startDate}-to-${endDate}.pdf`}
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

                  {/* Printable Area */}
                  <div id="printableArea">
                    <h4>
                      Sales Summary from <strong>{startDate}</strong> to{' '}
                      <strong>{endDate}</strong>
                    </h4>

                    <table className="table table-bordered text-center">
                      <thead>
                        <tr>
                          <th>Sl</th>
                          <th>Invoice Date</th>
                          <th>Invoice No</th>
                          <th>Buying Cost</th>
                          <th>Selling Cost</th>
                          <th>Tax</th>
                          <th>Discount</th>
                          <th>Grand Total</th>
                          <th>Profit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.map((row, idx) => (
                          <tr key={row.id}>
                            <td>{idx + 1}</td>
                            <td>{row.invoiceDate.toLocaleDateString()}</td> {/* Fixed property */}
                            <td>{row.invoiceNo}</td>
                            <td>{row.buyingCost.toFixed(2)}</td> {/* Fixed property */}
                            <td>{row.sellingCost.toFixed(2)}</td> {/* Fixed property */}
                            <td>{row.tax.toFixed(2)}</td>
                            <td>{row.discount.toFixed(2)}</td>
                            <td>{row.grandTotal.toFixed(2)}</td> {/* Fixed property */}
                            <td>{row.profit.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}