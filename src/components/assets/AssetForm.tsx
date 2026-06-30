'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BuildingRoomSelect } from '@/components/shared/BuildingRoomSelect'
import { PersonSearch } from '@/components/shared/PersonSearch'
import type { Asset, PersonSnapshot } from '@/types'

type Props = { asset?: Asset; onSave: (data: any) => Promise<void>; onCancel?: () => void }

export function AssetForm({ asset, onSave, onCancel }: Props) {
  const [form, setForm] = useState({
    assetTag: asset?.assetTag ?? '',
    serialNumber: asset?.serialNumber ?? '',
    model: asset?.model ?? '',
    manufacturer: asset?.manufacturer ?? '',
    building: asset?.building ?? '',
    roomId: asset?.roomId ?? '',
    condition: asset?.condition ?? 'Good',
    fundingSource: asset?.fundingSource ?? '',
    purchaseDate: asset?.purchaseDate ? new Date(asset.purchaseDate).toISOString().split('T')[0] : '',
    purchasePrice: asset?.purchasePrice?.toString() ?? '',
    warrantyExpiration: asset?.warrantyExpiration ? new Date(asset.warrantyExpiration).toISOString().split('T')[0] : '',
    notes: asset?.notes ?? '',
  })
  const [person, setPerson] = useState<PersonSnapshot | null>((asset?.assignedToPerson as PersonSnapshot) ?? null)
  const [secondaryTags, setSecondaryTags] = useState<string[]>((asset as any)?.secondaryTags ?? [])
  const [newTag, setNewTag] = useState('')
  const [loading, setLoading] = useState(false)
  const [manufacturers, setManufacturers] = useState<string[]>([])
  const [models, setModels] = useState<string[]>([])
  const [fundingSources, setFundingSources] = useState<string[]>([])
  const set = (k: string) => (v: string) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    fetch('/api/lookup?category=manufacturer&parent=').then(r => r.json()).then(d => setManufacturers(d.values?.map((v: any) => v.value) ?? []))
    fetch('/api/lookup?category=fundingSource&parent=').then(r => r.json()).then(d => setFundingSources(d.values?.map((v: any) => v.value) ?? []))
  }, [])

  // Load models when manufacturer changes
  useEffect(() => {
    if (!form.manufacturer || form.manufacturer === '__other__') { setModels([]); return }
    fetch(`/api/lookup?category=model&parent=${encodeURIComponent(form.manufacturer)}`)
      .then(r => r.json())
      .then(d => setModels(d.values?.map((v: any) => v.value) ?? []))
  }, [form.manufacturer])

  function handleManufacturerChange(v: string) {
    set('manufacturer')(v)
    set('model')('') // reset model when manufacturer changes
  }

  const mfrKnown = manufacturers.includes(form.manufacturer)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    // Flush any tag still sitting in the input field
    const finalTags = newTag.trim() && !secondaryTags.includes(newTag.trim())
      ? [...secondaryTags, newTag.trim()]
      : secondaryTags
    await onSave({ ...form, assignedToPerson: person ?? null, secondaryTags: finalTags })
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Asset Tag *</Label>
          <Input value={form.assetTag} onChange={e => set('assetTag')(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label>Serial Number *</Label>
          <Input value={form.serialNumber} onChange={e => set('serialNumber')(e.target.value)} required />
        </div>

        {/* Manufacturer */}
        <div className="space-y-1">
          <Label>Manufacturer *</Label>
          {manufacturers.length > 0 ? (
            <Select value={mfrKnown ? form.manufacturer : '__other__'} onValueChange={handleManufacturerChange}>
              <SelectTrigger><SelectValue placeholder="Select manufacturer" /></SelectTrigger>
              <SelectContent>
                {manufacturers.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                <SelectItem value="__other__">Other…</SelectItem>
              </SelectContent>
            </Select>
          ) : null}
          {(!mfrKnown || form.manufacturer === '__other__') && (
            <Input
              value={form.manufacturer === '__other__' ? '' : form.manufacturer}
              onChange={e => set('manufacturer')(e.target.value)}
              placeholder="Enter manufacturer"
              required
            />
          )}
        </div>

        {/* Model — smart dropdown filtered by manufacturer */}
        <div className="space-y-1">
          <Label>Model *</Label>
          {models.length > 0 ? (
            <>
              <Select value={models.includes(form.model) ? form.model : '__other__'} onValueChange={set('model')}>
                <SelectTrigger><SelectValue placeholder="Select model" /></SelectTrigger>
                <SelectContent>
                  {models.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  <SelectItem value="__other__">Other…</SelectItem>
                </SelectContent>
              </Select>
              {(!models.includes(form.model) || form.model === '__other__') && (
                <Input
                  value={form.model === '__other__' ? '' : form.model}
                  onChange={e => set('model')(e.target.value)}
                  placeholder="Enter model"
                  required
                  className="mt-1"
                />
              )}
            </>
          ) : (
            <Input value={form.model} onChange={e => set('model')(e.target.value)} required placeholder="e.g. Chromebook 314" />
          )}
        </div>
      </div>

      <div className="space-y-1">
        <Label>Condition</Label>
        <Select value={form.condition} onValueChange={v => set('condition')(v ?? 'Good')}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {['New', 'Good', 'Fair', 'Poor'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <BuildingRoomSelect
        buildingValue={form.building}
        roomValue={form.roomId}
        onBuildingChange={set('building')}
        onRoomChange={set('roomId')}
      />
      <PersonSearch value={person} onSelect={setPerson} />

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Purchase Date</Label>
          <Input type="date" value={form.purchaseDate} onChange={e => set('purchaseDate')(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Purchase Price</Label>
          <Input type="number" step="0.01" value={form.purchasePrice} onChange={e => set('purchasePrice')(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Warranty Expiration</Label>
          <Input type="date" value={form.warrantyExpiration} onChange={e => set('warrantyExpiration')(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Funding Source</Label>
          {fundingSources.length > 0 ? (
            <Select value={form.fundingSource} onValueChange={set('fundingSource')}>
              <SelectTrigger><SelectValue placeholder="Select funding source" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">— None —</SelectItem>
                {fundingSources.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
          ) : (
            <Input value={form.fundingSource} onChange={e => set('fundingSource')(e.target.value)} placeholder="e.g. E-Rate 2024" />
          )}
        </div>
      </div>

      <div className="space-y-1">
        <Label>Notes</Label>
        <Input value={form.notes} onChange={e => set('notes')(e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label>Secondary Asset Tags <span className="text-muted-foreground font-normal">(alternate or replacement tags)</span></Label>
        {secondaryTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {secondaryTags.map(tag => (
              <span key={tag} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary border text-xs font-mono">
                {tag}
                <button type="button" onClick={() => setSecondaryTags(t => t.filter(x => x !== tag))} className="text-muted-foreground hover:text-destructive transition-colors">✕</button>
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <Input
            value={newTag}
            onChange={e => setNewTag(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault()
                const t = newTag.trim()
                if (t && !secondaryTags.includes(t)) setSecondaryTags(tags => [...tags, t])
                setNewTag('')
              }
            }}
            placeholder="Scan or type tag, press Enter to add"
            className="flex-1 font-mono"
          />
          <Button type="button" variant="outline" onClick={() => {
            const t = newTag.trim()
            if (t && !secondaryTags.includes(t)) setSecondaryTags(tags => [...tags, t])
            setNewTag('')
          }}>Add</Button>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={loading}>{loading ? 'Saving…' : 'Save Asset'}</Button>
        {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>}
      </div>
    </form>
  )
}
