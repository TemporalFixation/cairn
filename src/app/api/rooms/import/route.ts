import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parseCsv } from '@/lib/csv'
import { Building } from '@prisma/client'

type RoomRow = { building: string; room_name: string; responsible_person_email?: string }

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const form = await req.formData()
  const file = form.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const text = await file.text()
  const { data, errors } = parseCsv<RoomRow>(text)
  const validBuildings = Object.values(Building) as string[]
  let created = 0

  for (const row of data) {
    if (!row.room_name || !validBuildings.includes(row.building)) {
      errors.push(`Skipped row: invalid building "${row.building}" or missing room_name`)
      continue
    }
    try {
      await prisma.room.create({
        data: {
          name: row.room_name,
          building: row.building as Building,
        },
      })
      created++
    } catch {
      errors.push(`Skipped "${row.room_name}": already exists in ${row.building}`)
    }
  }
  return NextResponse.json({ created, errors })
}
