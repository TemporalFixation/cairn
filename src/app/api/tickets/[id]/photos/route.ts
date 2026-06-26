// @jest-environment node
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? '/app/uploads'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ticket = await prisma.repairTicket.findUnique({ where: { id: params.id } })
  if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const ext = path.extname(file.name).toLowerCase()
  const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic']
  if (!allowed.includes(ext)) {
    return NextResponse.json({ error: 'File type not allowed' }, { status: 400 })
  }

  const filename = `${params.id}-${Date.now()}${ext}`
  const dir = path.join(UPLOAD_DIR, 'tickets', params.id)
  await mkdir(dir, { recursive: true })
  const bytes = await file.arrayBuffer()
  await writeFile(path.join(dir, filename), Buffer.from(bytes))

  const url = `/api/uploads/tickets/${params.id}/${filename}`
  await prisma.repairTicket.update({
    where: { id: params.id },
    data: { photos: { push: url } },
  })

  return NextResponse.json({ url }, { status: 201 })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { url } = await req.json()
  const ticket = await prisma.repairTicket.findUnique({ where: { id: params.id } })
  if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updated = ticket.photos.filter((p: string) => p !== url)
  await prisma.repairTicket.update({ where: { id: params.id }, data: { photos: updated } })
  return NextResponse.json({ ok: true })
}
