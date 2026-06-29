import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST() {
  const session = await auth()
  if (!session || (session.user as any)?.role !== 'Admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const assets = await prisma.asset.findMany({
    where: { deletedAt: null },
    select: { manufacturer: true, model: true },
  })

  const seen = new Set<string>()
  const ops: Promise<any>[] = []

  for (const { manufacturer, model } of assets) {
    if (!manufacturer || !model) continue

    const mfrKey = `mfr::${manufacturer}`
    if (!seen.has(mfrKey)) {
      seen.add(mfrKey)
      ops.push(prisma.lookupValue.upsert({
        where: { category_value_parentValue: { category: 'manufacturer', value: manufacturer, parentValue: '' } },
        update: {},
        create: { category: 'manufacturer', value: manufacturer, parentValue: '' },
      }))
    }

    const modelKey = `model::${manufacturer}::${model}`
    if (!seen.has(modelKey)) {
      seen.add(modelKey)
      ops.push(prisma.lookupValue.upsert({
        where: { category_value_parentValue: { category: 'model', value: model, parentValue: manufacturer } },
        update: {},
        create: { category: 'model', value: model, parentValue: manufacturer },
      }))
    }
  }

  await Promise.all(ops)

  return NextResponse.json({ ok: true, assets: assets.length, lookups: ops.length })
}
