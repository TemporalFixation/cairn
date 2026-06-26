import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = req.nextUrl
  const category = searchParams.get('category')
  const parentValue = searchParams.get('parent') ?? ''
  const where: any = {}
  if (category) where.category = category
  where.parentValue = parentValue
  const values = await prisma.lookupValue.findMany({ where, orderBy: [{ sortOrder: 'asc' }, { value: 'asc' }] })
  return NextResponse.json({ values })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'Admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { category, value, parentValue = '' } = await req.json()
  if (!category || !value) return NextResponse.json({ error: 'category and value required' }, { status: 400 })
  const maxOrder = await prisma.lookupValue.aggregate({ where: { category, parentValue }, _max: { sortOrder: true } })
  const row = await prisma.lookupValue.create({
    data: { category, value, parentValue, sortOrder: (maxOrder._max.sortOrder ?? -1) + 1 },
  })
  return NextResponse.json({ value: row }, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'Admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await req.json()
  await prisma.lookupValue.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
