'use server'

import { prisma } from '@/lib/prisma'

type CartItem = {
    product_id: number
    qty: number
    price: number
}

type PurchasePayload = {
    supplier_id: number
    purchase_ref: string
    payment_method: string
    purchase_date?: string  // Add purchase_date field
    cart: CartItem[]
}

export async function SavePurchase(data: PurchasePayload) {
    try {
        console.log('🔍 Purchase payload received:', JSON.stringify(data, null, 2))
        console.log('🔍 Cart items quantities:', data.cart.map(item => ({
            product_id: item.product_id,
            qty: item.qty,
            qty_type: typeof item.qty
        })))

        // Validate input
        if (!data.supplier_id || !data.cart || data.cart.length === 0) {
            throw new Error('Supplier and at least one product are required')
        }

        // Use provided purchase date or default to current date
        const purchaseDate = data.purchase_date ? new Date(data.purchase_date) : new Date()
        console.log('📅 Purchase Date:', purchaseDate.toISOString())

        // Fetch supplier
        const supplier = await prisma.tbl_supplier.findUnique({
            where: { supplier_id: data.supplier_id },
        })

        if (!supplier) {
            throw new Error('Supplier not found')
        }

        // Calculate grand total
        const grandTotal = data.cart.reduce(
            (sum, item) => sum + (item.qty * item.price),
            0
        )

        // Start transaction
        const result = await prisma.$transaction(async prismaTx => {
            // 1. Create purchase header with purchase_date
            const purchase = await prismaTx.tbl_purchase.create({
                data: {
                    purchase_order_number: Math.floor(100000 + Math.random() * 900000),
                    supplier_id: data.supplier_id,
                    supplier_name: supplier.supplier_name,
                    grand_total: grandTotal,
                    purchase_ref: data.purchase_ref,
                    payment_method: data.payment_method,
                    payment_ref: '',
                    purchase_by: 'Admin',
                    datetime: purchaseDate,  // Add purchase date here
                },
            })

            console.log('✅ Purchase created with ID:', purchase.purchase_id, 'Date:', purchaseDate)

            // 2. Create purchase products
            const productDetails = await prisma.tbl_product.findMany({
                where: {
                    product_id: {
                        in: data.cart.map(item => item.product_id)
                    }
                },
                select: {
                    product_id: true,
                    product_code: true,
                    product_name: true
                }
            })

            const productMap = new Map(
                productDetails.map(p => [p.product_id, p])
            )

            // **FIX: Use raw SQL for purchase product insertion with DECIMAL(10,1)**
            for (const item of data.cart) {
                const product = productMap.get(item.product_id)
                const qty = Number(item.qty)
                const price = Number(item.price)
                
                console.log(`🔍 Inserting purchase product ${item.product_id}, qty: ${qty}`)

                await prismaTx.$executeRaw`
                    INSERT INTO tbl_purchase_product (
                        purchase_id, product_id, product_code, product_name,
                        qty, unit_price, sub_total
                    ) VALUES (
                        ${purchase.purchase_id}, ${item.product_id}, 
                        ${product?.product_code || ''}, ${product?.product_name || ''},
                        ${qty},  -- DECIMAL(10,1) for quantity
                        ${price},
                        ${qty * price}
                    )
                `
            }

            // 3. Update inventory quantities **USING RAW SQL**
            for (const item of data.cart) {
                // Find existing inventory
                const inventory = await prismaTx.tbl_inventory.findFirst({
                    where: { product_id: item.product_id },
                })

                const qty = Number(item.qty)
                console.log(`🔍 Updating inventory for product ${item.product_id}, adding: ${qty}`)

                if (inventory) {
                    // **FIX: Use raw SQL for decimal addition**
                    const currentQty = Number(inventory.product_quantity)
                    const newQty = currentQty + qty
                    
                    console.log(`📦 Inventory update: ${currentQty} + ${qty} = ${newQty}`)
                    
                    await prismaTx.$executeRaw`
                        UPDATE tbl_inventory 
                        SET product_quantity = ${newQty}
                        WHERE inventory_id = ${inventory.inventory_id}
                    `
                    
                    // Verify update
                    const updated = await prismaTx.tbl_inventory.findUnique({
                        where: { inventory_id: inventory.inventory_id },
                    })
                    console.log(`✅ Inventory after update: ${updated?.product_quantity}`)
                } else {
                    // Create new inventory
                    console.log(`📦 Creating new inventory for product ${item.product_id} with qty: ${qty}`)
                    await prismaTx.$executeRaw`
                        INSERT INTO tbl_inventory (
                            product_id, product_quantity, notify_quantity
                        ) VALUES (
                            ${item.product_id}, ${qty}, 0
                        )
                    `
                }

                // 4. Update last purchase price
                const existingPrice = await prismaTx.tbl_product_price.findFirst({
                    where: { product_id: item.product_id },
                })

                if (existingPrice) {
                    await prismaTx.tbl_product_price.update({
                        where: { product_price_id: existingPrice.product_price_id },
                        data: {
                            buying_price: item.price,
                        },
                    })
                }
            }

            return purchase
        })

        return { 
            success: true, 
            message: 'Purchase saved successfully',
            purchase_id: result.purchase_id 
        }
    } catch (err: any) {
        console.error('❌ SavePurchase error:', err)
        console.error('❌ Error stack:', err.stack)
        return { 
            success: false, 
            message: err instanceof Error ? err.message : 'Failed to save purchase'
        }
    }
}