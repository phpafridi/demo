'use client'
import React, { useEffect, useState, useRef } from 'react'
import FetchProducts from '../Product/actions/FetchProduct'
import { FetchSuppliers } from '../ManagePurchase/actions/FetchSupplier'
import { SavePurchase } from '../ManagePurchase/actions/AddPurchase'
import { toast } from 'sonner'

type Product = {
  product_id: number
  product_code: string
  product_name: string
  inventory: number
  price: number
  barcode?: string
  measurement_units?: string
  packet_size?: number
}

type Supplier = {
  supplier_id: number
  supplier_name: string
}

type CartItem = {
  product: Product
  qty: number
  price: number
  unitType?: 'pcs' | 'packet'
}

export default function NewPurchase() {
  const [products, setProducts] = useState<Product[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedSupplier, setSelectedSupplier] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [showAll, setShowAll] = useState<boolean>(false)
  const [addAsPiece, setAddAsPiece] = useState<boolean>(false)
  const [purchaseDate, setPurchaseDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  )

  const [message, setMessage] = useState<string>('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  const [loading, setLoading] = useState(false)

  const searchRef = useRef<HTMLInputElement>(null)
  const supplierRef = useRef<HTMLSelectElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await FetchProducts()
        const mapped = (res || []).map((p: any) => ({
          product_id: p.product_id,
          product_code: p.product_code,
          product_name: p.product_name,
          inventory: Number(p.inventories?.[0]?.product_quantity) || 0,
          price: Number(p.prices?.[0]?.buying_price) || 0,
          barcode: p.barcode || p.product_code,
          measurement_units: p.measurement_units || '',
          packet_size: Number(p.packet_size) || 0
        }))
        setProducts(mapped)
      } catch (err) {
        console.error('Error loading products', err)
      }
    }

    const loadSuppliers = async () => {
      try {
        const res = await FetchSuppliers()
        setSuppliers(res || [])
      } catch (err) {
        console.error('Error loading suppliers', err)
      }
    }

    loadProducts()
    loadSuppliers()
    searchRef.current?.focus()
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 's' && e.altKey) {
        e.preventDefault()
        searchRef.current?.focus()
      }
      if (e.key.toLowerCase() === 'q' && e.altKey) {
        e.preventDefault()
        supplierRef.current?.focus()
      }
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault()
        formRef.current?.requestSubmit()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Helper function to ensure single decimal
  const toSingleDecimal = (value: any): number => {
    const num = Number(value)
    return parseFloat(num.toFixed(1))
  }

  const addToCart = (product: Product) => {
    const exists = cart.find(c => c.product.product_id === product.product_id);
    const hasPacketSize = product.packet_size && product.packet_size > 0;
    
    // Determine if adding as piece or packet
    const unitType = hasPacketSize && !addAsPiece ? 'packet' : 'pcs';
    
    // Calculate quantity based on unit type
    let qtyToAdd = 1;
    if (unitType === 'packet' && product.packet_size) {
      qtyToAdd = product.packet_size; // Add full packet size amount
    }
    
    if (exists) {
      // If same unit type, add to existing quantity
      if (exists.unitType === unitType) {
        setCart(
          cart.map(c =>
            c.product.product_id === product.product_id
              ? { ...c, qty: toSingleDecimal(c.qty + qtyToAdd) }
              : c
          )
        );
      } else {
        // If different unit type, replace with new unit type
        setCart(
          cart.map(c =>
            c.product.product_id === product.product_id
              ? { ...c, qty: qtyToAdd, unitType }
              : c
          )
        );
      }
    } else {
      setCart([...cart, { 
        product, 
        qty: qtyToAdd, 
        price: toSingleDecimal(product.price), 
        unitType
      }]);
    }
    
    // Show success message with appropriate unit
    const unitText = unitType === 'packet' ? 
      `1 packet (${product.packet_size} pieces)` : 
      '1 piece';
    toast.success(`Added ${product.product_name} (${unitText}) to cart`);
  }

  const removeFromCart = (id: number) => {
    setCart(cart.filter(c => c.product.product_id !== id))
  }

  const updateCart = (id: number, field: 'qty' | 'price', value: number) => {
    setCart(
      cart.map(c => {
        if (c.product.product_id === id) {
          // For qty updates, if it's a packet and we're changing packet quantity
          if (field === 'qty' && c.unitType === 'packet' && c.product.packet_size) {
            // value here is packet quantity, convert to piece quantity
            const pieceQty = toSingleDecimal(value * c.product.packet_size);
            return { ...c, [field]: pieceQty }
          } else {
            return { ...c, [field]: toSingleDecimal(value) }
          }
        }
        return c
      })
    )
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedSupplier || cart.length === 0) {
      setMessage('Please select supplier and add products.')
      setMessageType('error')
      return
    }

    // Get form data properly typed
    const formData = new FormData(e.currentTarget)
    
    // Ensure all quantities are sent with single decimal
    const payload = {
      supplier_id: Number(selectedSupplier),
      purchase_ref: formData.get('purchase_ref') as string || '',
      payment_method: formData.get('payment_method') as string || 'cash',
      purchase_date: purchaseDate, // Dynamic date
      cart: cart.map(item => ({
        product_id: item.product.product_id,
        qty: toSingleDecimal(item.qty), // Ensure single decimal
        price: toSingleDecimal(item.price), // Ensure single decimal for price too
      })),
    }

    console.log('📤 Purchase payload:', JSON.stringify(payload, null, 2))

    try {
      setLoading(true)
      const res = await SavePurchase(payload)
      if (res.success) {
        setMessage(res.message || 'Purchase saved successfully!')
        setMessageType('success')
        setCart([])
        setSelectedSupplier('')
        setAddAsPiece(false)
        setPurchaseDate(new Date().toISOString().slice(0, 10)) // Reset to today
      } else {
        setMessage(res.message || 'Error saving purchase.')
        setMessageType('error')
      }
    } catch (err) {
      console.error(err)
      setMessage('An unexpected error occurred.')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  const grandTotal = cart.reduce((sum, item) => sum + item.qty * item.price, 0)
  const filteredProducts = products.filter(
    p =>
      p.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.product_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.barcode?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  )
  const displayedProducts = showAll ? filteredProducts : filteredProducts.slice(0, 30)

  return (
    <div className="row">
      <div className="col-md-12">
        {message && (
          <div
            className={`mb-3 p-2 text-center font-bold ${messageType === 'success'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
              } rounded`}
          >
            {message}
          </div>
        )}

        <div className="portlet">
          <div className="portlet-heading">
            <h3 className="portlet-title text-dark text-uppercase">Purchase Product</h3>
          </div>

          <div id="portlet2" className="panel-collapse collapse in">
            <div className="portlet-body">
              <div className="row">
                {/* Product List */}
                <div className="col-md-6 col-sm-12">
                  <div className="box box-warning">
                    <div className="box-header box-header-background-light with-border">
                      <h3 className="box-title">Select Product</h3>
                    </div>
                    <div className="box-body">
                      <div className="mb-2">
                        <label>
                          <input
                            type="checkbox"
                            className="mr-2"
                            checked={addAsPiece}
                            onChange={e => setAddAsPiece(e.target.checked)}
                          />
                          Add as individual pieces instead of packets
                        </label>
                      </div>

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

                      <div className="mb-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-secondary"
                          onClick={() => setShowAll(!showAll)}
                        >
                          {showAll ? 'Show 30 Only' : 'Show All'}
                        </button>
                      </div>

                      <table className="table table-bordered table-hover purchase-products">
                        <thead>
                          <tr>
                            <th>Sl</th>
                            <th>Code</th>
                            <th>Name</th>
                            <th>Inventory</th>
                            <th>Unit</th>
                            <th>Packet Size</th>
                            <th>Purchase</th>
                          </tr>
                        </thead>
                        <tbody>
                          {displayedProducts.map((p, idx) => (
                            <tr key={p.product_id}>
                              <td>{idx + 1}</td>
                              <td>{p.product_code}</td>
                              <td>{p.product_name}</td>
                              <td>{Number(p.inventory).toFixed(1)}</td>
                              <td>{p.measurement_units}</td>
                              <td>{p.packet_size && p.packet_size > 0 ? Number(p.packet_size).toFixed(1) : 'N/A'}</td>
                              <td>
                                <button
                                  type="button"
                                  className="btn btn-primary btn-xs"
                                  onClick={() => addToCart(p)}
                                  title={p.packet_size && p.packet_size > 0 ? 
                                    (addAsPiece ? "Add 1 piece" : `Add 1 packet (${p.packet_size} pieces)`) : 
                                    "Add to cart"}
                                >
                                  <i className="fa fa-shopping-cart"></i>
                                  {p.packet_size && p.packet_size > 0 ? 
                                    (addAsPiece ? " Add Piece" : ` Add Packet`) : 
                                    " Add"}
                                </button>
                              </td>
                            </tr>
                          ))}
                          {displayedProducts.length === 0 && (
                            <tr>
                              <td colSpan={7} className="text-center">No Products Found</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Purchase Form */}
                <div className="col-md-6 col-sm-12">
                  <form method="post" onSubmit={handleSubmit} ref={formRef}>
                    <div className="box box-info">
                      <div className="box-header box-header-background-light with-border">
                        <h3 className="box-title">Purchase Order</h3>
                      </div>
                      <div className="box-background">
                        <div className="row">
                          <div className="col-md-6">
                            <label>Supplier</label>
                            <select
                              className="form-control"
                              value={selectedSupplier}
                              onChange={e => setSelectedSupplier(e.target.value)}
                              required
                              ref={supplierRef}
                            >
                              <option value="">Select Supplier</option>
                              {suppliers.map(s => (
                                <option key={s.supplier_id} value={s.supplier_id}>
                                  {s.supplier_name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="col-md-6">
                            <label>Date</label>
                            <input
                              type="date"
                              className="form-control"
                              value={purchaseDate}
                              onChange={e => setPurchaseDate(e.target.value)}
                              max={new Date().toISOString().slice(0, 10)}
                            />
                          </div>
                        </div>

                        {/* Cart Table */}
                        <table className="table table-bordered table-hover">
                          <thead>
                            <tr>
                              <th>Sl</th>
                              <th>Product</th>
                              <th>Qty</th>
                              <th>Unit</th>
                              <th>Unit Price</th>
                              <th>Total</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {cart.map((item, idx) => {
                              // Calculate display values
                              let displayQty, displayUnit, qtyStep;
                              
                              if (item.unitType === 'packet' && item.product.packet_size && item.product.packet_size > 0) {
                                // For packets, show packet quantity
                                displayQty = toSingleDecimal(item.qty / item.product.packet_size);
                                displayUnit = 'packet';
                                qtyStep = 0.1; // Allow decimal steps for packets
                              } else {
                                // For pieces, show piece quantity
                                displayQty = toSingleDecimal(item.qty);
                                displayUnit = item.product.measurement_units || 'pcs';
                                qtyStep = 0.1; // Allow decimal steps for pieces
                              }

                              return (
                                <tr key={item.product.product_id}>
                                  <td>{idx + 1}</td>
                                  <td>
                                    {item.product.product_name} 
                                    {item.unitType === 'packet' && item.product.packet_size ? 
                                      ` (Packet: ${item.product.packet_size} ${item.product.measurement_units || 'pcs'})` : 
                                      ''}
                                  </td>
                                  <td>
                                    <input
                                      type="number"
                                      className="form-control"
                                      value={displayQty}
                                      min={0.1}
                                      step={0.1}  // Changed from step={1} to step={0.1}
                                      onChange={e => {
                                        const val = parseFloat(e.target.value)
                                        if (!isNaN(val) && val >= 0.1) {
                                          updateCart(item.product.product_id, 'qty', val)
                                        }
                                      }}
                                      onBlur={e => {
                                        const val = parseFloat(e.target.value)
                                        if (isNaN(val) || val < 0.1) {
                                          updateCart(item.product.product_id, 'qty', 0.1)
                                        }
                                      }}
                                    />
                                  </td>
                                  <td>{displayUnit}</td>
                                  <td>
                                    <input
                                      type="number"
                                      className="form-control"
                                      value={toSingleDecimal(item.price)}
                                      min={0.01}
                                      step={0.01}
                                      onChange={e => {
                                        const inputValue = e.target.value
                                        const val = parseFloat(inputValue)
                                        if (!isNaN(val) && val > 0) {
                                          updateCart(item.product.product_id, 'price', val)
                                        }
                                      }}
                                      onBlur={e => {
                                        const inputValue = e.target.value
                                        const val = parseFloat(inputValue)
                                        if (isNaN(val) || val <= 0) {
                                          // Reset to previous value if invalid
                                          updateCart(item.product.product_id, 'price', item.price)
                                        }
                                      }}
                                    />
                                  </td>
                                  <td>{(item.qty * item.price).toFixed(2)}</td>
                                  <td>
                                    <button
                                      type="button"
                                      className="btn btn-danger btn-xs"
                                      onClick={() => removeFromCart(item.product.product_id)}
                                    >
                                      <i className="fa fa-trash-o"></i>
                                    </button>
                                  </td>
                                </tr>
                              )
                            })}
                            {cart.length === 0 && (
                              <tr>
                                <td colSpan={7} className="text-center">No items in cart</td>
                              </tr>
                            )}
                            <tr>
                              <td colSpan={4} className="text-right"><strong>Grand Total:</strong></td>
                              <td colSpan={3}><strong>{grandTotal.toFixed(2)}</strong></td>
                            </tr>
                            <tr>
                              <td colSpan={4} className="text-right"><strong>Purchase Reference</strong></td>
                              <td colSpan={3}>
                                <input type="text" name="purchase_ref" className="form-control" />
                              </td>
                            </tr>
                            <tr>
                              <td colSpan={4} className="text-right"><strong>Payment Method</strong></td>
                              <td colSpan={3}>
                                <select name="payment_method" className="form-control">
                                  <option value="cash">Cash</option>
                                  <option value="cheque">Cheque</option>
                                  <option value="card">Credit Card</option>
                                </select>
                              </td>
                            </tr>
                            <tr>
                              <td colSpan={4}></td>
                              <td colSpan={3}>
                                <button
                                  type="submit"
                                  className="btn bg-navy btn-block"
                                  disabled={loading}
                                >
                                  {loading ? (
                                    <>
                                      <i className="fa fa-spinner fa-spin" /> Saving...
                                    </>
                                  ) : (
                                    'Purchase'
                                  )}
                                </button>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}