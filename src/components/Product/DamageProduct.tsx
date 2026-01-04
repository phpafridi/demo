'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import FetchDamageProducts from './actions/FetchDamageProducts';

type DamageProduct = {
  damage_product_id: number;
  product_id: number | null;
  product_code: number | null;
  product_name: string | null;
  category: string | null;
  qty: number | null;
  note: string | null;
  decrease: number | null;
  date: Date | null;
  packet_size: number;
  measurement_units: string;
};

export default function DamageProduct() {
  const [DamageProducts, setDamageProducts] = useState<DamageProduct[]>([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const getDisplayQuantity = (product: DamageProduct) => {
    const qty = product.qty || 0
    const packetSize = product.packet_size
    const isMultiplePackets = packetSize > 0 && qty % packetSize === 0
    const displayQty = isMultiplePackets ? (qty / packetSize) : qty
    const displayUnit = isMultiplePackets ? 'packet' : product.measurement_units
    
    return { displayQty, displayUnit }
  }

  const getDamageProducts = async () => {
    const data = await FetchDamageProducts();
    const mapped: DamageProduct[] = data.map((item: any) => ({
      ...item,
      date: item.date ? new Date(item.date) : null,
    }));
    setDamageProducts(mapped);
  };

  useEffect(() => {
    getDamageProducts();
  }, []);

  const filteredProducts = DamageProducts.filter(
    (p) =>
      (p.product_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (p.product_code ? String(p.product_code) : '').toLowerCase().includes(search.toLowerCase())
  );

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentProducts =
    itemsPerPage === -1 ? filteredProducts : filteredProducts.slice(indexOfFirst, indexOfLast);

  const totalPages = itemsPerPage === -1 ? 1 : Math.ceil(filteredProducts.length / itemsPerPage);

  return (
    <section className="content">
      <div className="row">
        <div className="col-md-12">
          <div className="box box-primary">
            <div className="box-header box-header-background with-border d-flex justify-between items-center">
              <h3 className="box-title">Damage Product</h3>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search by code or name..."
                  className="form-control"
                  style={{ maxWidth: '250px' }}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                />

                <select
                  className="form-control"
                  value={itemsPerPage}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setItemsPerPage(val);
                    setCurrentPage(1);
                  }}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={-1}>Show All</option>
                </select>
              </div>
            </div>

            <div className="box-body">
              <Link
                href="/dashboard/product/add-damage-product"
                className="btn bg-navy btn-flat pull-right"
              >
                Add Damage Product
              </Link>

              <br />
              <br />

              <table className="table table-striped table-bordered text-center">
                <thead>
                  <tr>
                    <th className="text-center">Sl</th>
                    <th className="text-center">Product Code</th>
                    <th className="text-center">Product Name</th>
                    <th className="text-center">Category</th>
                    <th className="text-center">Damage Qty</th>
                    <th className="text-center">Note</th>
                    <th className="text-center">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {currentProducts.length > 0 ? (
                    currentProducts.map((p, i) => {
                      const { displayQty, displayUnit } = getDisplayQuantity(p)
                      
                      return (
                        <tr key={p.damage_product_id} className="custom-tr">
                          <td className="text-center">
                            {itemsPerPage === -1 ? i + 1 : indexOfFirst + i + 1}
                          </td>
                          <td className="text-center">{p.product_code}</td>
                          <td className="text-center">{p.product_name}</td>
                          <td className="text-center">{p.category}</td>
                          <td className="text-center">
                            {displayQty} {displayUnit}
                          </td>
                          <td className="text-center">{p.note}</td>
                          <td className="text-center">
                            {p.date ? p.date.toLocaleDateString() : ''}
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center">
                        <strong>There is no record for display</strong>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {itemsPerPage !== -1 && filteredProducts.length > itemsPerPage && (
                <div className="flex justify-between items-center mt-3">
                  <button
                    className="btn btn-default"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev) => prev - 1)}
                  >
                    Previous
                  </button>
                  <span>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    className="btn btn-default"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((prev) => prev + 1)}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}