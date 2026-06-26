import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const q = req.nextUrl.searchParams.get('q') ?? ''
  const where = q ? {
    OR: [
      { firstName: { contains: q, mode: 'insensitive' as const } },
      { lastName: { contains: q, mode: 'insensitive' as const } },
      { email: { contains: q, mode: 'insensitive' as const } },
      { idNumber: { contains: q, mode: 'insensitive' as const } },
    ]
  } : {}
  const users = await prisma.localUser.findMany({ where, orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }], take: 50 })
  return NextResponse.json({ users })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { firstName, lastName, email, idNumber, userType, role } = await req.json()
  if (!firstName || !lastName) return NextResponse.json({ error: 'firstName and lastName required' }, { status: 400 })
  const user = await prisma.localUser.create({
    data: {
      firstName, lastName,
      email: email || null,
      idNumber: idNumber || null,
      userType: userType ?? 'Staff',
      role: role ?? 'User',
    }
  })
  return NextResponse.json({ user }, { status: 201 })
}
