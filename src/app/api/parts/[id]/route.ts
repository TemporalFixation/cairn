import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'Admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const data = await req.json()
  const part = await prisma.part.update({
    where: { id: params.id },
    data: {
      name: data.name,
      partNumber: data.partNumber || null,
      compatManufacturer: data.compatManufacturer || null,
      compatModel: data.compatModel || null,
      quantityOnHand: parseInt(data.quantityOnHand) || 0,
      lowStockThreshold: parseInt(data.lowStockThreshold) || 2,
    },
  })
  return NextResponse.json({ part })
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'Admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  await prisma.part.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
