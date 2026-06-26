'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Asset, ITUser } from '@/types'

const FALLBACK_ISSUE_TYPES = ['Cracked Screen', 'Battery', 'Keyboard', 'Charging Port', 'Software', 'Lost/Stolen', 'Other']

const STATUSES = [
  { value: 'Open', label: 'Open' },
  { value: 'InProgress', label: 'In Progress' },
  { value: 'WaitingForParts', label: 'Waiting for Parts' },
  { value: 'Resolved', label: 'Resolved' },
  { value: 'Closed', label: 'Closed' },
]

type Props = {
  assetId?: string
  ticketId?: string
  onSave: (data: any) => Promise<void>
  onCancel?: () => void
  initialData?: any
}

export function TicketForm({ assetId, ticketId, onSave, onCancel, initialData }: Props) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({
    assetId: assetId ?? initialData?.assetId ?? '',
    issueType: initialData?.issueType ?? '',
    issueDescription: initialData?.issueDescription ?? '',
    status: initialData?.status ?? 'Open',
    repairCost: initialData?.repairCost?.toString() ?? '',
    timeSpentMinutes: initialData?.timeSpentMinutes?.toString() ?? '',
    csNumber: initialData?.csNumber ?? '',
    assignedToId: initialData?.assignedToId ?? '',
  })
  const [assetQuery, setAssetQuery] = useState(initialData?.asset?.serialNumber ?? '')
  const [assetResults, setAssetResults] = useState<Asset[]>([])
  const [selectedAsset, setSelectedAsset] = useState<{ manufacturer?: string; model?: string } | null>(null)
  const [techs, setTechs] = useState<ITUser[]>([])
  const [photos, setPhotos] = useState<string[]>(initialData?.photos ?? [])
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [issueTypes, setIssueTypes] = useState<string[]>(FALLBACK_ISSUE_TYPES)

  // Parts state
  const [availableParts, setAvailableParts] = useState<any[]>([])
  const [ticketParts, setTicketParts] = useState<any[]>(initialData?.ticketParts ?? [])
  const [selectedPartId, setSelectedPartId] = useState('')
  const [selectedQty, setSelectedQty] = useState('1')
  const [partsError, setPartsError] = useState('')

  useEffect(() => {
    fetch('/api/lookup?category=issueType&parent=')
      .then(r => r.json())
      .then(d => { if (d.values?.length) setIssueTypes(d.values.map((v: any) => v.value)) })
  }, [])

  useEffect(() => {
    fetch('/api/users').then(r => r.json()).then(d => setTechs(d.users ?? []))
  }, [])

  useEffect(() => {
    if (!assetId && assetQuery.length >= 2) {
      fetch(`/api/assets?q=${encodeURIComponent(assetQuery)}`).then(r => r.json()).then(d => setAssetResults(d.assets ?? []))
    }
  }, [assetQuery, assetId])

  // Load asset info if pre-selected (to know manufacturer/model for parts)
  useEffect(() => {
    const id = form.assetId
    if (!id) return
    fetch(`/api/assets/${id}`).then(r => r.json()).then(d => {
      if (d.asset) setSelectedAsset({ manufacturer: d.asset.manufacturer, model: d.asset.model })
    }).catch(() => {})
  }, [form.assetId])

  // Load compatible parts when asset is known
  useEffect(() => {
    if (!selectedAsset?.manufacturer) { setAvailableParts([]); return }
    const params = new URLSearchParams({ manufacturer: selectedAsset.manufacturer })
    if (selectedAsset.model) params.set('model', selectedAsset.model)
    fetch(`/api/parts?${params}`).then(r => r.json()).then(d => setAvailableParts(d.parts ?? []))
  }, [selectedAsset])

  // Load ticket parts if editing an existing ticket
  useEffect(() => {
    if (!ticketId) return
    fetch(`/api/tickets/${ticketId}/parts`).then(r => r.json()).then(d => setTicketParts(d.ticketParts ?? []))
  }, [ticketId])

  const set = (k: string) => (v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await onSave({ ...form })
    setLoading(false)
    if (onCancel) { onCancel() } else { router.push('/tickets') }
  }

  async function handleAddPart() {
    if (!selectedPartId || !ticketId) return
    setPartsError('')
    const res = await fetch(`/api/tickets/${ticketId}/parts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ partId: selectedPartId, quantity: parseInt(selectedQty) || 1 }),
    })
    if (!res.ok) {
      const { error } = await res.json()
      setPartsError(error ?? 'Failed to add part')
      return
    }
    const { ticketPart } = await res.json()
    setTicketParts(p => [...p, ticketPart])
    setSelectedPartId('')
    setSelectedQty('1')
    // refresh available parts to get updated qty
    const params = new URLSearchParams({ manufacturer: selectedAsset?.manufacturer ?? '' })
    if (selectedAsset?.model) params.set('model', selectedAsset.model)
    fetch(`/api/parts?${params}`).then(r => r.json()).then(d => setAvailableParts(d.parts ?? []))
  }

  async function handleRemovePart(ticketPartId: string) {
    if (!ticketId) return
    await fetch(`/api/tickets/${ticketId}/parts`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketPartId }),
    })
    setTicketParts(p => p.filter(tp => tp.id !== ticketPartId))
    // refresh available parts
    const params = new URLSearchParams({ manufacturer: selectedAsset?.manufacturer ?? '' })
    if (selectedAsset?.model) params.set('model', selectedAsset.model)
    fetch(`/api/parts?${params}`).then(r => r.json()).then(d => setAvailableParts(d.parts ?? []))
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !ticketId) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch(`/api/tickets/${ticketId}/photos`, { method: 'POST', body: fd })
    if (res.ok) {
      const { url } = await res.json()
      setPhotos(p => [...p, url])
    }
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleDeletePhoto(url: string) {
    if (!ticketId) return
    await fetch(`/api/tickets/${ticketId}/photos`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    })
    setPhotos(p => p.filter(x => x !== url))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      {!assetId && (
        <div className="space-y-1 relative">
          <Label>Asset (search by serial or tag) *</Label>
          <Input value={assetQuery} onChange={e => setAssetQuery(e.target.value)} placeholder="Search..." />
          {assetResults.length > 0 && !form.assetId && (
            <ul className="absolute z-10 w-full bg-card border rounded shadow max-h-40 overflow-y-auto">
              {assetResults.map(a => (
                <li
                  key={a.id}
                  className="px-3 py-2 hover:bg-secondary cursor-pointer text-sm"
                  onClick={() => {
                    setForm(f => ({ ...f, assetId: a.id }))
                    setSelectedAsset({ manufacturer: (a as any).manufacturer, model: (a as any).model })
                    setAssetQuery(`${a.serialNumber} — ${(a as any).manufacturer} ${(a as any).model}`)
                    setAssetResults([])
                  }}
                >
                  {a.assetTag} · {a.serialNumber} · {(a as any).manufacturer} {(a as any).model}
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
            <SelectContent>{issueTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Status</Label>
          <Select value={form.status} onValueChange={set('status')}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
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
          <Label>Repair Cost ($)</Label>
          <Input type="number" step="0.01" value={form.repairCost} onChange={e => set('repairCost')(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Time Spent (minutes)</Label>
          <Input type="number" value={form.timeSpentMinutes} onChange={e => set('timeSpentMinutes')(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>CS Number <span className="text-muted-foreground font-normal">(optional)</span></Label>
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

      {/* Parts Used — structured, inventory-aware */}
      <div className="space-y-2">
        <Label>Parts Used</Label>
        {ticketParts.length > 0 && (
          <div className="bg-secondary/40 rounded-md divide-y border">
            {ticketParts.map(tp => (
              <div key={tp.id} className="flex items-center justify-between px-3 py-2">
                <div>
                  <span className="text-sm font-medium">{tp.part.name}</span>
                  {tp.part.partNumber && <span className="ml-2 font-mono text-xs text-muted-foreground">#{tp.part.partNumber}</span>}
                  <span className="ml-2 text-xs text-muted-foreground">× {tp.quantity}</span>
                </div>
                {ticketId && (
                  <button type="button" onClick={() => handleRemovePart(tp.id)} className="text-xs text-muted-foreground hover:text-destructive transition-colors">Remove</button>
                )}
              </div>
            ))}
          </div>
        )}
        {ticketId ? (
          <div className="flex gap-2 items-end">
            <div className="flex-1 space-y-1">
              <Select value={selectedPartId} onValueChange={setSelectedPartId}>
                <SelectTrigger>
                  <SelectValue placeholder={availableParts.length === 0 ? 'No compatible parts' : 'Select part…'} />
                </SelectTrigger>
                <SelectContent>
                  {availableParts.map(p => (
                    <SelectItem key={p.id} value={p.id} disabled={p.quantityOnHand === 0}>
                      <span>{p.name}</span>
                      <span className={`ml-2 font-mono text-xs ${p.quantityOnHand <= p.lowStockThreshold ? 'text-amber-600' : 'text-muted-foreground'}`}>
                        ({p.quantityOnHand} in stock)
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-20 space-y-1">
              <Input type="number" min="1" value={selectedQty} onChange={e => setSelectedQty(e.target.value)} placeholder="Qty" />
            </div>
            <button
              type="button"
              onClick={handleAddPart}
              disabled={!selectedPartId}
              className="px-3 py-2 text-sm font-semibold text-white rounded-md disabled:opacity-40 hover:opacity-90 transition-opacity"
              style={{ backgroundColor: 'var(--navy)' }}
            >
              Add
            </button>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Save ticket first to add parts.</p>
        )}
        {partsError && <p className="text-xs text-destructive">{partsError}</p>}
      </div>

      {/* Photos */}
      {ticketId && (
        <div className="space-y-3">
          <Label>Photos</Label>
          {photos.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {photos.map(url => (
                <div key={url} className="relative group w-24 h-24">
                  <img
                    src={url}
                    alt=""
                    className="w-24 h-24 object-cover rounded border cursor-zoom-in hover:opacity-90 transition-opacity"
                    onClick={() => setLightbox(url)}
                  />
                  <button
                    type="button"
                    onClick={() => handleDeletePhoto(url)}
                    className="absolute top-1 right-1 bg-black/60 text-white text-xs rounded px-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
          <div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border rounded-md bg-card hover:bg-secondary transition-colors disabled:opacity-50"
            >
              {uploading ? 'Uploading…' : '+ Add Photo'}
            </button>
          </div>
        </div>
      )}
      {!ticketId && (
        <p className="text-xs text-muted-foreground">Save the ticket first, then add photos.</p>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setLightbox(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] p-2" onClick={e => e.stopPropagation()}>
            <img src={lightbox} alt="" className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" />
            <button
              type="button"
              onClick={() => setLightbox(null)}
              className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading || !form.assetId || !form.issueType || !form.issueDescription}
          className="px-4 py-2 text-sm font-semibold text-white rounded-md disabled:opacity-50 hover:opacity-90 transition-opacity"
          style={{ backgroundColor: 'var(--navy)' }}
        >
          {loading ? 'Saving…' : 'Save Ticket'}
        </button>
        <button
          type="button"
          onClick={() => { onCancel ? onCancel() : router.push('/tickets') }}
          className="px-4 py-2 text-sm font-medium border rounded-md bg-card hover:bg-secondary transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
