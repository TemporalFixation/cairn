import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if ((session.user as any).role !== 'Admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const text = await req.text()
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  if (lines.length < 2) return NextResponse.json({ error: 'Empty CSV' }, { status: 400 })

  // Parse header row
  const header = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[^a-z]/g, ''))
  const col = (name: string) => header.indexOf(name)

  const results = { created: 0, skipped: 0, errors: [] as string[] }

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''))
    const get = (name: string) => cols[col(name)] ?? ''

    const firstName = get('firstname')
    const lastName = get('lastname')
    const email = get('emailaddress') || get('email') || null
    const idNumber = get('idnumber') || get('id') || null
    const userTypeRaw = get('usertype').toLowerCase()
    const roleRaw = get('role').toLowerCase()

    if (!firstName || !lastName) { results.errors.push(`Row ${i + 1}: missing name`); continue }

    const userType = userTypeRaw === 'student' ? 'Student' : 'Staff'
    const role = roleRaw === 'admin' ? 'Admin' : roleRaw === 'superuser' ? 'SuperUser' : 'User'

    try {
      await prisma.localUser.upsert({
        where: { email: email ?? `__no_email_${i}__` },
        update: { firstName, lastName, idNumber: idNumber || null, userType: userType as any, role: role as any },
        create: { firstName, lastName, email: email || null, idNumber: idNumber || null, userType: userType as any, role: role as any },
      })
      results.created++
    } catch {
      // If upsert fails (e.g. no email to match on), try create
      try {
        await prisma.localUser.create({
          data: { firstName, lastName, email: email || null, idNumber: idNumber || null, userType: userType as any, role: role as any }
        })
        results.created++
      } catch (e: any) {
        results.skipped++
        results.errors.push(`Row ${i + 1}: ${e.message?.slice(0, 80)}`)
      }
    }
  }

  return NextResponse.json(results)
}
