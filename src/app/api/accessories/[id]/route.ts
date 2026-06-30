import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const data: any = {}
  if ('initialCount' in body) data.initialCount = parseInt(body.initialCount) || 0
  if ('reconciledCount' in body) data.reconciledCount = body.reconciledCount === '' || body.reconciledCount === null ? null : parseInt(body.reconciledCount)

  try {
    const row = await prisma.accessoryCount.update({ where: { id: params.id }, data })
    return NextResponse.json({ row })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
