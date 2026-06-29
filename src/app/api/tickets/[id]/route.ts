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
  const body = await req.json()

  // Coerce empty string to null for nullable FK
  const assignedToId = body.assignedToId === '' ? null : (body.assignedToId ?? undefined)

  const toFloat = (v: any) => v !== '' && v != null ? parseFloat(v) : null
  const toInt = (v: any) => v !== '' && v != null ? parseInt(v) : null

  // Only allow client-updatable fields (strip Prisma-managed fields)
  const updateData: any = {}
  if (body.issueType !== undefined) updateData.issueType = body.issueType
  if (body.issueDescription !== undefined) updateData.issueDescription = body.issueDescription
  if (body.status !== undefined) updateData.status = body.status
  if (body.partsUsed !== undefined) updateData.partsUsed = body.partsUsed || null
  if (body.repairCost !== undefined) updateData.repairCost = toFloat(body.repairCost)
  if (body.timeSpentMinutes !== undefined) updateData.timeSpentMinutes = toInt(body.timeSpentMinutes)
  if (body.csNumber !== undefined) updateData.csNumber = body.csNumber || null
  if (assignedToId !== undefined) updateData.assignedToId = assignedToId

  if (body.status === 'Resolved' || body.status === 'Closed') {
    const existing = await prisma.repairTicket.findUnique({
      where: { id: params.id },
      select: { resolvedAt: true }
    })
    if (!existing?.resolvedAt) {
      updateData.resolvedAt = new Date()
    }
  }

  try {
    const ticket = await prisma.repairTicket.update({ where: { id: params.id }, data: updateData, include })
    return NextResponse.json({ ticket })
  } catch (err: any) {
    console.error('Ticket update error:', err)
    return NextResponse.json({ error: err.message ?? 'Failed to update ticket' }, { status: 500 })
  }
}
