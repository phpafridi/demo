'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Eye, RefreshCcw, ArrowUpDown, Search } from 'lucide-react'
import { FetchOrders, SerializedOrder } from './actions/FetchOrders'
import { updateOrderStatus } from './actions/UpdateOrderStatus'
import { fetchCurrency } from '../settings/actions/fetchCurrency'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function ManageOrder() {
  const [orders, setOrders] = useState<SerializedOrder[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | '0' | '1' | '2'>('all')
  const [sortBy, setSortBy] = useState<'date' | 'total'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [currency, setCurrency] = useState('Rs')
  const [loading, setLoading] = useState(true)

  const [openDialog, setOpenDialog] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null)

  // ✅ Pagination state with "Show All"
  const [currentPage, setCurrentPage] = useState(1)
  const [ordersPerPage, setOrdersPerPage] = useState<number | 'all'>(10)

  useEffect(() => {
    const loadOrders = async () => {
      const data = await FetchOrders()
      setOrders(data)
      setLoading(false)
    }
    loadOrders()
  }, [])

  useEffect(() => {
    const getCurrency = async () => {
      const data = await fetchCurrency()
      if (data?.currency) setCurrency(data.currency)
    }
    getCurrency()
  }, [])

  const handleChangeStatus = async (orderId: number, status: number) => {
    await updateOrderStatus(orderId, status)
    setOrders((prev) =>
      prev.map((o) =>
        o.order_id === orderId ? { ...o, order_status: status } : o
      )
    )
    setOpenDialog(false)
    setSelectedOrderId(null)
  }

  const getStatusLabel = (status: number) => {
    switch (status) {
      case 0:
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-900 text-2xl px-6 py-3 rounded-lg">
            Pending
          </Badge>
        )
      case 1:
        return (
          <Badge variant="destructive" className="text-2xl px-6 py-3 rounded-lg">
            Cancelled
          </Badge>
        )
      case 2:
      default:
        return (
          <Badge className="bg-green-600 hover:bg-green-700 text-2xl px-6 py-3 rounded-lg">
            Completed
          </Badge>
        )
    }
  }

  const filteredOrders = orders
    .filter((order) => {
      const matchesSearch =
        order.order_no.toString().includes(search) ||
        order.sales_person.toLowerCase().includes(search.toLowerCase()) ||
        new Date(order.order_date).toLocaleDateString().includes(search)

      const matchesStatus =
        statusFilter === 'all'
          ? true
          : order.order_status.toString() === statusFilter

      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return sortOrder === 'asc'
          ? new Date(a.order_date).getTime() - new Date(b.order_date).getTime()
          : new Date(b.order_date).getTime() - new Date(a.order_date).getTime()
      } else {
        return sortOrder === 'asc'
          ? a.grand_total - b.grand_total
          : b.grand_total - a.grand_total
      }
    })

  // ✅ Pagination logic with Show All
  const totalPages =
    ordersPerPage === 'all'
      ? 1
      : Math.ceil(filteredOrders.length / ordersPerPage)

  const paginatedOrders =
    ordersPerPage === 'all'
      ? filteredOrders
      : filteredOrders.slice(
          (currentPage - 1) * ordersPerPage,
          currentPage * ordersPerPage
        )

  // ✅ Show loading screen
  if (loading) {
    return (
      <div className="right-side" style={{ minHeight: '945px' }}>
        Loading Manage Order...
      </div>
    )
  }

  return (
    <section className="p-12">
      <Card className="shadow-2xl border rounded-2xl">
        <CardHeader>
          <CardTitle className="text-4xl md:text-5xl font-extrabold text-center tracking-wide">
            Manage Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters and sorting */}
          <div className="flex flex-wrap gap-4 justify-between items-center mb-8">
            <div className="flex gap-2 w-full md:w-1/3">
              <Input
                placeholder="Search by order no, date, sales person..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="px-6 py-4 text-2xl rounded-lg text-center"
              />
              <Search className="w-8 h-8 text-gray-500 self-center" />
            </div>

            <div className="flex gap-4 flex-wrap">
              <Select
                value={statusFilter}
                onValueChange={(val) =>
                  setStatusFilter(val as 'all' | '0' | '1' | '2')
                }
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="0">Pending</SelectItem>
                  <SelectItem value="1">Cancelled</SelectItem>
                  <SelectItem value="2">Completed</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                className="flex items-center gap-2 text-2xl px-6 py-3"
                onClick={() =>
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                }
              >
                <ArrowUpDown className="w-6 h-6" />
                Sort {sortBy === 'date' ? 'by Date' : 'by Total'} ({sortOrder})
              </Button>

              <Select
                value={sortBy}
                onValueChange={(val: 'date' | 'total') => setSortBy(val)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="total">Total</SelectItem>
                </SelectContent>
              </Select>

              {/* ✅ Items per page dropdown with Show All */}
              <Select
                value={ordersPerPage.toString()}
                onValueChange={(val) =>
                  setOrdersPerPage(val === 'all' ? 'all' : parseInt(val))
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Items per page" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="all">Show All</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Orders Table */}
          <div className="overflow-x-auto">
            <Table className="w-full border-collapse text-center text-2xl">
              <TableHeader>
                <TableRow className="bg-gray-100 text-2xl">
                  {['Sl', 'Order No', 'Order Date', 'Status', 'Total', 'Sales By', 'Action'].map((h) => (
                    <TableHead
                      key={h}
                      className="px-8 py-6 font-bold text-center text-2xl"
                    >
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>

              <TableBody>
                {paginatedOrders.length > 0 ? (
                  paginatedOrders.map((order, i) => (
                    <TableRow
                      key={order.order_id}
                      className="hover:bg-gray-50 text-center text-2xl"
                    >
                      <TableCell className="px-8 py-6">
                        {(ordersPerPage === 'all'
                          ? i + 1
                          : (currentPage - 1) * ordersPerPage + i + 1)}
                      </TableCell>
                      <TableCell className="px-8 py-6">
                        <Link
                          href={`/dashboard/order-process/invoice/${order.order_id}?isOrder=true`}
                          className="font-bold text-blue-700 hover:underline text-2xl"
                        >
                          ORD{order.order_no}
                        </Link>
                      </TableCell>
                      <TableCell className="px-8 py-6">
                        {new Date(order.order_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="px-8 py-6">
                        {getStatusLabel(order.order_status)}
                      </TableCell>
                      <TableCell className="px-8 py-6 font-extrabold">
                        {currency} {order.grand_total}
                      </TableCell>
                      <TableCell className="px-8 py-6 text-2xl">
                        {order.sales_person}
                      </TableCell>
                      <TableCell className="px-8 py-6 flex flex-wrap justify-center gap-4">
                        <Button
                          asChild
                          size="lg"
                          variant="outline"
                          className="flex items-center gap-3 px-8 py-4 text-2xl rounded-2xl text-green-700 border-green-700 hover:bg-green-100"
                        >
                          <Link
                            href={`/dashboard/order-process/invoice/${order.order_id}?isOrder=true`}
                          >
                            <Eye className="w-7 h-7" /> View
                          </Link>
                        </Button>

                        {order.order_status === 0 && (
                          <Button
                            size="lg"
                            variant="destructive"
                            className="flex items-center gap-3 px-8 py-4 text-2xl rounded-2xl bg-red-600 hover:bg-red-700 text-white"
                            onClick={() => {
                              setSelectedOrderId(order.order_id)
                              setOpenDialog(true)
                            }}
                          >
                            <RefreshCcw className="w-7 h-7" /> Change
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-muted-foreground py-12 text-3xl font-bold"
                    >
                      No orders found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* ✅ Pagination Controls (hidden when "Show All") */}
          {ordersPerPage !== 'all' && totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8 text-xl">
              <Button
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                Prev
              </Button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              Change Order Status
            </DialogTitle>
          </DialogHeader>
          <p className="text-xl text-gray-600">
            Do you want to <span className="font-bold">Confirm Order</span> or{' '}
            <span className="font-bold">Cancel Order</span> this order?
          </p>
          <DialogFooter className="flex gap-4 justify-center mt-6">
            <Button
              className="hover:bg-green-700 text-white px-6 py-3 text-xl rounded-xl"
              onClick={() =>
                selectedOrderId && handleChangeStatus(selectedOrderId, 2)
              }
            >
              ✅ Confirm
            </Button>
            <Button
              className="hover:bg-red-700 text-white px-6 py-3 text-xl rounded-xl"
              onClick={() =>
                selectedOrderId && handleChangeStatus(selectedOrderId, 1)
              }
            >
              ❌ Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
