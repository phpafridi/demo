'use client'

import React, { useEffect, useState } from 'react'
import { FetchInvoices, SerializedInvoice } from './actions/FetchInvoices'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Eye, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { fetchCurrency } from '../settings/actions/fetchCurrency'

export default function ManageInvoice() {
  const [invoices, setInvoices] = useState<SerializedInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [currency, setCurrency] = useState('Rs') // default
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10) // ✅ user can toggle show all

  useEffect(() => {
    const loadData = async () => {
      const data = await FetchInvoices()
      setInvoices(data)
      setLoading(false)
    }
    loadData()

    const getCurrency = async () => {
      const data = await fetchCurrency()
      if (data?.currency) setCurrency(data.currency)
    }
    getCurrency()
  }, [])

  // ✅ Filter
  const filteredInvoices = invoices.filter((inv) => {
    const searchLower = search.toLowerCase()
    return (
      inv.invoice_no?.toString().includes(searchLower) ||
      inv.order.order_no.toString().includes(searchLower) ||
      inv.order.customer.customer_name.toLowerCase().includes(searchLower) ||
      new Date(inv.invoice_date).toLocaleDateString().includes(searchLower)
    )
  })

  // ✅ Pagination logic
  const totalPages = rowsPerPage === Infinity ? 1 : Math.ceil(filteredInvoices.length / rowsPerPage)
  const paginatedInvoices =
    rowsPerPage === Infinity
      ? filteredInvoices
      : filteredInvoices.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  if (loading) {
    return (
      <div className="right-side" style={{ minHeight: '945px' }}>
        Loading Manage Invoice...
      </div>
    )
  }

  return (
    <Card className="shadow-2xl rounded-3xl p-8">
      <CardHeader>
        <CardTitle className="text-5xl font-extrabold text-center tracking-wide">
          Manage Invoices
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Search Input */}
        <div className="flex items-center justify-center mb-8 gap-4 w-full md:w-1/2 mx-auto">
          <Input
            placeholder="Search by invoice, order, customer or date..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setCurrentPage(1) // reset to first page when searching
            }}
            className="text-2xl px-6 py-4 rounded-xl text-center"
          />
          <Search className="w-8 h-8 text-gray-500" />
        </div>

        <div className="overflow-x-auto">
          <Table className="text-2xl">
            <TableHeader>
              <TableRow className="bg-gray-100">
                {['Sl', 'Invoice No.', 'Order No.', 'Invoice Date', 'Customer', 'Payment Method', 'Order Total', 'Action'].map((header) => (
                  <TableHead key={header} className="text-center font-bold text-3xl py-6">
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody>
              {paginatedInvoices.length > 0 ? (
                paginatedInvoices.map((inv, index) => (
                  <TableRow key={inv.invoice_id} className="hover:bg-gray-50">
                    <TableCell className="text-center py-6">
                      {(currentPage - 1) * (rowsPerPage === Infinity ? filteredInvoices.length : rowsPerPage) + (index + 1)}
                    </TableCell>
                    <TableCell className="text-center py-6">
                      <Link
                        href={`/dashboard/order-process/invoice/${inv.order_id}?isOrder=false`}
                        className="font-extrabold text-blue-700 hover:underline text-2xl"
                      >
                        INV-{inv.invoice_no ?? inv.invoice_id}
                      </Link>
                    </TableCell>
                    <TableCell className="text-center py-6">
                      <Link
                        href={`/dashboard/order-process/invoice/${inv.order_id}?isOrder=true`}
                        className="font-extrabold text-blue-700 hover:underline text-2xl"
                      >
                        ORD-{inv.order.order_no}
                      </Link>
                    </TableCell>
                    <TableCell className="text-center py-6 text-xl">
                      {new Date(inv.invoice_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-center py-6 text-xl">
                      {inv.order.customer.customer_name}
                    </TableCell>
                    <TableCell className="text-center py-6 text-xl capitalize">
                      {inv.order.payment_method}
                    </TableCell>
                    <TableCell className="text-center py-6 font-extrabold text-xl">
                      {currency} {inv.order.grand_total.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center py-6">
                      <Button
                        variant="outline"
                        size="lg"
                        className="text-green-700 border-2 border-green-700 hover:bg-green-100 text-2xl px-8 py-4 rounded-2xl flex items-center justify-center mx-auto"
                        asChild
                      >
                        <Link
                          href={`/dashboard/order-process/invoice/${inv.order_id}?isOrder=false`}
                          className="flex items-center justify-center"
                        >
                          <Eye className="w-7 h-7 mr-3" />
                          View
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center font-extrabold text-3xl py-8">
                    No invoices found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* ✅ Pagination Controls + Show All */}
        {totalPages > 1 && (
          <div className="flex flex-wrap justify-center items-center gap-4 mt-8 text-2xl">
            <Button
              variant="outline"
              disabled={currentPage === 1 || rowsPerPage === Infinity}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              Previous
            </Button>
            <span className="font-bold">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              disabled={currentPage === totalPages || rowsPerPage === Infinity}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              Next
            </Button>
            <Button
              variant="outline"
              className="ml-4"
              onClick={() => {
                if (rowsPerPage === Infinity) {
                  setRowsPerPage(10)
                  setCurrentPage(1)
                } else {
                  setRowsPerPage(Infinity)
                  setCurrentPage(1)
                }
              }}
            >
              {rowsPerPage === Infinity ? 'Show Paginated' : 'Show All'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
