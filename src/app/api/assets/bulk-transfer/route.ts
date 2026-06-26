import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Building } from '@prisma/client'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { assetIds, roomId, building, person } = await req.json()
  if (!assetIds?.length) return NextResponse.json({ error: 'No assets specified' }, { status: 400 })

  const data: any = {}

  if (person) {
    data.assignedToPerson = person
  } else if (roomId) {
    // Move to a specific room (building inferred from room)
    const room = await prisma.room.findUnique({ where: { id: roomId } })
    if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    data.roomId = roomId
    data.building = room.building
  } else if (building) {
    // Move to building only — clear room assignment
    data.building = building as Building
    data.roomId = null
  } else {
    return NextResponse.json({ error: 'Specify building, roomId, or person' }, { status: 400 })
  }

  const result = await prisma.asset.updateMany({ where: { id: { in: assetIds } }, data })
  return NextResponse.json({ updated: result.count })
}
