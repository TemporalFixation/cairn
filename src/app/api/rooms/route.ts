import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Building } from '@prisma/client'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const building = req.nextUrl.searchParams.get('building') as Building | null
  const where = building ? { building } : {}
  const rooms = await prisma.room.findMany({ where, orderBy: { name: 'asc' } })
  return NextResponse.json({ rooms })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'Admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { name, building, responsiblePerson, responsiblePersonEmail } = await req.json()
  if (!name || !building) return NextResponse.json({ error: 'name and building required' }, { status: 400 })

  // Accept either a full responsiblePerson object or just an email
  const personData = responsiblePerson
    ?? (responsiblePersonEmail ? { email: responsiblePersonEmail, name: responsiblePersonEmail, ou: 'Staff' } : null)

  const room = await prisma.room.create({ data: { name, building, responsiblePerson: personData } })
  return NextResponse.json({ room }, { status: 201 })
}
