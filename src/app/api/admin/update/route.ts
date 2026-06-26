import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

const WEBHOOK_PORT = process.env.WEBHOOK_PORT ?? '9191'
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET ?? ''

export async function POST() {
  const session = await auth()
  if (!session || (session.user as any)?.role !== 'Admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'WEBHOOK_SECRET not configured on host' }, { status: 503 })
  }

  const webhookUrl = `http://host.docker.internal:${WEBHOOK_PORT}/update?secret=${encodeURIComponent(WEBHOOK_SECRET)}`

  let upstreamRes: Response
  try {
    upstreamRes = await fetch(webhookUrl, {
      method: 'POST',
      signal: AbortSignal.timeout(300_000), // 5 min max
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: `Could not reach update server. Is cairn-update.service running on the host? (${err.message})` },
      { status: 503 }
    )
  }

  if (upstreamRes.status === 409) {
    return NextResponse.json({ error: 'Update already in progress' }, { status: 409 })
  }

  if (!upstreamRes.ok && upstreamRes.status !== 200) {
    return NextResponse.json({ error: `Webhook returned ${upstreamRes.status}` }, { status: 502 })
  }

  // Stream the log back to the browser
  return new NextResponse(upstreamRes.body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
