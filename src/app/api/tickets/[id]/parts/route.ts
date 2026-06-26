import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const ticketParts = await prisma.ticketPart.findMany({
    where: { ticketId: params.id },
    include: { part: true },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json({ ticketParts })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { partId, quantity = 1 } = await req.json()
  if (!partId) return NextResponse.json({ error: 'partId required' }, { status: 400 })

  const part = await prisma.part.findUnique({ where: { id: partId } })
  if (!part) return NextResponse.json({ error: 'Part not found' }, { status: 404 })
  if (part.quantityOnHand < quantity) {
    return NextResponse.json({ error: `Only ${part.quantityOnHand} in stock` }, { status: 409 })
  }

  const [ticketPart] = await prisma.$transaction([
    prisma.ticketPart.create({ data: { ticketId: params.id, partId, quantity }, include: { part: true } }),
    prisma.part.update({ where: { id: partId }, data: { quantityOnHand: { decrement: quantity } } }),
  ])

  return NextResponse.json({ ticketPart }, { status: 201 })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { ticketPartId } = await req.json()

  const ticketPart = await prisma.ticketPart.findUnique({ where: { id: ticketPartId } })
  if (!ticketPart) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.$transaction([
    prisma.ticketPart.delete({ where: { id: ticketPartId } }),
    prisma.part.update({ where: { id: ticketPart.partId }, data: { quantityOnHand: { increment: ticketPart.quantity } } }),
  ])

  return NextResponse.json({ ok: true })
}
