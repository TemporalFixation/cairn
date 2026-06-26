import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const include = { room: true, repairTickets: { orderBy: { createdAt: 'desc' as const }, take: 5 } }

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const asset = await prisma.asset.findUnique({ where: { id: params.id }, include })
  if (!asset) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ asset })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const updateData: any = {}
  const allowedFields = ['assetTag', 'serialNumber', 'model', 'manufacturer', 'condition', 'building', 'roomId', 'assignedToPerson', 'purchaseDate', 'purchasePrice', 'warrantyExpiration', 'fundingSource', 'notes', 'providedAccessories', 'checkedOutAt', 'secondaryTags']
  for (const field of allowedFields) {
    if (field in body) updateData[field] = body[field] ?? null
  }
  const asset = await prisma.asset.update({ where: { id: params.id }, data: updateData })
  return NextResponse.json({ asset })
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await prisma.asset.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
