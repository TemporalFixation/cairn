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

  const body = await req.json()
  const { assetId, issueType, issueDescription } = body
  if (!assetId || !issueType || !issueDescription) {
    return NextResponse.json({ error: 'assetId, issueType, issueDescription required' }, { status: 400 })
  }
  const toStr = (v: string | null | undefined) => v && v !== '' ? v : null
  const toFloat = (v: any) => v !== '' && v != null ? parseFloat(v) : null
  const toInt = (v: any) => v !== '' && v != null ? parseInt(v) : null
  const submittedById = (session.user as any).id ?? session.user.id ?? null
  console.log('ticket create — submittedById:', submittedById, 'session.user:', JSON.stringify(session.user))

  try {
    const ticket = await prisma.repairTicket.create({
      data: {
        assetId,
        issueType,
        issueDescription,
        submittedById,
        assignedToId: toStr(body.assignedToId),
        partsUsed: toStr(body.partsUsed),
        repairCost: toFloat(body.repairCost),
        timeSpentMinutes: toInt(body.timeSpentMinutes),
        csNumber: toStr(body.csNumber),
      },
      include,
    })
    return NextResponse.json({ ticket }, { status: 201 })
  } catch (err: any) {
    console.error('Ticket create error:', err)
    return NextResponse.json({ error: err.message ?? 'Failed to create ticket' }, { status: 500 })
  }
}
