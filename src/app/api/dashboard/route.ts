import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [totalAssets, openTickets, assetsByBuilding, recentAssets] = await Promise.all([
    prisma.asset.count(),
    prisma.repairTicket.count({ where: { status: { in: ['Open', 'InProgress'] } } }),
    prisma.asset.groupBy({ by: ['building'], _count: { id: true } }),
    prisma.asset.findMany({ orderBy: { updatedAt: 'desc' }, take: 5, include: { room: true } }),
  ])

  return NextResponse.json({
    totalAssets,
    openTickets,
    assetsByBuilding: assetsByBuilding.map(r => ({ building: r.building, count: r._count.id })),
    recentAssets,
  })
}
