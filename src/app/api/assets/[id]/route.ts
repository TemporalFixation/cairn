import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const include = {
  room: true,
  repairTickets: { orderBy: { createdAt: 'desc' as const }, take: 5 },
  events: { orderBy: { createdAt: 'desc' as const } },
}

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

  const before = await prisma.asset.findUnique({ where: { id: params.id } })
  const asset = await prisma.asset.update({ where: { id: params.id }, data: updateData })

  const performedBy = session.user?.name ?? session.user?.email ?? 'Unknown'

  // Detect checkout
  if (!before?.assignedToPerson && asset.assignedToPerson) {
    const person = asset.assignedToPerson as any
    await prisma.assetEvent.create({
      data: {
        assetId: asset.id,
        eventType: 'CheckOut',
        person: person?.name ?? String(asset.assignedToPerson),
        accessories: asset.providedAccessories,
        performedBy,
      },
    })
  }

  // Detect check-in
  if (before?.assignedToPerson && !asset.assignedToPerson) {
    const prevPerson = before.assignedToPerson as any
    const prevAccessories: string[] = (before.providedAccessories as string[]) ?? []
    const returnedAccessories: string[] = (body.providedAccessories as string[]) ?? []
    const missing = prevAccessories.filter(a => !returnedAccessories.includes(a))
    await prisma.assetEvent.create({
      data: {
        assetId: asset.id,
        eventType: 'CheckIn',
        person: prevPerson?.name ?? String(before.assignedToPerson),
        accessories: returnedAccessories,
        missingAccessories: missing,
        performedBy,
      },
    })
  }

  return NextResponse.json({ asset })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const reason: string | null = body.reason ?? null
  const deletedBy = session.user?.name ?? session.user?.email ?? 'Unknown'

  await prisma.asset.update({
    where: { id: params.id },
    data: { deletedAt: new Date(), deletedBy, deletedReason: reason },
  })

  return NextResponse.json({ ok: true })
}
