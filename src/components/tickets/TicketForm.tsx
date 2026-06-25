'use client'
import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Asset, ITUser } from '@/types'

const ISSUE_TYPES = ['Cracked Screen', 'Battery', 'Keyboard', 'Charging Port', 'Software', 'Lost/Stolen', 'Other']
const STATUSES = ['Open', 'InProgress', 'Resolved', 'Closed']
const STATUS_LABELS: Record<string, string> = {
  Open: 'Open',
  InProgress: 'In Progress',
  Resolved: 'Resolved',
  Closed: 'Closed',
}

type Props = {
  assetId?: string
  onSave: (data: any) => Promise<void>
  initialData?: any
}

export function TicketForm({ assetId, onSave, initialData }: Props) {
  const [form, setForm] = useState({
    assetId: assetId ?? initialData?.assetId ?? '',
    issueType: initialData?.issueType ?? '',
    issueDescription: initialData?.issueDescription ?? '',
    status: initialData?.status ?? 'Open',
    partsUsed: initialData?.partsUsed ?? '',
    repairCost: initialData?.repairCost?.toString() ?? '',
    timeSpentMinutes: initialData?.timeSpentMinutes?.toString() ?? '',
    csNumber: initialData?.csNumber ?? '',
    assignedToId: initialData?.assignedToId ?? '',
  })
  const [assetQuery, setAssetQuery] = useState(initialData?.asset?.serialNumber ?? '')
  const [assetResults, setAssetResults] = useState<Asset[]>([])
  const [techs, setTechs] = useState<ITUser[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/users').then(r => r.json()).then(d => setTechs(d.users ?? []))
  }, [])

  useEffect(() => {
    if (!assetId && assetQuery.length >= 2) {
      fetch(`/api/assets?q=${encodeURIComponent(assetQuery)}`).then(r => r.json()).then(d => setAssetResults(d.assets ?? []))
    }
  }, [assetQuery, assetId])

  const set = (k: string) => (v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await onSave({
      ...form,
      repairCost: form.repairCost ? parseFloat(form.repairCost) : null,
      timeSpentMinutes: form.timeSpentMinutes ? parseInt(form.timeSpentMinutes) : null,
    })
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      {!assetId && (
        <div className="space-y-1 relative">
          <Label>Asset (search by serial or tag) *</Label>
          <Input value={assetQuery} onChange={e => setAssetQuery(e.target.value)} placeholder="Search..." />
          {assetResults.length > 0 && !form.assetId && (
            <ul className="absolute z-10 w-full bg-white border rounded shadow max-h-40 overflow-y-auto">
              {assetResults.map(a => (
                <li
                  key={a.id}
                  className="px-3 py-2 hover:bg-slate-100 cursor-pointer text-sm"
                  onClick={() => {
                    setForm(f => ({ ...f, assetId: a.id }))
                    setAssetQuery(`${a.serialNumber} — ${a.manufacturer} ${a.model}`)
                    setAssetResults([])
                  }}
                >
                  {a.assetTag} · {a.serialNumber} · {a.manufacturer} {a.model}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Issue Type *</Label>
          <Select value={form.issueType} onValueChange={set('issueType')}>
            <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
            <SelectContent>{ISSUE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Status</Label>
          <Select value={form.status} onValueChange={set('status')}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUSES.map(s => <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1">
        <Label>Issue Description *</Label>
        <Input value={form.issueDescription} onChange={e => set('issueDescription')(e.target.value)} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Parts Used</Label>
          <Input value={form.partsUsed} onChange={e => set('partsUsed')(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Repair Cost ($)</Label>
          <Input type="number" step="0.01" value={form.repairCost} onChange={e => set('repairCost')(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Time Spent (minutes)</Label>
          <Input type="number" value={form.timeSpentMinutes} onChange={e => set('timeSpentMinutes')(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>CS Number (optional)</Label>
          <Input value={form.csNumber} onChange={e => set('csNumber')(e.target.value)} placeholder="External reference" />
        </div>
      </div>
      <div className="space-y-1">
        <Label>Assigned Technician</Label>
        <Select value={form.assignedToId} onValueChange={set('assignedToId')}>
          <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">Unassigned</SelectItem>
            {techs.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={loading || !form.assetId || !form.issueType || !form.issueDescription}>
        {loading ? 'Saving...' : 'Save Ticket'}
      </Button>
    </form>
  )
}
