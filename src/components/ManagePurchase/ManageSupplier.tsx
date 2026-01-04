'use client'
import React, { useEffect, useState } from 'react'
import { FetchSuppliers } from './actions/FetchSupplier'
import Link from 'next/link'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

type Supplier = {
  supplier_id: number
  company_name: string
  supplier_name: string
  email: string
  phone: string
  address: string
}

export default function ManageSupplier() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)

  // ✅ Search + Pagination + ShowAll
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [showAll, setShowAll] = useState(false)
  const rowsPerPage = 10

  const getSuppliers = async () => {
    try {
      setLoading(true)
      const data = await FetchSuppliers()
      setSuppliers(data)
    } catch (error) {
      toast.error('Failed to load suppliers ❌')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    getSuppliers()
  }, [])

  // ✅ Filter suppliers
  const filteredSuppliers = suppliers.filter((s) => {
    const q = search.toLowerCase()
    return (
      s.company_name.toLowerCase().includes(q) ||
      s.supplier_name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.phone.toLowerCase().includes(q)
    )
  })

  // ✅ Pagination logic
  const totalPages = Math.ceil(filteredSuppliers.length / rowsPerPage)
  const paginatedSuppliers = showAll
    ? filteredSuppliers
    : filteredSuppliers.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  if (loading) {
    return (
      <div className="right-side" style={{ minHeight: '945px' }}>
        Loading Manage Supplier...
      </div>
    )
  }

  return (
    <Card className="shadow-2xl rounded-3xl p-8">
      <CardHeader>
        <CardTitle className="text-5xl font-extrabold text-center tracking-wide">
          Manage Suppliers
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Search */}
        <div className="flex flex-col md:flex-row items-center justify-center mb-8 gap-4 w-full md:w-2/3 mx-auto">
          <Input
            placeholder="Search by company, name, email, or phone..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setCurrentPage(1)
            }}
            className="text-2xl px-6 py-4 rounded-xl text-center w-full"
          />
          <Search className="w-8 h-8 text-gray-500" />
          <Button
            variant={showAll ? 'default' : 'outline'}
            onClick={() => setShowAll(!showAll)}
            className="px-6 py-4 text-lg rounded-xl"
          >
            {showAll ? 'Paginate' : 'Show All'}
          </Button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table className="text-2xl">
            <TableHeader>
              <TableRow className="bg-gray-100">
                {['Sl', 'Company Name', 'Supplier Name', 'Email', 'Phone', 'Action'].map((header) => (
                  <TableHead key={header} className="text-center font-bold text-3xl py-6">
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody>
              {paginatedSuppliers.length > 0 ? (
                paginatedSuppliers.map((s, i) => (
                  <TableRow key={s.supplier_id} className="hover:bg-gray-50">
                    <TableCell className="text-center py-6">
                      {(currentPage - 1) * rowsPerPage + (i + 1)}
                    </TableCell>
                    <TableCell className="text-center py-6">{s.company_name}</TableCell>
                    <TableCell className="text-center py-6">{s.supplier_name}</TableCell>
                    <TableCell className="text-center py-6">{s.email}</TableCell>
                    <TableCell className="text-center py-6">{s.phone}</TableCell>
                    <TableCell className="text-center py-6">
                      <Button
                        variant="outline"
                        size="lg"
                        className="text-blue-700 border-2 border-blue-700 hover:bg-blue-100 text-2xl px-8 py-4 rounded-2xl flex items-center justify-center mx-auto"
                        asChild
                      >
                        <Link href={`/dashboard/manage-purchase/supplier/edit/${s.supplier_id}`}>
                          Edit
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center font-extrabold text-3xl py-8">
                    No suppliers found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination (only show if not "Show All") */}
        {!showAll && totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-8">
            <Button
              variant="outline"
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              Previous
            </Button>
            <span className="text-2xl font-bold">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
