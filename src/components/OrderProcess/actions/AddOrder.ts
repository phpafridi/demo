'use server'

import { prisma } from '@/lib/prisma'

type OrderItem = {
  product_id: number
  qty: number
  price: number
  tax_amount?: number
}

type OrderPayload = {
  sales_person: string
  customer_id: number
  sale_ref: string
  payment_method: 'cash' | 'cheque' | 'card' | 'easypaisa' | 'pending'
  paid_amount: number
  discount: number
  sale_date?: string  // Add sale_date field
  cart: OrderItem[]
}

export async function AddOrder(payload: OrderPayload) {
  try {
    const { sales_person, customer_id, sale_ref, payment_method, paid_amount, discount, cart, sale_date } = payload

    console.log('🔍 DEBUG: Cart data received:', JSON.stringify(cart, null, 2))
    console.log('🔍 DEBUG: Sale date received:', sale_date)
    console.log('🔍 DEBUG: First item qty value:', cart[0]?.qty)
    console.log('🔍 DEBUG: First item qty type:', typeof cart[0]?.qty)

    if (!cart || cart.length === 0) {
      throw new Error('Cart cannot be empty')
    }

    const customer = await prisma.tbl_customer.findUnique({
      where: { customer_id },
    })

    const custId = customer ? customer.customer_id : 0
    const custName = customer ? customer.customer_name : 'Walking Client'
    const custEmail = customer ? customer.email : 'null'
    const custPhone = customer ? customer.phone : '00'
    const custAddress = customer ? customer.address : 'null'
    const shipAddress = customer ? customer.address : 'null'

    let totalTax = 0
    
    // Calculate subtotal
    const subtotal = cart.reduce((sum, item) => {
      return sum + (Number(item.qty) * Number(item.price))
    }, 0)
    
    const discountAmount = Number(discount)

    const orderStatus = payment_method === 'pending' ? 0 : 2

    // Use provided sale date or default to current date
    const orderDate = sale_date ? new Date(sale_date) : new Date()
    console.log('📅 Order Date being used:', orderDate.toISOString())

    const result = await prisma.$transaction(async (prismaTx) => {
      // Create order using RAW SQL with order_date
      const orderNo = Math.floor(Date.now() / 1000)
      
      // Create order using RAW SQL with order_date
      await prismaTx.$executeRaw`
        INSERT INTO tbl_order (
          order_no, customer_id, customer_name, customer_email, 
          customer_phone, customer_address, shipping_address,
          sub_total, discount, discount_amount, total_tax, grand_total,
          payment_method, payment_ref, order_status, note, sales_person,
          order_date  -- Add order_date field
        ) VALUES (
          ${orderNo}, ${custId}, ${custName}, ${custEmail},
          ${custPhone}, ${custAddress}, ${shipAddress},
          ${subtotal}, ${discount}, ${discountAmount}, 0, ${subtotal - discountAmount},
          ${payment_method}, ${sale_ref}, ${orderStatus}, '', ${sales_person || 'Unknown'},
          ${orderDate}  -- Use dynamic order date
        )
      `
      
      // Get the last inserted order ID - FIX: Convert BigInt to Number
      const orderIdResult: any[] = await prismaTx.$queryRaw`SELECT LAST_INSERT_ID() as order_id`
      const orderIdBigInt = orderIdResult[0]?.order_id
      
      // FIX: Convert BigInt to regular number
      const orderId = Number(orderIdBigInt)
      
      if (!orderId || isNaN(orderId)) {
        throw new Error('Failed to get order ID')
      }
      
      console.log('✅ Order created with ID:', orderId, 'Date:', orderDate.toISOString())

      // Insert order details with DECIMAL(10,1)
      for (const item of cart) {
        const product = await prismaTx.tbl_product.findUnique({
          where: { product_id: item.product_id },
          include: { prices: true, tax: true }
        })

        const buyingPrice = product?.prices?.[0]?.buying_price ? 
          Number(product.prices[0].buying_price) : 0
        
        const taxRate = product?.tax?.tax_rate ? 
          Number(product.tax.tax_rate) : 0
        
        const taxType = product?.tax?.tax_type ?? 1
        
        let taxAmount = item.tax_amount ? Number(item.tax_amount) : 0
        
        const itemQty = Number(item.qty)
        const itemPrice = Number(item.price)
        
        if (taxAmount === 0 && taxType === 1) {
          taxAmount = ((itemPrice * itemQty) * taxRate) / 100
        } else if (taxAmount === 0 && taxType === 2) {
          taxAmount = taxRate * itemQty
        }
        
        totalTax += taxAmount

        console.log('🔍 Inserting order detail with qty:', itemQty, 'rounded to 1 decimal:', itemQty.toFixed(1))

        // Use DECIMAL(10,1) for single decimal
        await prismaTx.$executeRaw`
          INSERT INTO tbl_order_details (
            product_id, order_id, product_code, product_name, 
            product_quantity, buying_price, selling_price, 
            product_tax, sub_total, price_option
          ) VALUES (
            ${item.product_id}, ${orderId}, ${product?.product_code || ''}, ${product?.product_name || ''},
            CAST(${itemQty} AS DECIMAL(10,1)),  -- DECIMAL(10,1) for single decimal
            CAST(${buyingPrice} AS DECIMAL(10,2)),
            CAST(${itemPrice} AS DECIMAL(10,2)),
            CAST(${taxAmount} AS DECIMAL(10,2)),
            CAST(${(itemQty * itemPrice) + taxAmount} AS DECIMAL(10,2)),
            'default'
          )
        `
      }

      console.log('✅ Order details inserted with RAW SQL')

      // Update order with total tax
      await prismaTx.$executeRaw`
        UPDATE tbl_order 
        SET total_tax = ${totalTax}, 
            grand_total = ${(subtotal - discountAmount) + totalTax}
        WHERE order_id = ${orderId}
      `

      // Update inventory with DECIMAL(10,1)
      for (const item of cart) {
        const inventory = await prismaTx.tbl_inventory.findFirst({
          where: { product_id: item.product_id },
        })
        
        if (inventory) {
          const currentQty = Number(inventory.product_quantity)
          const subtractQty = Number(item.qty)
          const newQty = currentQty - subtractQty
          
          console.log(`📦 Updating inventory: ${currentQty} - ${subtractQty} = ${newQty}`)
          
          // Use DECIMAL(10,1) for single decimal
          await prismaTx.$executeRaw`
            UPDATE tbl_inventory 
            SET product_quantity = CAST(${newQty} AS DECIMAL(10,1))
            WHERE inventory_id = ${inventory.inventory_id}
          `
          
          // Verify
          const updated = await prismaTx.tbl_inventory.findUnique({
            where: { inventory_id: inventory.inventory_id },
          })
          console.log(`✅ Inventory after update: ${updated?.product_quantity}`)
        }
      }

      // FIX: Get the complete order with details - ensure orderId is a number
      const order = await prismaTx.tbl_order.findUnique({
        where: { 
          order_id: Number(orderId) // Explicitly convert to Number
        },
        include: { details: true }
      })

      if (!order) {
        throw new Error('Failed to retrieve created order')
      }

      console.log('✅ FINAL ORDER DETAILS FROM DB:', order.details.map(d => ({
        product: d.product_name,
        quantity: d.product_quantity,
        quantity_type: typeof d.product_quantity,
      })))

      // Create invoice if needed with invoice_date
      let invoice = null
      if (payment_method !== 'pending') {
        invoice = await prismaTx.tbl_invoice.create({
          data: {
            invoice_no: Math.floor(Date.now() / 1000),
            order_id: Number(orderId), // FIX: Convert to number
            invoice_date: orderDate, // Use the same dynamic date
          },
        })
      }

      return { order, invoice }
    })

    return {
      success: true,
      order: result.order,
      invoice: result.invoice,
      message: payment_method === 'pending' ? 'Order saved as pending' : 'Order completed successfully'
    }
  } catch (err: any) {
    console.error('❌ ERROR:', err)
    console.error('❌ Error stack:', err.stack)
    return {
      success: false,
      message: err.message || 'Failed to save order'
    }
  }
}