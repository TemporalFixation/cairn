import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { TicketStatus } from '@prisma/client'

const include = {
  asset: true,
  submittedBy: { select: { id: true, name: true } },
  assignedTo: { select: { id: true, name: true } },
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const status = searchParams.get('status') as TicketStatus | null
  const building = searchParams.get('building')
  const where: any = {}
  if (status) where.status = status
  if (building) where.asset = { building }

  const tickets = await prisma.repairTicket.findMany({ where, include, orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ tickets })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { assetId, issueType, issueDescription, assignedToId, partsUsed, repairCost, timeSpentMinutes, csNumber } = await req.json()
  if (!assetId || !issueType || !issueDescription) {
    return NextResponse.json({ error: 'assetId, issueType, issueDescription required' }, { status: 400 })
  }
  const ticket = await prisma.repairTicket.create({
    data: { assetId, issueType, issueDescription, submittedById: session.user.id, assignedToId, partsUsed, repairCost, timeSpentMinutes, csNumber },
    include,
  })
  return NextResponse.json({ ticket }, { status: 201 })
}
