'use client'
import React, { useEffect, useState } from 'react'
import FetchProduct from './actions/FetchProducts'
import { PDFDownloadLink } from '@react-pdf/renderer'
import StockReportPDF from './StockReportPDF'

type Product = {
  id: number
  sku: string
  name: string
  cost: number
  qty: number
  stockValue: number
  measurement_units?: string
  packet_size: number
}

export default function StockReport() {
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true) // Add loading state

  useEffect(() => {
    const loadData = async () => {
      const data = await FetchProduct()
      setProducts(data)
      setLoading(false) // Set loading to false when data is loaded
    }
    loadData()
  }, [])

  const getDisplayQuantity = (product: Product) => {
    const packetSize = product.packet_size
    const isMultiplePackets = packetSize > 0 && product.qty % packetSize === 0
    const displayQty = isMultiplePackets ? (product.qty / packetSize) : product.qty
    const displayUnit = isMultiplePackets ? 'packet' : (product.measurement_units || 'pcs')
    
    return { displayQty, displayUnit }
  }

  const filteredProducts = products.filter((p) => {
    const searchLower = search.toLowerCase()
    return (
      p.sku.toLowerCase().includes(searchLower) ||
      p.name.toLowerCase().includes(searchLower) ||
      p.cost.toString().includes(searchLower) ||
      p.qty.toString().includes(searchLower) ||
      (p.measurement_units?.toLowerCase().includes(searchLower) ?? false)
    )
  })

  const grandTotal = filteredProducts.reduce((sum, p) => sum + p.stockValue, 0)

  const formatNumber = (num: number) =>
    new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(num)

  return (
    <section className="content p-8">
      <div className="row mb-6 no-print">
        <div className="col-md-12 flex justify-center">
          <input
            type="text"
            placeholder="Search by SKU, Product Name, Cost, or Measurement Unit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-6 py-3 rounded-xl text-2xl w-full md:w-1/2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="row">
        <div className="col-md-12">
          <div className="box box-primary">
            <div className="box-header box-header-background with-border text-center">
              <h3 className="box-title text-3xl font-bold">
                Stock Summary Report
              </h3>
            </div>

            {/* Show loading message */}
            {loading && (
              <div className="text-center py-8">
                <strong className="text-2xl">Loading products...</strong>
              </div>
            )}

            {!loading && filteredProducts.length > 0 && (
              <div className="text-center mt-3 mb-3 no-print">
                <button
                  onClick={() => window.print()}
                  className="btn btn-info btn-flat mr-2"
                >
                  Print
                </button>
                <PDFDownloadLink
                  document={
                    <StockReportPDF
                      products={filteredProducts}
                      grandTotal={grandTotal}
                    />
                  }
                  fileName={`stock-report.pdf`}
                >
                  {({ loading }) =>
                    loading ? (
                      <button className="btn btn-warning btn-flat">
                        Preparing PDF...
                      </button>
                    ) : (
                      <button className="btn btn-success btn-flat">
                        Download PDF
                      </button>
                    )
                  }
                </PDFDownloadLink>
              </div>
            )}

            <div className="box-body overflow-x-auto" id="printableArea">
              {loading ? (
                <div className="text-center py-8">
                  <strong className="text-2xl">Loading products...</strong>
                </div>
              ) : (
                <table className="table table-striped table-bordered datatable-buttons text-center text-xl">
                  <thead>
                    <tr>
                      <th>Sl</th>
                      <th>SKU</th>
                      <th>Product</th>
                      <th>Cost</th>
                      <th>Qty in Hand</th>
                      <th>Measurement Unit</th>
                      <th>Stock Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.length > 0 ? (
                      <>
                        {filteredProducts.map((p, index) => {
                          const { displayQty, displayUnit } = getDisplayQuantity(p)
                          
                          return (
                            <tr key={p.id} className="hover:bg-gray-100">
                              <td className="py-4">{index + 1}</td>
                              <td className="py-4">{p.sku}</td>
                              <td className="py-4">{p.name}</td>
                              <td className="py-4">{formatNumber(p.cost)}</td>
                              <td className="py-4">{displayQty}</td>
                              <td className="py-4">{displayUnit}</td>
                              <td className="py-4">{formatNumber(p.stockValue)}</td>
                            </tr>
                          )
                        })}
                        <tr className="font-bold bg-gray-200">
                          <td colSpan={6} className="text-right py-4">
                            Grand Total
                          </td>
                          <td className="py-4">{formatNumber(grandTotal)}</td>
                        </tr>
                      </>
                    ) : (
                      <tr>
                        <td colSpan={7} className="text-center py-6 text-2xl">
                          <strong>There is no record for display</strong>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}