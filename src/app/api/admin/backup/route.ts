import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function escapeCell(val: unknown): string {
  if (val === null || val === undefined) return ''
  const str = Array.isArray(val) ? val.join(';') : String(val)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export async function GET() {
  const session = await auth()
  if (!session || (session.user as any)?.role !== 'Admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const assets = await prisma.asset.findMany({
    where: { deletedAt: null },
    include: { room: true },
    orderBy: [{ building: 'asc' }, { assetTag: 'asc' }],
  })

  const headers = [
    'asset_tag', 'serial_number', 'manufacturer', 'model', 'condition',
    'building', 'room', 'assigned_to', 'checked_out_at',
    'purchase_date', 'purchase_price', 'warranty_expiration',
    'funding_source', 'provided_accessories', 'notes',
  ]

  const rows = assets.map(a => {
    const person = a.assignedToPerson as any
    return [
      a.assetTag,
      a.serialNumber,
      a.manufacturer,
      a.model,
      a.condition,
      a.building ?? '',
      a.room?.name ?? '',
      person?.name ?? '',
      a.checkedOutAt ? new Date(a.checkedOutAt).toISOString().split('T')[0] : '',
      a.purchaseDate ? new Date(a.purchaseDate).toISOString().split('T')[0] : '',
      a.purchasePrice ?? '',
      a.warrantyExpiration ? new Date(a.warrantyExpiration).toISOString().split('T')[0] : '',
      a.fundingSource ?? '',
      Array.isArray(a.providedAccessories) ? (a.providedAccessories as string[]).join(';') : '',
      a.notes ?? '',
    ].map(escapeCell).join(',')
  })

  const csv = [headers.join(','), ...rows].join('\n')
  const date = new Date().toISOString().split('T')[0]

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="cairn-backup-${date}.csv"`,
    },
  })
}
