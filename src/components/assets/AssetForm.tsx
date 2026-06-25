'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BuildingRoomSelect } from '@/components/shared/BuildingRoomSelect'
import { PersonSearch } from '@/components/shared/PersonSearch'
import type { Asset, PersonSnapshot } from '@/types'

type Props = { asset?: Asset; onSave: (data: any) => Promise<void> }

export function AssetForm({ asset, onSave }: Props) {
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
  const [loading, setLoading] = useState(false)
  const set = (k: string) => (v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await onSave({ ...form, assignedToPerson: person ?? null })
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
        <div className="space-y-1">
          <Label>Manufacturer *</Label>
          <Input value={form.manufacturer} onChange={e => set('manufacturer')(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label>Model *</Label>
          <Input value={form.model} onChange={e => set('model')(e.target.value)} required />
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
          <Input value={form.fundingSource} onChange={e => set('fundingSource')(e.target.value)} placeholder="e.g. E-Rate 2024" />
        </div>
      </div>
      <div className="space-y-1">
        <Label>Notes</Label>
        <Input value={form.notes} onChange={e => set('notes')(e.target.value)} />
      </div>
      <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Asset'}</Button>
    </form>
  )
}
