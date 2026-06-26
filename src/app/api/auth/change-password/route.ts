import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { scryptSync, randomBytes } from 'crypto'

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { password, confirmPassword } = await req.json()
  if (!password || password.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  if (password !== confirmPassword) return NextResponse.json({ error: 'Passwords do not match' }, { status: 400 })

  const hash = hashPassword(password)
  const isLocalUser = (session.user as any).isLocalUser

  if (isLocalUser && session.user.email) {
    await prisma.localUser.update({
      where: { email: session.user.email },
      data: { passwordHash: hash, passwordChangeRequired: false },
    })
  } else {
    const now = new Date()
    await Promise.all([
      prisma.appSetting.upsert({ where: { key: 'adminPasswordHash' }, update: { value: hash, updatedAt: now }, create: { key: 'adminPasswordHash', value: hash, updatedAt: now } }),
      prisma.appSetting.upsert({ where: { key: 'passwordChangeRequired' }, update: { value: 'false', updatedAt: now }, create: { key: 'passwordChangeRequired', value: 'false', updatedAt: now } }),
    ])
  }

  return NextResponse.json({ ok: true })
}
