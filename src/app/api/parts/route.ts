import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = req.nextUrl
  const manufacturer = searchParams.get('manufacturer')
  const model = searchParams.get('model')

  const where: any = { OR: [{ compatManufacturer: null }] }
  if (manufacturer) where.OR.push({ compatManufacturer: manufacturer, compatModel: null })
  if (manufacturer && model) where.OR.push({ compatManufacturer: manufacturer, compatModel: model })

  const parts = await prisma.part.findMany({ where, orderBy: { name: 'asc' } })
  return NextResponse.json({ parts })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'Admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { name, partNumber, compatManufacturer, compatModel, quantityOnHand, lowStockThreshold } = await req.json()
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 })
  const part = await prisma.part.create({
    data: {
      name,
      partNumber: partNumber || null,
      compatManufacturer: compatManufacturer || null,
      compatModel: compatModel || null,
      quantityOnHand: parseInt(quantityOnHand) || 0,
      lowStockThreshold: parseInt(lowStockThreshold) || 2,
    },
  })
  return NextResponse.json({ part }, { status: 201 })
}
