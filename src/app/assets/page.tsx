'use client'
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AssetTable } from '@/components/assets/AssetTable'
import { AssetForm } from '@/components/assets/AssetForm'
import { Modal } from '@/components/shared/Modal'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { AssetWithRelations } from '@/types'

const BUILDINGS = ['', 'LPQ', 'MHS', 'BG', 'CC']
const CONDITIONS = ['', 'New', 'Good', 'Fair', 'Poor']

export default function AssetsPage() {
  const router = useRouter()
  const [assets, setAssets] = useState<AssetWithRelations[]>([])
  const [q, setQ] = useState('')
  const [building, setBuilding] = useState('')
  const [condition, setCondition] = useState('')
  const [showAdd, setShowAdd] = useState(false)

  const load = useCallback(async function load() {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (building) params.set('building', building)
    if (condition) params.set('condition', condition)
    const res = await fetch(`/api/assets?${params}`)
    const data = await res.json()
    setAssets(data.assets ?? [])
  }, [q, building, condition])

  useEffect(() => { load() }, [load])

  async function handleSave(data: any) {
    const res = await fetch('/api/assets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      const { asset } = await res.json()
      setShowAdd(false)
      router.push(`/assets/${asset.id}`)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-mono tracking-widest text-muted-foreground uppercase mb-1">Inventory</p>
          <h1 className="text-2xl font-semibold">Assets</h1>
        </div>
        <div className="flex gap-2">
          <a
            href="/assets/import"
            className="inline-flex items-center px-3 py-2 text-sm font-medium border rounded-md bg-card hover:bg-secondary transition-colors"
          >
            ↑ Import CSV
          </a>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center px-3 py-2 text-sm font-semibold text-white rounded-md hover:opacity-90 transition-opacity"
            style={{ backgroundColor: 'var(--navy)' }}
          >
            + Add Asset
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Input
          placeholder="Search tag, serial, model…"
          value={q}
          onChange={e => setQ(e.target.value)}
          className="max-w-xs bg-card"
        />
        <Select value={building} onValueChange={v => setBuilding(v ?? '')}>
          <SelectTrigger className="w-36 bg-card"><SelectValue placeholder="All buildings" /></SelectTrigger>
          <SelectContent>
            {BUILDINGS.map(b => <SelectItem key={b || '_all'} value={b}>{b || 'All buildings'}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={condition} onValueChange={v => setCondition(v ?? '')}>
          <SelectTrigger className="w-36 bg-card"><SelectValue placeholder="All conditions" /></SelectTrigger>
          <SelectContent>
            {CONDITIONS.map(c => <SelectItem key={c || '_all'} value={c}>{c || 'All conditions'}</SelectItem>)}
          </SelectContent>
        </Select>
        {(q || building || condition) && (
          <button
            onClick={() => { setQ(''); setBuilding(''); setCondition('') }}
            className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      <AssetTable assets={assets} onRefresh={load} />

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Asset">
        <AssetForm onSave={handleSave} onCancel={() => setShowAdd(false)} />
      </Modal>
    </div>
  )
}
