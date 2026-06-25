import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Building, Condition } from '@prisma/client'

const include = { room: true, repairTickets: { orderBy: { createdAt: 'desc' as const }, take: 5 } }

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const building = searchParams.get('building') as Building | null
  const condition = searchParams.get('condition') as Condition | null
  const q = searchParams.get('q')

  const where: any = {}
  if (building) where.building = building
  if (condition) where.condition = condition
  if (q) where.OR = [
    { serialNumber: { contains: q, mode: 'insensitive' } },
    { assetTag: { contains: q, mode: 'insensitive' } },
    { model: { contains: q, mode: 'insensitive' } },
    { manufacturer: { contains: q, mode: 'insensitive' } },
  ]

  const assets = await prisma.asset.findMany({ where, include, orderBy: { updatedAt: 'desc' } })
  return NextResponse.json({ assets })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const data = await req.json()
  const { serialNumber, assetTag, model, manufacturer, building, condition, ...rest } = data
  if (!serialNumber || !assetTag || !model || !manufacturer || !building) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  const asset = await prisma.asset.create({
    data: { serialNumber, assetTag, model, manufacturer, building, condition: condition ?? 'Good', ...rest },
  })
  return NextResponse.json({ asset }, { status: 201 })
}
