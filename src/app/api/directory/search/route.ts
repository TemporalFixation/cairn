import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { searchDirectory } from '@/lib/google-directory'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const q = req.nextUrl.searchParams.get('q') ?? ''
  try {
    const results = await searchDirectory(q)
    return NextResponse.json({ results })
  } catch (err) {
    console.error('Directory search failed:', err)
    return NextResponse.json({ results: [] })
  }
}
