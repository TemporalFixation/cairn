import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const DEFAULTS: Record<string, string> = {
  appName: 'Cairn',
  primaryColor: '#BC1616',
  navbarColor: '#7A0E0E',
  goldColor: '#CD9A3B',
}

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const rows = await prisma.appSetting.findMany()
  const settings: Record<string, string> = { ...DEFAULTS }
  rows.forEach(r => { settings[r.key] = r.value })
  return NextResponse.json({ settings })
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if ((session.user as any).role !== 'Admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const updates: Record<string, string> = await req.json()
  await Promise.all(
    Object.entries(updates).map(([key, value]) =>
      prisma.appSetting.upsert({ where: { key }, update: { value }, create: { key, value } })
    )
  )
  return NextResponse.json({ ok: true })
}
