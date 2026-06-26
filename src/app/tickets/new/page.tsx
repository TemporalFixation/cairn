'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { TicketForm } from '@/components/tickets/TicketForm'

export default function NewTicketPage() {
  const router = useRouter()
  const params = useSearchParams()
  const assetId = params.get('assetId') ?? undefined

  async function handleSave(data: any) {
    const res = await fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      const { ticket } = await res.json()
      router.push(`/tickets/${ticket.id}`)
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">New Repair Ticket</h1>
      <TicketForm assetId={assetId} onSave={handleSave} />
    </div>
  )
}
