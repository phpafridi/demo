'use client'
import { create } from 'zustand'
import { fetchLowStock } from '../Product/actions/FetchLowStock'
import { fetchPendingOrders } from '../Product/actions/FetchPendingOrders'

type Product = {
  id: number
  name: string
  qty: number
  unit: string
  notifyQty: number | null
  isLowStock: boolean
}

type Order = {
  id: number
  customer_name: string
  order_date: string
}

type ExpiryProduct = {
  id: number
  name: string
  expiry_date: string
  days_remaining: number
  stock_quantity: number
  is_expired: boolean
}

type NotificationState = {
  lowStockProducts: Product[]
  pendingOrders: Order[]
  expiringProducts: ExpiryProduct[]
  expiredProducts: ExpiryProduct[]
  refreshLowStock: () => Promise<void>
  refreshPendingOrders: () => Promise<void>
  refreshExpiryAlerts: () => Promise<void>
}

export const useNotifications = create<NotificationState>((set) => ({
  lowStockProducts: [],
  pendingOrders: [],
  expiringProducts: [],
  expiredProducts: [],

  refreshLowStock: async () => {
    const data = await fetchLowStock()
    // No need to convert here - already converted in fetchLowStock
    set({ lowStockProducts: data })
  },

  refreshPendingOrders: async () => {
    const data = await fetchPendingOrders()
    set({ pendingOrders: data })
  },

  refreshExpiryAlerts: async () => {
    try {
      const res = await fetch('/api/alerts/expiry')
      const data = await res.json()
      
      if (data.success) {
        const today = new Date();
        
        const formatProduct = (product: any, isExpired: boolean = false) => {
          const expiryDate = product.expiration_date ? new Date(product.expiration_date) : null;
          let days_remaining = 0;
          
          if (expiryDate) {
            const timeDiff = expiryDate.getTime() - today.getTime();
            days_remaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
          }
          
          return {
            id: product.product_id,
            name: product.product_name,
            expiry_date: expiryDate ? expiryDate.toLocaleDateString() : 'N/A',
            days_remaining: isExpired ? 0 : Math.max(0, days_remaining),
            stock_quantity: product.inventories?.[0]?.product_quantity ? Number(product.inventories[0].product_quantity) : 0, // Convert Decimal
            is_expired: isExpired
          }
        }

        set({ 
          expiringProducts: data.data.expiring ? data.data.expiring.map((product: any) => formatProduct(product, false)) : [],
          expiredProducts: data.data.expired ? data.data.expired.map((product: any) => formatProduct(product, true)) : []
        })
      } else {
        console.error('Failed to fetch expiry alerts:', data.error)
        set({ expiringProducts: [], expiredProducts: [] })
      }
    } catch (error) {
      console.error('Failed to fetch expiry alerts:', error)
      set({ expiringProducts: [], expiredProducts: [] })
    }
  },
}))