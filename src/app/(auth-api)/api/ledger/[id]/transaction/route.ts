import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type RouteParams = {
  params: Promise<{ id: string }>
}

// GET all transactions for a ledger
export async function GET(
  request: NextRequest,
  context: RouteParams
) {
  try {
    const { id } = await context.params
    const ledgerId = parseInt(id)
    
    if (isNaN(ledgerId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ledger ID' },
        { status: 400 }
      )
    }

    // Get transactions
    const transactions = await prisma.tbl_ledger_transaction.findMany({
      where: { ledger_id: ledgerId },
      orderBy: { transaction_date: 'desc' }
    })

    return NextResponse.json({ 
      success: true, 
      data: transactions 
    })

  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch transactions',
        data: []
      },
      { status: 500 }
    )
  }
}

// POST - Add new transaction
export async function POST(
  request: NextRequest,
  context: RouteParams
) {
  try {
    const { id } = await context.params
    const ledgerId = parseInt(id)
    const body = await request.json()

    // Validate amount
    const amount = parseFloat(body.amount)
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid amount' },
        { status: 400 }
      )
    }

    // Get current ledger
    const ledger = await prisma.tbl_ledger.findUnique({
      where: { ledger_id: ledgerId }
    })

    if (!ledger) {
      return NextResponse.json(
        { success: false, error: 'Ledger not found' },
        { status: 404 }
      )
    }

    const currentBalance = ledger.total_balance.toNumber()
    let newBalance = currentBalance
    
    // Calculate new balance
    if (body.transaction_type === 'karz_leya') {
      newBalance = currentBalance + amount
    } else if (body.transaction_type === 'karz_deya') {
      newBalance = currentBalance - amount
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid transaction type' },
        { status: 400 }
      )
    }

    // Create transaction
    await prisma.tbl_ledger_transaction.create({
      data: {
        ledger_id: ledgerId,
        transaction_type: body.transaction_type,
        amount: amount,
        description: body.description || null,
        previous_balance: currentBalance,
        new_balance: newBalance,
        reference_number: body.reference_number || null,
        created_by: body.created_by || 'Admin',
      }
    })

    // Update ledger balance
    await prisma.tbl_ledger.update({
      where: { ledger_id: ledgerId },
      data: { total_balance: newBalance }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Transaction added successfully'
    })

  } catch (error) {
    console.error('Error adding transaction:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to add transaction'
      },
      { status: 500 }
    )
  }
}