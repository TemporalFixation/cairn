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

  // Only allow client-updatable fields (strip Prisma-managed fields)
  const updateData: any = {}
  if (body.issueType !== undefined) updateData.issueType = body.issueType
  if (body.issueDescription !== undefined) updateData.issueDescription = body.issueDescription
  if (body.status !== undefined) updateData.status = body.status
  if (body.partsUsed !== undefined) updateData.partsUsed = body.partsUsed
  if (body.repairCost !== undefined) updateData.repairCost = body.repairCost ?? null
  if (body.timeSpentMinutes !== undefined) updateData.timeSpentMinutes = body.timeSpentMinutes ?? null
  if (body.csNumber !== undefined) updateData.csNumber = body.csNumber || null
  if (assignedToId !== undefined) updateData.assignedToId = assignedToId

  if (body.status === 'Resolved' || body.status === 'Closed') {
    updateData.resolvedAt = new Date()
  }

  const ticket = await prisma.repairTicket.update({ where: { id: params.id }, data: updateData, include })
  return NextResponse.json({ ticket })
}
