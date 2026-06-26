import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parseCsv } from '@/lib/csv'
import { Building, Condition } from '@prisma/client'

type AssetRow = {
  asset_tag: string; serial_number: string; model: string; manufacturer: string
  building: string; condition?: string; purchase_date?: string; purchase_price?: string
  warranty_expiration?: string; funding_source?: string; notes?: string
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const form = await req.formData()
  const file = form.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const text = await file.text()
  const { data, errors } = parseCsv<AssetRow>(text)
  const validBuildings = Object.values(Building) as string[]
  const validConditions = Object.values(Condition) as string[]
  let created = 0, updated = 0

  for (const row of data) {
    if (!row.asset_tag || !row.serial_number || !row.model || !row.manufacturer || !validBuildings.includes(row.building)) {
      errors.push(`Skipped row: missing required fields or invalid building (asset_tag: ${row.asset_tag})`)
      continue
    }
    const condition = (validConditions.includes(row.condition ?? '') ? row.condition : 'Good') as Condition
    const assetData = {
      assetTag: row.asset_tag, model: row.model, manufacturer: row.manufacturer,
      building: row.building as Building, condition,
      purchaseDate: row.purchase_date ? new Date(row.purchase_date) : null,
      purchasePrice: row.purchase_price ? parseFloat(row.purchase_price) : null,
      warrantyExpiration: row.warranty_expiration ? new Date(row.warranty_expiration) : null,
      fundingSource: row.funding_source ?? null,
      notes: row.notes ?? null,
    }
    try {
      const existing = await prisma.asset.findUnique({ where: { serialNumber: row.serial_number } })
      if (existing) {
        await prisma.asset.update({ where: { serialNumber: row.serial_number }, data: assetData })
        updated++
      } else {
        await prisma.asset.create({ data: { ...assetData, serialNumber: row.serial_number } })
        created++
      }
    } catch (e: any) {
      errors.push(`Error on ${row.serial_number}: ${e.message}`)
    }
  }
  return NextResponse.json({ created, updated, errors })
}
