import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { firstName, lastName, email, idNumber, userType, role } = await req.json()
  const user = await prisma.localUser.update({
    where: { id: params.id },
    data: { firstName, lastName, email: email || null, idNumber: idNumber || null, userType, role }
  })
  return NextResponse.json({ user })
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if ((session.user as any).role !== 'Admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  await prisma.localUser.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
