import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type RouteParams = {
  params: Promise<{ id: string }>
}

// GET ledger by ID with transactions
export async function GET(
  request: NextRequest,
  context: RouteParams
) {
  try {
    const { id } = await context.params
    const ledgerId = parseInt(id)
    
    const ledger = await prisma.tbl_ledger.findUnique({
      where: { ledger_id: ledgerId },
    })

    if (!ledger) {
      return NextResponse.json(
        { success: false, error: 'Ledger not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: ledger })
  } catch (error) {
    console.error('Error fetching ledger:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch ledger' },
      { status: 500 }
    )
  }
}

// PUT update ledger
export async function PUT(
  request: NextRequest,
  context: RouteParams
) {
  try {
    const { id } = await context.params
    const ledgerId = parseInt(id)
    const body = await request.json()

    const ledger = await prisma.tbl_ledger.update({
      where: { ledger_id: ledgerId },
      data: {
        ledger_name: body.ledger_name,
        email: body.email || null,
        address: body.address || null,
      },
    })

    return NextResponse.json({ success: true, data: ledger })
  } catch (error) {
    console.error('Error updating ledger:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update ledger' },
      { status: 500 }
    )
  }
}

// DELETE ledger
export async function DELETE(
  request: NextRequest,
  context: RouteParams
) {
  try {
    const { id } = await context.params
    const ledgerId = parseInt(id)

    await prisma.tbl_ledger_transaction.deleteMany({
      where: { ledger_id: ledgerId },
    })

    await prisma.tbl_ledger.delete({
      where: { ledger_id: ledgerId },
    })

    return NextResponse.json({ success: true, message: 'Ledger deleted successfully' })
  } catch (error) {
    console.error('Error deleting ledger:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete ledger' },
      { status: 500 }
    )
  }
}