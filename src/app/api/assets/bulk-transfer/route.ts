import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { assetIds, roomId, person } = await req.json()
  if (!assetIds?.length) return NextResponse.json({ error: 'No assets specified' }, { status: 400 })
  if (!roomId && !person) return NextResponse.json({ error: 'Specify roomId or person' }, { status: 400 })
  if (roomId && person) return NextResponse.json({ error: 'Specify roomId or person, not both' }, { status: 400 })

  const data: any = {}
  if (roomId) { data.roomId = roomId; data.assignedToPerson = null }
  if (person) { data.assignedToPerson = person; data.roomId = null }

  const result = await prisma.asset.updateMany({ where: { id: { in: assetIds } }, data })
  return NextResponse.json({ updated: result.count })
}
