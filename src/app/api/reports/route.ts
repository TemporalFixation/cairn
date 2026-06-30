import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const notDeleted = { deletedAt: null }

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const type = searchParams.get('type')

  if (type === 'assets-by-model') {
    const model = searchParams.get('model') ?? ''
    const manufacturer = searchParams.get('manufacturer') ?? ''
    const where: any = { ...notDeleted }
    if (model) where.model = { contains: model, mode: 'insensitive' }
    if (manufacturer) where.manufacturer = manufacturer
    const assets = await prisma.asset.findMany({
      where,
      include: { room: true },
      orderBy: [{ building: 'asc' }, { model: 'asc' }, { assetTag: 'asc' }],
    })
    return NextResponse.json({ assets })
  }

  if (type === 'assets-by-person') {
    const name = (searchParams.get('name') ?? '').toLowerCase()
    const all = await prisma.asset.findMany({
      where: { assignedToPerson: { not: null }, ...notDeleted },
      include: { room: true },
      orderBy: [{ manufacturer: 'asc' }, { assetTag: 'asc' }],
    })
    const assets = name
      ? all.filter(a => {
          const p = a.assignedToPerson as any
          return p?.name?.toLowerCase().includes(name)
        })
      : all
    return NextResponse.json({ assets })
  }

  if (type === 'checked-out') {
    const assets = await prisma.asset.findMany({
      where: { assignedToPerson: { not: null }, ...notDeleted },
      include: { room: true },
      orderBy: [{ manufacturer: 'asc' }, { assetTag: 'asc' }],
    })
    return NextResponse.json({ assets })
  }

  if (type === 'assets-by-year') {
    const year = searchParams.get('year')
    const where: any = { purchaseDate: { not: null }, ...notDeleted }
    if (year) {
      const start = new Date(`${year}-01-01`)
      const end = new Date(`${year}-12-31T23:59:59`)
      where.purchaseDate = { gte: start, lte: end }
    }
    const assets = await prisma.asset.findMany({
      where,
      include: { room: true },
      orderBy: [{ purchaseDate: 'desc' }, { assetTag: 'asc' }],
    })
    if (!year) {
      const noDates = await prisma.asset.findMany({
        where: { purchaseDate: null, ...notDeleted },
        include: { room: true },
        orderBy: { assetTag: 'asc' },
      })
      return NextResponse.json({ assets: [...assets, ...noDates] })
    }
    return NextResponse.json({ assets })
  }

  if (type === 'most-repaired') {
    const since = searchParams.get('since')
    const ticketWhere: any = {}
    if (since) ticketWhere.createdAt = { gte: new Date(since) }

    const ticketCounts = await prisma.repairTicket.groupBy({
      by: ['assetId'],
      where: ticketWhere,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 25,
    })

    if (ticketCounts.length === 0) return NextResponse.json({ rows: [] })

    const assetIds = ticketCounts.map(r => r.assetId)
    const assets = await prisma.asset.findMany({
      where: { id: { in: assetIds }, ...notDeleted },
      include: { room: true },
    })
    const assetMap = Object.fromEntries(assets.map(a => [a.id, a]))

    const rows = ticketCounts.map(r => ({
      asset: assetMap[r.assetId] ?? null,
      ticketCount: r._count.id,
    })).filter(r => r.asset)

    return NextResponse.json({ rows })
  }

  if (type === 'assets-by-building') {
    const building = searchParams.get('building') ?? ''
    const assets = await prisma.asset.findMany({
      where: building ? { building, ...notDeleted } : { ...notDeleted },
      include: { room: true },
      orderBy: [{ building: 'asc' }, { room: { name: 'asc' } }, { assetTag: 'asc' }],
    })
    return NextResponse.json({ assets })
  }

  if (type === 'parts-inventory') {
    const parts = await prisma.part.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { ticketParts: true } } },
    })
    return NextResponse.json({ parts })
  }

  if (type === 'ticket-summary') {
    const since = searchParams.get('since')
    const until = searchParams.get('until')
    const where: any = {}
    if (since || until) {
      where.createdAt = {}
      if (since) where.createdAt.gte = new Date(since)
      if (until) where.createdAt.lte = new Date(until)
    }
    const tickets = await prisma.repairTicket.findMany({
      where,
      include: { asset: true, assignedTo: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ tickets })
  }

  if (type === 'reconcile') {
    const months = parseInt(searchParams.get('months') ?? '6')
    const cutoff = new Date()
    cutoff.setMonth(cutoff.getMonth() - months)

    const assets = await prisma.asset.findMany({
      where: { updatedAt: { lt: cutoff }, ...notDeleted },
      include: {
        room: true,
        repairTickets: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { updatedAt: 'asc' },
    })

    const rows = assets.map(a => {
      const latestTicket = a.repairTickets[0]?.createdAt ?? null
      const lastSeen = latestTicket && latestTicket > a.updatedAt ? latestTicket : a.updatedAt
      const daysSince = Math.floor((Date.now() - new Date(lastSeen).getTime()) / 86400000)
      return { ...a, lastSeen, daysSince }
    })
    const stale = rows.filter(r => new Date(r.lastSeen) < cutoff)

    return NextResponse.json({ assets: stale, cutoff: cutoff.toISOString(), months })
  }

  if (type === 'deleted-assets') {
    const assets = await prisma.asset.findMany({
      where: { deletedAt: { not: null } },
      include: { room: true },
      orderBy: { deletedAt: 'desc' },
    })
    return NextResponse.json({ assets })
  }

  if (type === 'accessory-reconcile') {
    const counts = await prisma.accessoryCount.findMany({
      orderBy: [{ building: 'asc' }, { accessoryType: 'asc' }],
    })

    // For each building+accessoryType, count assets that have it in providedAccessories
    const rows = await Promise.all(counts.map(async c => {
      const onRecord = await prisma.asset.count({
        where: {
          building: c.building,
          providedAccessories: { has: c.accessoryType },
          deletedAt: null,
        },
      })
      return { ...c, onRecord }
    }))

    return NextResponse.json({ rows })
  }

  if (type === 'meta') {
    const [manufacturers, models, assets] = await Promise.all([
      prisma.lookupValue.findMany({ where: { category: 'manufacturer', parentValue: '' }, orderBy: { value: 'asc' } }),
      prisma.lookupValue.findMany({ where: { category: 'model' }, orderBy: { value: 'asc' } }),
      prisma.asset.findMany({ select: { building: true }, where: { building: { not: null }, ...notDeleted }, distinct: ['building'], orderBy: { building: 'asc' } }),
    ])
    return NextResponse.json({
      manufacturers: manufacturers.map(m => m.value),
      models: models.map(m => m.value),
      buildings: [...new Set(assets.map(a => a.building).filter(Boolean))].sort(),
    })
  }

  return NextResponse.json({ error: 'Unknown report type' }, { status: 400 })
}
