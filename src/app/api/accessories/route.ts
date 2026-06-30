import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await prisma.accessoryCount.findMany({
    orderBy: [{ building: 'asc' }, { accessoryType: 'asc' }],
  })
  return NextResponse.json({ rows })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { building, accessoryType, quantity } = await req.json()
  if (!building || !accessoryType || !quantity) {
    return NextResponse.json({ error: 'building, accessoryType, quantity required' }, { status: 400 })
  }

  const row = await prisma.accessoryCount.upsert({
    where: { building_accessoryType: { building, accessoryType } },
    update: { initialCount: { increment: parseInt(quantity) } },
    create: { building, accessoryType, initialCount: parseInt(quantity) },
  })
  return NextResponse.json({ row }, { status: 201 })
}
