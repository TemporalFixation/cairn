// @jest-environment node
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { readFile } from 'fs/promises'
import path from 'path'

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? '/app/uploads'

const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.heic': 'image/heic',
}

export async function GET(_: NextRequest, { params }: { params: { path: string[] } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const filePath = path.join(UPLOAD_DIR, ...params.path)
  // Prevent path traversal
  if (!filePath.startsWith(UPLOAD_DIR)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const bytes = await readFile(filePath)
    const ext = path.extname(filePath).toLowerCase()
    return new NextResponse(bytes, {
      headers: { 'Content-Type': MIME[ext] ?? 'application/octet-stream' },
    })
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
}
