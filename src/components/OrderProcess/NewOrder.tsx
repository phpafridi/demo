'use client'

import React, { useEffect, useState, useRef } from 'react'
import FetchProducts from '../Product/actions/FetchProduct'
import { FetchCustomerData } from '../Customer/actions/FetchCustomerData'
import { AddOrder } from '../OrderProcess/actions/AddOrder'
import { useSession } from "next-auth/react"
import { useNotifications } from '../store/useNotifications'
import { toast } from 'sonner'
import PrintReceipt from '../Print/PrintReceipt'

type Product = {
  product_id: number
  product_code: string
  product_name: string
  inventory: number
  price: number
  measurement_unit?: string
  barcode?: string
  packet_size?: number
  special_offers?: { offer_price: number; start_date: string; end_date: string }[]
  tier_prices?: { quantity_above: number; tier_price: number }[]
  tax_rate?: number
  tax_type?: number   // 1 = percentage, 2 = fixed
  tax_title?: string
  status: number
}

type Customer = {
  customer_id: number
  customer_name: string
  discount?: number
}

type PriceType = 'base' | 'special' | 'tier' | 'custom'

type CartItem = {
  product: Product
  qty: number
  price: number
  priceType?: PriceType
  taxAmount?: number
}

export default function NewSale() {
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customDiscount, setCustomDiscount] = useState<number>(0)
  const [isDiscountEnabled, setIsDiscountEnabled] = useState<boolean>(false)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [paidAmount, setPaidAmount] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [isGoldClient, setIsGoldClient] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [processWithoutPayment, setProcessWithoutPayment] = useState<boolean>(false)
  const [saleDate, setSaleDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  )
  const { data: session } = useSession()
  const { refreshLowStock, refreshPendingOrders } = useNotifications()

  const [editablePrices, setEditablePrices] = useState<Record<number, boolean>>({})

  const firstQtyRef = useRef<HTMLInputElement>(null)
  const paidAmountRef = useRef<HTMLInputElement>(null)
  const submitBtnRef = useRef<HTMLButtonElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  // FIX: Utility function to ensure proper number conversion
  const ensureNumber = (value: any): number => {
    if (value === null || value === undefined) return 0
    if (typeof value === 'number') return value
    if (typeof value === 'string') {
      const num = parseFloat(value)
      return isNaN(num) ? 0 : num
    }
    if (typeof value === 'object' && value !== null) {
      if (typeof value.toNumber === 'function') {
        return value.toNumber()
      }
      if (typeof value.toString === 'function') {
        return parseFloat(value.toString())
      }
    }
    return 0
  }

  const calculateTax = (product: Product, price: number, qty: number): number => {
    if (!product.tax_type || !product.tax_rate) return 0
    if (product.tax_type === 1) return (price * qty * product.tax_rate) / 100
    if (product.tax_type === 2) return product.tax_rate * qty
    return 0
  }

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await FetchProducts()
        const mapped = (res || []).map((p: any) => {
          // FIX: Ensure inventory and price are proper numbers
          const inventory = ensureNumber(p.inventories?.[0]?.product_quantity ?? 0)
          const price = ensureNumber(p.prices?.[0]?.selling_price ?? 0)
          
          return {
            product_id: p.product_id,
            product_code: p.product_code,
            product_name: p.product_name,
            status: p.status,
            inventory: inventory,
            price: price,
            measurement_unit: p.measurement_units ?? 'pcs',
            packet_size: ensureNumber(p.packet_size ?? 0),
            barcode: p.barcode || p.product_code,
            special_offers: p.special_offers?.map((o: any) => ({
              offer_price: ensureNumber(o.offer_price),
              start_date: o.start_date,
              end_date: o.end_date,
            })),
            tier_prices: p.tier_prices?.map((t: any) => ({
              quantity_above: ensureNumber(t.quantity_above),
              tier_price: ensureNumber(t.tier_price)
            })) ?? [],
            tax_rate: ensureNumber(p.tax?.tax_rate ?? 0),
            tax_type: p.tax?.tax_type ?? null,
            tax_title: p.tax?.tax_title ?? '',
          } as Product
        })
        setProducts(mapped)
      } catch (err) {
        console.error('Error loading products', err)
        setError('Error loading products')
      }
    }

    const loadCustomers = async () => {
      try {
        const res = await FetchCustomerData()
        const mapped = (res || []).map((c: any) => ({
          customer_id: c.customer_id,
          customer_name: c.customer_name,
          discount: ensureNumber(c.discount || '0'),
        }))
        setCustomers(mapped)
        setSelectedCustomer(mapped[0] || { customer_id: 0, customer_name: 'Walking Client', discount: 0 })
      } catch (err) {
        console.error('Error loading customers', err)
        setSelectedCustomer({ customer_id: 0, customer_name: 'Walking Client', discount: 0 })
        setError('Error loading customers')
      }
    }

    loadProducts()
    loadCustomers()
  }, [])

  useEffect(() => {
    if (!isGoldClient) setSelectedCustomer({ customer_id: 0, customer_name: 'Walking Client', discount: 0 })
  }, [isGoldClient])

  useEffect(() => {
    searchRef.current?.focus()
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 's') {
        e.preventDefault()
        searchRef.current?.focus()
        searchRef.current?.select()
      } else if (e.altKey && e.key.toLowerCase() === 'q') {
        e.preventDefault()
        paidAmountRef.current?.focus()
        paidAmountRef.current?.select()
      } else if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault()
        submitBtnRef.current?.click()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const getPriceForQty = (product: Product, qty: number): { price: number; type: Exclude<PriceType, 'custom'> } => {
    const now = new Date()
    const tier = product.tier_prices?.sort((a, b) => b.quantity_above - a.quantity_above).find(t => qty >= t.quantity_above)
    if (tier) return { price: tier.tier_price, type: 'tier' }
    const special = product.special_offers?.find(o => {
      const start = new Date(o.start_date)
      const end = new Date(o.end_date)
      return now >= start && now <= end
    })
    if (special) return { price: special.offer_price, type: 'special' }
    return { price: product.price, type: 'base' }
  }

  const addToCart = (product: Product) => {
    const exists = cart.find(c => c.product.product_id === product.product_id)

    if (exists) {
      const newQty = ensureNumber(exists.qty) + 1
      if (newQty > product.inventory) {
        toast.error(`❌ Only ${product.inventory.toFixed(1)} left in stock`)
        return
      }

      if (exists.priceType === 'custom') {
        const taxAmount = calculateTax(product, exists.price, newQty)
        setCart(cart.map(c =>
          c.product.product_id === product.product_id
            ? { ...c, qty: newQty, taxAmount }
            : c
        ))
      } else {
        const { price, type } = getPriceForQty(product, newQty)
        const taxAmount = calculateTax(product, price, newQty)
        setCart(cart.map(c =>
          c.product.product_id === product.product_id
            ? { ...c, qty: newQty, price, priceType: type, taxAmount }
            : c
        ))
      }
    } else {
      if (product.status === 0) {
        toast.error("❌ Product is inactive, cannot add to cart.")
        return
      }
      if (product.inventory < 0.1) {
        toast.error("❌ Not enough stock")
        return
      }
      const { price, type } = getPriceForQty(product, 1)
      const taxAmount = calculateTax(product, price, 1)
      setCart([...cart, { product, qty: 1, price, priceType: type, taxAmount }])
    }
  }

  const updateCart = (id: number, qty: number) => {
    setCart(cart.map(c => {
      if (c.product.product_id === id) {
        const finalQty = ensureNumber(qty)

        if (finalQty > c.product.inventory) {
          toast.error(`❌ Only ${c.product.inventory.toFixed(1)} left in stock`)
          return c
        }

        if (c.priceType === 'custom') {
          const taxAmount = calculateTax(c.product, c.price, finalQty)
          return { ...c, qty: finalQty, taxAmount }
        }

        const { price, type } = getPriceForQty(c.product, finalQty)
        const taxAmount = calculateTax(c.product, price, finalQty)
        return { ...c, qty: finalQty, price, priceType: type, taxAmount }
      }
      return c
    }))
  }

  const togglePriceLock = (id: number) => {
    setEditablePrices(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const updateCartPrice = (id: number, newPrice: number) => {
    setCart(cart.map(c => {
      if (c.product.product_id === id) {
        const taxAmount = calculateTax(c.product, newPrice, c.qty ?? 0)
        return { ...c, price: newPrice, priceType: 'custom', taxAmount }
      }
      return c
    }))
  }

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(c => c.product.product_id !== id))
    setEditablePrices(prev => {
      const copy = { ...prev }
      delete copy[id]
      return copy
    })
  }

  const clearCart = () => {
    setCart([])
    setEditablePrices({})
  }

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty) + (item.taxAmount ?? 0), 0)
  const customerDiscount = selectedCustomer?.discount ?? 0
  const totalDiscount = Math.min(((subtotal * customerDiscount) / 100) + (isDiscountEnabled ? customDiscount : 0), subtotal)
  const grandTotal = subtotal - totalDiscount
  const changeAmount = processWithoutPayment ? 0 : paidAmount - grandTotal
  const changeColor = changeAmount >= 0 ? 'green' : 'red'

  const filteredProducts = products.filter(p =>
    p.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.product_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.barcode?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    // FIX: Validate cart
    if (cart.length === 0) return setError("Please add products to the cart.")
    
    // FIX: Validate each item has proper quantity
    for (const item of cart) {
      const qty = ensureNumber(item.qty)
      if (isNaN(qty) || qty <= 0) {
        return setError(`Invalid quantity for ${item.product.product_name}`)
      }
    }
    
    const invalidItem = cart.find(item => ensureNumber(item.qty) > item.product.inventory)
    if (invalidItem) return setError(`❌ Not enough stock for ${invalidItem.product.product_name}`)
    
    if (!processWithoutPayment && paidAmount < grandTotal) return setError("Paid amount cannot be less than grand total.")
    
    setLoading(true)
    
    const finalPaidAmount = processWithoutPayment ? 0 : paidAmount
    
    // FIX: Ensure all numbers are properly converted before sending with 1 decimal for qty
    const payload = {
      sales_person: session?.user?.name as string || 'Unknown',
      customer_id: selectedCustomer?.customer_id ?? 0,
      sale_ref: (e.target as any).sale_ref.value || "WalkIn-" + Date.now(),
      payment_method: (e.target as any).payment_method.value,
      paid_amount: ensureNumber(finalPaidAmount),
      discount: ensureNumber(totalDiscount),
      sale_date: saleDate, // Add dynamic sale date
      cart: cart.map((item) => ({
        product_id: item.product.product_id,
        qty: parseFloat(ensureNumber(item.qty).toFixed(1)), // FIX: Ensure 1 decimal place
        price: parseFloat(ensureNumber(item.price).toFixed(2)), // FIX: Ensure 2 decimal places for price
        tax_amount: parseFloat(ensureNumber(item.taxAmount ?? 0).toFixed(2)),
      })),
    }

    // DEBUG: Log what's being sent
    console.log('📤 DEBUG Payload being sent:', JSON.stringify(payload, null, 2))
    console.log('📤 DEBUG Sale Date:', saleDate)

    try {
      const res = await AddOrder(payload)
      if (res.success) {
        toast.success("✅ Order saved successfully")
        document.getElementById("hiddenPrintBtn")?.click()

        clearCart()
        setCustomDiscount(0)
        setPaidAmount(0)
        setIsGoldClient(false)
        setProcessWithoutPayment(false)
        await refreshLowStock()
        await refreshPendingOrders()
        searchRef.current?.focus()
      } else {
        throw new Error(res.message)
      }
    } catch (err: any) {
      console.error('❌ Save error:', err)
      setError(err.message || 'Failed to save order')
      toast.error("Failed to save order")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="row">
      <div className="col-md-12">
        {error && <div className="text-center mb-4"><h5 style={{ color: 'red' }}>{error}</h5></div>}

        <div className="portlet">
          <div className="portlet-heading">
            <h3 className="portlet-title text-dark text-uppercase">New Sale</h3>
          </div>
          <div className="portlet-body">
            <div className="row">
              <div className="col-md-6 col-sm-12">
                <div className="box box-warning">
                  <div className="box-header box-header-background-light with-border">
                    <h3 className="box-title">Select Product</h3>
                  </div>
                  <div className="box-body">

                    <input
                      type="text"
                      ref={searchRef}
                      className="form-control mb-2"
                      placeholder="Search by Name, Code, or Barcode"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          const search = searchTerm.trim().toLowerCase()
                          
                          if (!search) {
                            toast.error("Please enter a search term")
                            return
                          }
                          
                          const product = products.find(p =>
                            p.barcode?.toLowerCase() === search ||
                            p.product_code.toLowerCase() === search ||
                            p.product_name.toLowerCase().includes(search)
                          )
                          if (product) {
                            addToCart(product)
                            setSearchTerm('')
                          } else {
                            toast.error("Product not found")
                          }
                        }
                      }}
                    />
                    <table className={`table table-bordered table-hover ${searchTerm.trim() ? '' : 'hide'}`}>
                      <thead>
                        <tr>
                          <th>Sl</th>
                          <th>Code</th>
                          <th>Name</th>
                          <th>Inventory</th>
                          <th>Unit</th>
                          <th>Packet Size</th>
                          <th>Add</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProducts.map((p, idx) => (
                          <tr key={p.product_id}>
                            <td>{idx + 1}</td>
                            <td>{p.product_code}</td>
                            <td>{p.product_name}</td>
                            <td>{Number(p.inventory).toFixed(1)}</td>
                            <td>{p.measurement_unit ?? 'pcs'}</td>
                            <td>{p.packet_size && p.packet_size > 0 ? Number(p.packet_size).toFixed(1) : 'N/A'}</td>
                            <td>
                              <button
                                type="button"
                                className="btn btn-primary btn-xs"
                                onClick={() => addToCart(p)}
                                title="Add to cart"
                              >
                                <i className="fa fa-shopping-cart"></i> Add
                              </button>
                            </td>
                          </tr>
                        ))}
                        {filteredProducts.length === 0 && (
                          <tr>
                            <td colSpan={7} className="text-center">No Products Found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="col-md-6 col-sm-12">
                <form onSubmit={handleSubmit}>
                  <div className="box box-info">
                    <div className="box-header box-header-background-light with-border">
                      <h3 className="box-title">Sale Order</h3>
                    </div>
                    <div className="box-background">
                      <div className="row mb-2">
                        <div className="col-md-6">
                          <label>
                            <input type="checkbox" className="mr-2" checked={isGoldClient} onChange={e => setIsGoldClient(e.target.checked)} />
                            { } Gold Client
                          </label>
                          {!isGoldClient ? (
                            <input type="text" className="form-control mt-1" value={selectedCustomer?.customer_name ?? 'Walking Client'} disabled />
                          ) : (
                            <select className="form-control mt-1" value={selectedCustomer?.customer_id ?? ''} onChange={e => setSelectedCustomer(customers.find(c => c.customer_id === Number(e.target.value)) ?? null)}>
                              {customers.map(c => (
                                <option key={c.customer_id} value={c.customer_id}>{c.customer_name} {c.discount ? `(${c.discount}% Discount)` : ''}</option>
                              ))}
                            </select>
                          )}
                        </div>
                        <div className="col-md-6">
                          <label>Date</label>
                          <input 
                            type="date" 
                            className="form-control" 
                            value={saleDate} 
                            onChange={e => setSaleDate(e.target.value)}
                            max={new Date().toISOString().slice(0, 10)}
                          />
                        </div>
                      </div>

                      <table className="table table-bordered table-hover">
                        <thead>
                          <tr>
                            <th>Sl</th>
                            <th>Product</th>
                            <th>Unit</th>
                            <th>Qty</th>
                            <th>Unit Price</th>
                            <th>Tax</th>
                            <th>Total</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cart.map((item, idx) => (
                            <tr key={item.product.product_id}>
                              <td>{idx + 1}</td>
                              <td>{item.product.product_name}</td>
                              <td>{item.product.measurement_unit ?? 'pcs'}</td>
                              <td style={{ minWidth: '80px' }}>
                                <input
                                  tabIndex={0}
                                  type="number"
                                  step="1"
                                  className="form-control"
                                  value={item.qty}
                                  onChange={e => {
                                    const newQty = ensureNumber(e.target.value);
                                    updateCart(item.product.product_id, newQty);
                                  }}
                                  onBlur={e => {
                                    const val = ensureNumber(e.target.value);
                                    const roundedVal = parseFloat(val.toFixed(1));
                                    if (roundedVal < 0.1) {
                                      updateCart(item.product.product_id, 0.1);
                                    } else if (roundedVal !== val) {
                                      updateCart(item.product.product_id, roundedVal);
                                    }
                                  }}
                                  ref={idx === 0 ? firstQtyRef : null}
                                />
                              </td>

                              <td style={{ minWidth: '150px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <input
                                    type="number"
                                    min={0.01}
                                    step="0.01"
                                    className="form-control"
                                    value={Number(item.price).toFixed(2)}
                                    disabled={!editablePrices[item.product.product_id]}
                                    onChange={(e) => {
                                      const v = ensureNumber(e.target.value)
                                      if (!isNaN(v) && v > 0) updateCartPrice(item.product.product_id, v)
                                    }}
                                    style={{ width: '100px' }}
                                  />
                                  <button
                                    type="button"
                                    className={`btn btn-xs ${editablePrices[item.product.product_id] ? 'btn-success' : 'btn-secondary'}`}
                                    title={editablePrices[item.product.product_id] ? 'Lock Price' : 'Unlock to Edit Price'}
                                    onClick={() => togglePriceLock(item.product.product_id)}
                                  >
                                    <i className={`fa ${editablePrices[item.product.product_id] ? 'fa-lock' : 'fa-unlock'}`}></i>
                                  </button>
                                </div>
                                <div style={{ marginTop: 4 }}>
                                  {item.priceType === 'custom' ? (
                                    <small className="text-info">Custom</small>
                                  ) : item.priceType === 'tier' ? (
                                    <small className="text-success">Tier</small>
                                  ) : item.priceType === 'special' ? (
                                    <small className="text-warning">Special</small>
                                  ) : (
                                    <small className="text-muted">Base</small>
                                  )}
                                </div>
                              </td>

                              <td>{item.taxAmount?.toFixed(2) ?? '0.00'}   {item.product.tax_type === 1 && ` %`}
                                {item.product.tax_type === 2 && ` (fixed)`}</td>
                              <td>{((item.price * item.qty) + (item.taxAmount ?? 0)).toFixed(2)}</td>
                              <td>
                                <button type="button" className="btn btn-danger btn-xs" onClick={() => removeFromCart(item.product.product_id)}>
                                  <i className="fa fa-trash"></i>
                                </button>
                              </td>
                            </tr>
                          ))}
                          {cart.length === 0 && (
                            <tr>
                              <td colSpan={8} className="text-center">No products in cart</td>
                            </tr>
                          )}
                        </tbody>
                      </table>

                      <div className="row">
                        <div className="col-md-6 offset-md-6">
                          <table className="table table-bordered">
                            <tbody>
                              <tr>
                                <td><strong>Sub Total</strong></td>
                                <td>{subtotal.toFixed(2)}</td>
                              </tr>
                              <tr>
                                <td><strong>Customer Discount</strong></td>
                                <td>{customerDiscount}%</td>
                              </tr>
                              <tr>
                                <td>
                                  <label>
                                    <input
                                      type="checkbox"
                                      className="mr-2"
                                      checked={isDiscountEnabled}
                                      onChange={e => {
                                        setIsDiscountEnabled(e.target.checked)
                                        if (!e.target.checked) setCustomDiscount(0)
                                      }}
                                    />
                                    { } Custom Discount
                                  </label>
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    className="form-control"
                                    value={customDiscount}
                                    disabled={!isDiscountEnabled}
                                    onChange={e => setCustomDiscount(ensureNumber(e.target.value))}
                                  />
                                </td>
                              </tr>
                              <tr>
                                <td><strong>Total Discount</strong></td>
                                <td>{totalDiscount.toFixed(2)}</td>
                              </tr>
                              <tr>
                                <td><strong>Grand Total</strong></td>
                                <td>{grandTotal.toFixed(2)}</td>
                              </tr>
                              <tr>
                                <td><strong>Paid Amount</strong></td>
                                <td>
                                  <input 
                                    type="number" 
                                    min={0} 
                                    step="0.01"
                                    className="form-control" 
                                    ref={paidAmountRef} 
                                    value={paidAmount} 
                                    onChange={e => setPaidAmount(ensureNumber(e.target.value))}
                                    disabled={processWithoutPayment}
                                  />
                                </td>
                              </tr>
                              <tr>
                                <td colSpan={2}>
                                  <label>
                                    <input
                                      type="checkbox"
                                      className="mr-2"
                                      checked={processWithoutPayment}
                                      onChange={e => {
                                        setProcessWithoutPayment(e.target.checked)
                                        if (e.target.checked) setPaidAmount(0)
                                      }}
                                    />
                                    Process without payment (Paid Amount: 0)
                                  </label>
                                </td>
                              </tr>
                              <tr>
                                <td><strong>Change Amount</strong></td>
                                <td style={{ color: changeColor }}>{changeAmount.toFixed(2)}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="row">
                        <div className="col-md-6">
                          <label>Sale Ref</label>
                          <input type="text" name="sale_ref" className="form-control" placeholder="Optional reference" />
                        </div>
                        <div className="col-md-6">
                          <label>Payment Method</label>
                          <select name="payment_method" className="form-control">
                            <option value="cash">Cash</option>
                            <option value="easypaisa">Easypaisa</option>
                            <option value="cheque">Cheque</option>
                            <option value="card">Credit Card</option>
                            <option value="pending">Pending Order</option>
                          </select>
                        </div>
                      </div>

                      <div className="row mt-3">
                        <div className="col-md-12 text-right">
                          <button type="submit" ref={submitBtnRef} className="btn btn-primary" disabled={loading}>
                            {loading ? 'Processing...' : 'Complete Sale'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

        <PrintReceipt
          customer={selectedCustomer ?? { customer_name: 'Walking Client' }}
          cart={cart.map(c => ({
            product_name: c.product.product_name,
            qty: c.qty,
            price: c.price,
            taxAmount: c.taxAmount
          }))}
          subtotal={subtotal}
          discount={totalDiscount}
          grandTotal={grandTotal}
          paidAmount={processWithoutPayment ? 0 : paidAmount}
          changeAmount={changeAmount}
        />
      </div>
    </div>
  )
}