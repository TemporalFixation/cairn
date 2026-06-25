import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const include = {
  asset: true,
  submittedBy: { select: { id: true, name: true } },
  assignedTo: { select: { id: true, name: true } },
}

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const ticket = await prisma.repairTicket.findUnique({ where: { id: params.id }, include })
  if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ ticket })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const data = await req.json()
  if (data.status === 'Resolved' || data.status === 'Closed') {
    data.resolvedAt = new Date()
  }
  const ticket = await prisma.repairTicket.update({ where: { id: params.id }, data, include })
  return NextResponse.json({ ticket })
}
