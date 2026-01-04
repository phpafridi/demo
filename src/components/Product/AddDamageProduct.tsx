'use client'
import React, { useEffect, useState } from 'react'
import FetchProducts from './actions/FetchProduct'
import { AddDamageProductAction } from './actions/AddDamageProductAction'

type Product = {
  product_id: number
  product_code: string | null
  product_name: string
  product_note: string | null
  measurement_units: string | null
  status: number | null
  subcategory_id: number | null
  barcode_path: string | null
  barcode: string | null
  tax_id: number | null
}

export default function AddDamageProduct() {
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  const getProducts = async () => {
    const data = await FetchProducts()
    setProducts(data)
  }

  useEffect(() => {
    getProducts()
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)

    // Add selected product fields into FormData
    if (selectedProduct) {
      formData.set('product_id', selectedProduct.product_id.toString())
      formData.set('product_code', selectedProduct.product_code ?? '')
      formData.set('product_name', selectedProduct.product_name)
    }

    const res = await AddDamageProductAction(formData)

    if (res.success) {
      alert('✅ Damage product added successfully')
      form.reset() // 🔥 reset all inputs
      setSelectedProduct(null) // 🔥 reset selected product dropdown
    } else {
      alert(`❌ Error: ${res.message}`)
    }
  }

  return (
    <section className="content">
      <div className="row">
        <div className="col-md-12">
          <div className="box box-primary">
            <div className="box-header box-header-background with-border">
              <h3 className="box-title">Add Damage Product</h3>
            </div>

            <form id="damageProductForm" onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-6 col-sm-12">
                  <div className="box-body">
                    {/* Product Select */}
                    <div className="form-group">
                      <label>
                        Select Product<span className="required">*</span>
                      </label>
                      <select
                        className="form-control"
                        value={selectedProduct?.product_id ?? ''}
                        onChange={(e) => {
                          const product = products.find(
                            (p) => p.product_id === Number(e.target.value)
                          )
                          setSelectedProduct(product || null)
                        }}
                        required
                      >
                        <option value="">Select Product</option>
                        {products.map((prod) => (
                          <option key={prod.product_id} value={prod.product_id}>
                            {prod.product_name} - {prod.product_code}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Show product code if selected */}
                    {selectedProduct && (
                      <div className="form-group">
                        <label>Product Code</label>
                        <input
                          type="text"
                          className="form-control"
                          value={selectedProduct.product_code ?? ''}
                          readOnly
                        />
                      </div>
                    )}

                    {/* Damage Qty */}
                    <div className="form-group">
                      <label>
                        Damage Quantity (piecs) <span className="required">*</span>
                      </label>
                      <input
                        type="number"
                        name="qty"
                        placeholder="Damage Qty"
                        className="form-control"
                        required
                      />
                    </div>

                    {/* Notes */}
                    <div className="form-group">
                      <label>Notes</label>
                      <textarea
                        name="note"
                        className="form-control autogrow"
                        placeholder="Note"
                      ></textarea>
                    </div>

                    {/* Decrease Stock */}
                    <div className="form-group">
                      <label>Decrease From Stock</label>
                      <select name="decrease" className="form-control">
                        <option value="">Decrease From Stock ?</option>
                        <option value="1">Yes</option>
                        <option value="0">No</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="box-footer">
                <button type="submit" className="btn bg-navy btn-flat">
                  Add Damage Product
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
