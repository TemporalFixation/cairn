'use client'
import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const TABS = [
  { key: 'assets',  label: 'Asset Fields' },
  { key: 'tickets', label: 'Ticket Options' },
  { key: 'parts',   label: 'Parts Inventory' },
]

function tabFromParam(p: string | null) {
  if (p === 'tickets' || p === 'issueType' || p === 'fundingSource') return 'tickets'
  if (p === 'parts') return 'parts'
  return 'assets'
}

export default function TableConfigPage() {
  const params = useSearchParams()
  const [tab, setTab] = useState(() => tabFromParam(params.get('tab')))

  useEffect(() => {
    setTab(tabFromParam(params.get('tab')))
  }, [params])

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-mono tracking-widest text-muted-foreground uppercase mb-1">Admin › Config</p>
        <h1 className="text-2xl font-semibold">Table Configuration</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage the dropdown options used across the app.</p>
      </div>

      <div className="flex gap-1 border-b">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'assets'  && <AssetFieldsTab />}
      {tab === 'tickets' && <TicketOptionsTab />}
      {tab === 'parts'   && <PartsInventoryTab />}
    </div>
  )
}

/* ── Asset Fields tab ─────────────────────────────────────── */
function AssetFieldsTab() {
  const [mfrList, setMfrList] = useState<{ id: string; value: string }[]>([])
  const [selectedMfr, setSelectedMfr] = useState('')

  const loadMfr = useCallback(() => {
    fetch('/api/lookup?category=manufacturer&parent=').then(r => r.json()).then(d => setMfrList(d.values ?? []))
  }, [])
  useEffect(() => { loadMfr() }, [loadMfr])

  return (
    <div className="space-y-8">
      <Section title="Manufacturers">
        <LookupEditor category="manufacturer" parentValue="" onListChange={setMfrList} />
      </Section>

      <Section title="Models" description="Select a manufacturer to manage its device models.">
        <div className="space-y-4">
          <div className="space-y-1 max-w-xs">
            <Label>Manufacturer</Label>
            <Select value={selectedMfr} onValueChange={setSelectedMfr}>
              <SelectTrigger><SelectValue placeholder="Select manufacturer…" /></SelectTrigger>
              <SelectContent>
                {mfrList.map(m => <SelectItem key={m.id} value={m.value}>{m.value}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {selectedMfr && (
            <LookupEditor
              key={selectedMfr}
              category="model"
              parentValue={selectedMfr}
              label={`${selectedMfr} Models`}
            />
          )}
          {!selectedMfr && (
            <p className="text-sm text-muted-foreground font-mono">SELECT A MANUFACTURER ABOVE</p>
          )}
        </div>
      </Section>

      <Section title="Funding Sources">
        <LookupEditor category="fundingSource" parentValue="" />
      </Section>
    </div>
  )
}

/* ── Ticket Options tab ───────────────────────────────────── */
function TicketOptionsTab() {
  return (
    <div className="space-y-8">
      <Section title="Issue Types" description="Issue type options shown in the repair ticket form.">
        <LookupEditor category="issueType" parentValue="" />
      </Section>
    </div>
  )
}

/* ── Parts Inventory tab ──────────────────────────────────── */
function PartsInventoryTab() {
  const [parts, setParts] = useState<any[]>([])
  const [mfrList, setMfrList] = useState<string[]>([])
  const [modelList, setModelList] = useState<string[]>([])
  const [form, setForm] = useState({ name: '', partNumber: '', compatManufacturer: '', compatModel: '', quantityOnHand: '0', lowStockThreshold: '2' })
  const [editId, setEditId] = useState<string | null>(null)
  const [editQty, setEditQty] = useState('')
  const set = (k: string) => (v: string) => setForm(f => ({ ...f, [k]: v }))

  const load = useCallback(() => {
    fetch('/api/parts').then(r => r.json()).then(d => setParts(d.parts ?? []))
  }, [])
  useEffect(() => { load() }, [load])
  useEffect(() => {
    fetch('/api/lookup?category=manufacturer&parent=').then(r => r.json()).then(d => setMfrList(d.values?.map((v: any) => v.value) ?? []))
  }, [])
  useEffect(() => {
    if (!form.compatManufacturer) { setModelList([]); return }
    fetch(`/api/lookup?category=model&parent=${encodeURIComponent(form.compatManufacturer)}`)
      .then(r => r.json()).then(d => setModelList(d.values?.map((v: any) => v.value) ?? []))
  }, [form.compatManufacturer])

  async function handleAdd() {
    if (!form.name.trim()) return
    await fetch('/api/parts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setForm({ name: '', partNumber: '', compatManufacturer: '', compatModel: '', quantityOnHand: '0', lowStockThreshold: '2' })
    load()
  }

  async function handleDelete(id: string) {
    await fetch(`/api/parts/${id}`, { method: 'DELETE' })
    load()
  }

  async function handleUpdateQty(id: string) {
    await fetch(`/api/parts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...parts.find(p => p.id === id), quantityOnHand: editQty }),
    })
    setEditId(null)
    load()
  }

  const lowStock = parts.filter(p => p.quantityOnHand <= p.lowStockThreshold)

  return (
    <div className="space-y-8 max-w-3xl">
      {lowStock.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md p-3 flex items-start gap-2">
          <span className="text-amber-600 text-sm">⚠</span>
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Low stock on {lowStock.length} part{lowStock.length !== 1 ? 's' : ''}</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">{lowStock.map(p => `${p.name} (${p.quantityOnHand})`).join(' · ')}</p>
          </div>
        </div>
      )}

      {/* Parts list */}
      <div className="bg-card border rounded-md overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-0 text-xs font-semibold tracking-wide uppercase text-muted-foreground bg-secondary/60 px-4 py-2 border-b">
          <span>Part</span><span className="px-3">Compat</span><span className="px-3 text-right">On Hand</span><span className="px-3 text-right">Low @</span><span></span>
        </div>
        {parts.length === 0 && <p className="px-4 py-8 text-sm text-center text-muted-foreground font-mono">NO PARTS YET</p>}
        {parts.map(p => (
          <div key={p.id} className={`grid grid-cols-[1fr_auto_auto_auto_auto] items-center px-4 py-2.5 border-b last:border-0 ${p.quantityOnHand <= p.lowStockThreshold ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''}`}>
            <div>
              <span className="text-sm font-medium">{p.name}</span>
              {p.partNumber && <span className="ml-2 font-mono text-xs text-muted-foreground">#{p.partNumber}</span>}
            </div>
            <span className="px-3 text-xs text-muted-foreground">
              {p.compatManufacturer ? `${p.compatManufacturer}${p.compatModel ? ` · ${p.compatModel}` : ''}` : 'Universal'}
            </span>
            <span className="px-3 text-right">
              {editId === p.id ? (
                <span className="flex items-center gap-1">
                  <Input type="number" value={editQty} onChange={e => setEditQty(e.target.value)} className="w-16 h-7 text-xs" />
                  <button onClick={() => handleUpdateQty(p.id)} className="text-xs text-primary font-medium">Save</button>
                  <button onClick={() => setEditId(null)} className="text-xs text-muted-foreground">✕</button>
                </span>
              ) : (
                <button onClick={() => { setEditId(p.id); setEditQty(String(p.quantityOnHand)) }}
                  className={`text-sm font-mono font-semibold hover:underline ${p.quantityOnHand <= p.lowStockThreshold ? 'text-amber-600' : 'text-foreground'}`}>
                  {p.quantityOnHand}
                </button>
              )}
            </span>
            <span className="px-3 text-right text-sm text-muted-foreground">{p.lowStockThreshold}</span>
            <button onClick={() => handleDelete(p.id)} className="pl-3 text-xs text-muted-foreground hover:text-destructive transition-colors">Remove</button>
          </div>
        ))}
      </div>

      {/* Add part form */}
      <Section title="Add Part">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Part Name *</Label>
              <Input value={form.name} onChange={e => set('name')(e.target.value)} placeholder='e.g. Chromebook Screen 11.6"' />
            </div>
            <div className="space-y-1">
              <Label>Part # <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input value={form.partNumber} onChange={e => set('partNumber')(e.target.value)} placeholder="SKU or part number" />
            </div>
            <div className="space-y-1">
              <Label>Compatible Manufacturer</Label>
              <Select value={form.compatManufacturer} onValueChange={v => { set('compatManufacturer')(v); set('compatModel')('') }}>
                <SelectTrigger><SelectValue placeholder="Universal (all)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Universal (all)</SelectItem>
                  {mfrList.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Compatible Model</Label>
              <Select value={form.compatModel} onValueChange={set('compatModel')} disabled={!form.compatManufacturer || modelList.length === 0}>
                <SelectTrigger><SelectValue placeholder={form.compatManufacturer ? 'All models' : '—'} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All models</SelectItem>
                  {modelList.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Qty on Hand</Label>
              <Input type="number" value={form.quantityOnHand} onChange={e => set('quantityOnHand')(e.target.value)} min="0" />
            </div>
            <div className="space-y-1">
              <Label>Low Stock Alert @</Label>
              <Input type="number" value={form.lowStockThreshold} onChange={e => set('lowStockThreshold')(e.target.value)} min="0" />
            </div>
          </div>
          <button
            onClick={handleAdd}
            disabled={!form.name.trim()}
            className="px-4 py-2 text-sm font-semibold text-white rounded-md disabled:opacity-50 hover:opacity-90 transition-opacity"
            style={{ backgroundColor: 'var(--navy)' }}
          >
            Add Part
          </button>
        </div>
      </Section>
    </div>
  )
}

/* ── Shared components ────────────────────────────────────── */
function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3 max-w-lg">
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  )
}

function LookupEditor({ category, parentValue, label, onListChange }: {
  category: string; parentValue: string; label?: string; onListChange?: (v: any[]) => void
}) {
  const [values, setValues] = useState<{ id: string; value: string }[]>([])
  const [newVal, setNewVal] = useState('')
  const [loading, setLoading] = useState(false)

  const load = useCallback(() => {
    fetch(`/api/lookup?category=${category}&parent=${encodeURIComponent(parentValue)}`)
      .then(r => r.json())
      .then(d => { setValues(d.values ?? []); onListChange?.(d.values ?? []) })
  }, [category, parentValue, onListChange])

  useEffect(() => { load() }, [load])

  async function handleAdd() {
    const trimmed = newVal.trim()
    if (!trimmed) return
    setLoading(true)
    await fetch('/api/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, value: trimmed, parentValue }),
    })
    setNewVal('')
    load()
    setLoading(false)
  }

  async function handleDelete(id: string) {
    await fetch('/api/lookup', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    load()
  }

  return (
    <div className="space-y-3">
      <div className="bg-card border rounded-md divide-y">
        {values.length === 0 && <p className="px-4 py-5 text-sm text-muted-foreground text-center font-mono">NO ENTRIES YET</p>}
        {values.map(v => (
          <div key={v.id} className="flex items-center justify-between px-4 py-2.5">
            <span className="text-sm">{v.value}</span>
            <button onClick={() => handleDelete(v.id)} className="text-xs text-muted-foreground hover:text-destructive transition-colors px-2 py-1 rounded">Remove</button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={newVal}
          onChange={e => setNewVal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder={`Add ${label ?? category}…`}
          className="flex-1"
        />
        <button
          onClick={handleAdd}
          disabled={loading || !newVal.trim()}
          className="px-4 py-2 text-sm font-semibold text-white rounded-md disabled:opacity-50 hover:opacity-90 transition-opacity"
          style={{ backgroundColor: 'var(--navy)' }}
        >
          Add
        </button>
      </div>
    </div>
  )
}
