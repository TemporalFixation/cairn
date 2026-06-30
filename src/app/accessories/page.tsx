'use client'
import { useEffect, useState, useRef } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Modal } from '@/components/shared/Modal'

const BUILDINGS = ['LPQ', 'MHS', 'BG', 'CC']
const ACCESSORY_TYPES = ['Chromebook Charger', 'Laptop Charger']

type Row = {
  id: string
  building: string
  accessoryType: string
  initialCount: number
  reconciledCount: number | null
}

export default function AccessoriesPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState({ building: '', accessoryType: '', quantity: '' })
  const [addError, setAddError] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    const res = await fetch('/api/accessories')
    const data = await res.json()
    setRows(data.rows ?? [])
  }

  useEffect(() => { load() }, [])

  async function handleAdd() {
    if (!addForm.building || !addForm.accessoryType || !addForm.quantity) {
      setAddError('All fields are required.')
      return
    }
    setSaving(true)
    const res = await fetch('/api/accessories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(addForm),
    })
    setSaving(false)
    if (res.ok) {
      setShowAdd(false)
      setAddForm({ building: '', accessoryType: '', quantity: '' })
      setAddError('')
      load()
    } else {
      const err = await res.json().catch(() => ({}))
      setAddError(err.error ?? 'Failed to add accessories')
    }
  }

  async function patchRow(id: string, field: 'initialCount' | 'reconciledCount', value: string) {
    await fetch(`/api/accessories/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    })
    load()
  }

  // Group by building
  const byBuilding: Record<string, Row[]> = {}
  BUILDINGS.forEach(b => { byBuilding[b] = [] })
  rows.forEach(r => { if (byBuilding[r.building]) byBuilding[r.building].push(r) })

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-mono tracking-widest text-muted-foreground uppercase mb-1">Inventory</p>
          <h1 className="text-2xl font-semibold">Accessories</h1>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center px-3 py-2 text-sm font-semibold text-white rounded-md hover:opacity-90 transition-opacity"
          style={{ backgroundColor: 'var(--navy)' }}
        >
          + Add Accessories
        </button>
      </div>

      <div className="space-y-6">
        {BUILDINGS.map(building => {
          const buildingRows = byBuilding[building]
          return (
            <div key={building}>
              <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-2 pb-1 border-b">{building}</h2>
              {buildingRows.length === 0 ? (
                <p className="text-sm text-muted-foreground py-3 font-mono">No accessories recorded — use + Add Accessories to start.</p>
              ) : (
                <div className="rounded-md border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-secondary/60 border-b">
                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Accessory</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Initial Count</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Reconciled Count</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Difference</th>
                      </tr>
                    </thead>
                    <tbody>
                      {buildingRows.map((row, i) => {
                        const diff = row.reconciledCount !== null ? row.initialCount - row.reconciledCount : null
                        return (
                          <tr key={row.id} className={i % 2 === 0 ? 'bg-secondary/20' : ''}>
                            <td className="px-4 py-2">{row.accessoryType}</td>
                            <td className="px-4 py-2 text-right">
                              <InlineEdit
                                value={String(row.initialCount)}
                                onSave={v => patchRow(row.id, 'initialCount', v)}
                              />
                            </td>
                            <td className="px-4 py-2 text-right">
                              <InlineEdit
                                value={row.reconciledCount !== null ? String(row.reconciledCount) : ''}
                                placeholder="—"
                                onSave={v => patchRow(row.id, 'reconciledCount', v)}
                              />
                            </td>
                            <td className="px-4 py-2 text-right font-mono font-semibold">
                              {diff === null ? <span className="text-muted-foreground">—</span> : (
                                <span style={{ color: diff > 0 ? 'var(--district-red, #c0392b)' : diff < 0 ? '#0F7D5A' : undefined }}>
                                  {diff > 0 ? `-${diff}` : diff < 0 ? `+${Math.abs(diff)}` : '0'}
                                </span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <Modal open={showAdd} onClose={() => { setShowAdd(false); setAddError('') }} title="Add Accessories">
        <div className="space-y-4 pt-1">
          <div className="space-y-1">
            <Label>Building</Label>
            <Select value={addForm.building} onValueChange={v => setAddForm(f => ({ ...f, building: v }))}>
              <SelectTrigger><SelectValue placeholder="Select building" /></SelectTrigger>
              <SelectContent>
                {BUILDINGS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Accessory Type</Label>
            <Select value={addForm.accessoryType} onValueChange={v => setAddForm(f => ({ ...f, accessoryType: v }))}>
              <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                {ACCESSORY_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Quantity</Label>
            <Input
              type="number"
              min="1"
              value={addForm.quantity}
              onChange={e => setAddForm(f => ({ ...f, quantity: e.target.value }))}
              placeholder="e.g. 25"
            />
          </div>
          {addError && <p className="text-sm text-red-600">{addError}</p>}
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleAdd}
              disabled={saving}
              className="px-4 py-2 text-sm font-semibold text-white rounded-md disabled:opacity-50 hover:opacity-90 transition-opacity"
              style={{ backgroundColor: 'var(--navy)' }}
            >
              {saving ? 'Adding…' : 'Add'}
            </button>
            <button
              onClick={() => { setShowAdd(false); setAddError('') }}
              className="px-4 py-2 text-sm border rounded-md hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function InlineEdit({ value, placeholder = '—', onSave }: { value: string; placeholder?: string; onSave: (v: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (editing) inputRef.current?.focus() }, [editing])
  useEffect(() => { setDraft(value) }, [value])

  function commit() {
    setEditing(false)
    if (draft !== value) onSave(draft)
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="number"
        min="0"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(value); setEditing(false) } }}
        className="w-20 text-right font-mono text-sm border rounded px-2 py-0.5 bg-background"
      />
    )
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="font-mono text-sm hover:underline hover:text-foreground text-foreground/80 tabular-nums"
      title="Click to edit"
    >
      {value || <span className="text-muted-foreground">{placeholder}</span>}
    </button>
  )
}
