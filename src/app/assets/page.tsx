'use client'
import { useEffect, useState } from 'react'
import { AssetTable } from '@/components/assets/AssetTable'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import type { AssetWithRelations } from '@/types'

const BUILDINGS = ['', 'LPQ', 'MHS', 'BG', 'CC']
const CONDITIONS = ['', 'New', 'Good', 'Fair', 'Poor']

export default function AssetsPage() {
  const [assets, setAssets] = useState<AssetWithRelations[]>([])
  const [q, setQ] = useState('')
  const [building, setBuilding] = useState('')
  const [condition, setCondition] = useState('')

  async function load() {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (building) params.set('building', building)
    if (condition) params.set('condition', condition)
    const res = await fetch(`/api/assets?${params}`)
    const data = await res.json()
    setAssets(data.assets ?? [])
  }

  useEffect(() => { load() }, [q, building, condition])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Assets</h1>
        <div className="flex gap-2">
          <Link href="/assets/import"><Button variant="outline">Import CSV</Button></Link>
          <Link href="/assets/new"><Button>Add Asset</Button></Link>
        </div>
      </div>
      <div className="flex gap-3">
        <Input
          placeholder="Search serial, tag, model..."
          value={q}
          onChange={e => setQ(e.target.value)}
          className="max-w-xs"
        />
        <Select value={building} onValueChange={setBuilding}>
          <SelectTrigger className="w-32"><SelectValue placeholder="Building" /></SelectTrigger>
          <SelectContent>
            {BUILDINGS.map(b => <SelectItem key={b || '_all'} value={b}>{b || 'All'}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={condition} onValueChange={setCondition}>
          <SelectTrigger className="w-32"><SelectValue placeholder="Condition" /></SelectTrigger>
          <SelectContent>
            {CONDITIONS.map(c => <SelectItem key={c || '_all'} value={c}>{c || 'All'}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <AssetTable assets={assets} onRefresh={load} />
    </div>
  )
}
