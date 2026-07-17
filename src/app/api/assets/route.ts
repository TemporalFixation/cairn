import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Building, Condition } from '@prisma/client'

const include = { room: true, repairTickets: { orderBy: { createdAt: 'desc' as const }, take: 5 } }
const notDeleted = { deletedAt: null }

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const building = searchParams.get('building') as Building | null
  const condition = searchParams.get('condition') as Condition | null
  const q = searchParams.get('q')

  const assetTag = searchParams.get('assetTag')
  if (assetTag) {
    let asset = await prisma.asset.findFirst({ where: { assetTag, ...notDeleted }, include })
    if (!asset) {
      asset = await prisma.asset.findFirst({ where: { secondaryTags: { has: assetTag }, ...notDeleted }, include }) ?? null
    }
    return NextResponse.json({ asset: asset ?? null })
  }

  const serialNumber = searchParams.get('serialNumber')
  if (serialNumber) {
    const asset = await prisma.asset.findFirst({ where: { serialNumber, ...notDeleted }, include })
    return NextResponse.json({ asset: asset ?? null })
  }

  const where: any = { ...notDeleted }
  if (building) where.building = building
  if (condition) where.condition = condition
  if (q) where.OR = [
    { serialNumber: { contains: q, mode: 'insensitive' } },
    { assetTag: { contains: q, mode: 'insensitive' } },
    { model: { contains: q, mode: 'insensitive' } },
    { manufacturer: { contains: q, mode: 'insensitive' } },
  ]

  const assets = await prisma.asset.findMany({ where, include, orderBy: { updatedAt: 'desc' } })
  return NextResponse.json({ assets })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const data = await req.json()
  const { serialNumber, assetTag, model, manufacturer, building, condition } = data
  if (!serialNumber || !assetTag || !model || !manufacturer || !building) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const toDate = (v: string | null | undefined) => v ? new Date(v) : null
  const toFloat = (v: string | null | undefined) => v && v !== '' ? parseFloat(v) : null
  const toStr = (v: string | null | undefined) => v && v !== '' ? v : null

  try {
    // If a soft-deleted record exists with this asset tag or serial number, restore it instead
    const deleted = await prisma.asset.findFirst({
      where: {
        OR: [{ assetTag }, { serialNumber }],
        deletedAt: { not: null },
      },
    })

    const assetData = {
      serialNumber,
      assetTag,
      model,
      manufacturer,
      building,
      condition: condition ?? 'Good',
      roomId: toStr(data.roomId),
      assignedToPerson: data.assignedToPerson ?? null,
      purchaseDate: toDate(data.purchaseDate),
      purchasePrice: toFloat(data.purchasePrice),
      warrantyExpiration: toDate(data.warrantyExpiration),
      fundingSource: toStr(data.fundingSource),
      notes: toStr(data.notes),
      providedAccessories: data.providedAccessories ?? [],
      deletedAt: null,
      deletedBy: null,
      deletedReason: null,
    }

    const asset = deleted
      ? await prisma.asset.update({ where: { id: deleted.id }, data: assetData })
      : await prisma.asset.create({ data: assetData })

    // Auto-register manufacturer and model in lookup tables so dropdowns work
    await prisma.lookupValue.upsert({
      where: { category_value_parentValue: { category: 'manufacturer', value: manufacturer, parentValue: '' } },
      update: {},
      create: { category: 'manufacturer', value: manufacturer, parentValue: '' },
    })
    await prisma.lookupValue.upsert({
      where: { category_value_parentValue: { category: 'model', value: model, parentValue: manufacturer } },
      update: {},
      create: { category: 'model', value: model, parentValue: manufacturer },
    })

    const performedBy = session.user?.name ?? session.user?.email ?? 'Unknown'
    await prisma.assetEvent.create({
      data: {
        assetId: asset.id,
        eventType: 'Enrolled',
        accessories: data.providedAccessories ?? [],
        performedBy,
      },
    })

    return NextResponse.json({ asset }, { status: 201 })
  } catch (err: any) {
    console.error('Asset create error:', err)
    return NextResponse.json({ error: err.message ?? 'Failed to create asset' }, { status: 500 })
  }
}
