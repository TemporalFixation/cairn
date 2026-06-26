'use client'
import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const REPORT_TYPES = [
  { key: 'assets-by-model',      label: 'All Assets — By Model',       icon: '🖥' },
  { key: 'assets-by-person',     label: 'Assets Assigned to a Person', icon: '👤' },
  { key: 'checked-out',          label: 'Devices Not Checked In',      icon: '🔓' },
  { key: 'assets-by-year',       label: 'Assets by Year Purchased',    icon: '📅' },
  { key: 'most-repaired',        label: 'Most Repaired Assets',        icon: '🔧' },
  { key: 'assets-by-building',   label: 'Building Inventory',          icon: '🏫' },
  { key: 'parts-inventory',      label: 'Parts Inventory',             icon: '📦' },
  { key: 'ticket-summary',       label: 'Ticket Summary',              icon: '🎫' },
  { key: 'reconcile',            label: 'Reconciliation — Unseen Devices', icon: '🔍' },
]

export default function ReportsPage() {
  const [reportType, setReportType] = useState('')
  const [params, setParams] = useState<Record<string, string>>({})
  const [meta, setMeta] = useState<{ manufacturers: string[]; models: string[]; buildings: string[] }>({ manufacturers: [], models: [], buildings: [] })
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const reportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/lookup?category=manufacturer&parent=').then(r => r.json()),
      fetch('/api/reports?type=meta').then(r => r.json()),
    ]).then(([lookups, reportMeta]) => {
      setMeta({
        manufacturers: lookups.values?.map((v: any) => v.value) ?? [],
        models: reportMeta.models ?? [],
        buildings: reportMeta.buildings ?? [],
      })
    })
  }, [])

  function setParam(k: string, v: string) { setParams(p => ({ ...p, [k]: v })) }

  async function run() {
    setLoading(true)
    setData(null)
    const qs = new URLSearchParams({ type: reportType, ...params }).toString()
    const res = await fetch(`/api/reports?${qs}`)
    const json = await res.json()
    setData(json)
    setLoading(false)
  }

  function handlePrint() {
    window.print()
  }

  const selected = REPORT_TYPES.find(r => r.key === reportType)

  return (
    <div>
      {/* Controls — hidden on print */}
      <div className="no-print space-y-6">
        <div>
          <p className="text-xs font-mono tracking-widest uppercase mb-1" style={{ color: 'var(--district-red)' }}>Reports</p>
          <h1 className="text-2xl font-semibold">Generate Report</h1>
          <p className="text-sm text-muted-foreground mt-1">Select a report type, set parameters, then run or print as PDF.</p>
        </div>

        {/* Report type cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {REPORT_TYPES.map(rt => (
            <button
              key={rt.key}
              onClick={() => { setReportType(rt.key); setData(null); setParams({}) }}
              className={`text-left p-4 rounded-lg border-2 transition-all ${
                reportType === rt.key
                  ? 'border-[var(--district-red)] bg-red-50 dark:bg-red-950/30'
                  : 'border-border bg-card hover:border-muted-foreground/40'
              }`}
            >
              <div className="text-2xl mb-1">{rt.icon}</div>
              <div className="text-sm font-medium leading-tight">{rt.label}</div>
            </button>
          ))}
        </div>

        {/* Parameters */}
        {reportType && (
          <div className="bg-card border rounded-lg p-5 space-y-4 max-w-lg">
            <h2 className="text-sm font-semibold">Parameters</h2>
            <ReportParams type={reportType} params={params} meta={meta} onChange={setParam} />
            <button
              onClick={run}
              disabled={loading}
              className="px-5 py-2 text-sm font-semibold text-white rounded-md disabled:opacity-50 hover:opacity-90 transition-opacity"
              style={{ backgroundColor: 'var(--district-red)' }}
            >
              {loading ? 'Running…' : 'Run Report'}
            </button>
          </div>
        )}
      </div>

      {/* Report output */}
      {data && (
        <div ref={reportRef} className="mt-8">
          {/* Header — shown on screen and in print */}
          <div className="flex items-start justify-between mb-6 no-print">
            <div>
              <h2 className="text-lg font-semibold">{selected?.label}</h2>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">
                Generated {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-md hover:opacity-90 transition-opacity"
              style={{ backgroundColor: 'var(--district-gold)' }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 4V1h8v3M3 10H1V5h12v5h-2M3 7h8M5 10v3h4v-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Print / Save PDF
            </button>
          </div>

          {/* Print-only header */}
          <div className="print-only hidden mb-8">
            <PrintHeader title={selected?.label ?? ''} params={params} />
          </div>

          <ReportOutput type={reportType} data={data} params={params} />
        </div>
      )}
    </div>
  )
}

/* ── Parameter controls per report type ─────────────────── */
function ReportParams({ type, params, meta, onChange }: { type: string; params: Record<string, string>; meta: any; onChange: (k: string, v: string) => void }) {
  if (type === 'assets-by-model') return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1">
        <Label>Manufacturer</Label>
        <Select
          value={params.manufacturer || '__all__'}
          onValueChange={v => onChange('manufacturer', v === '__all__' ? '' : v)}
        >
          <SelectTrigger><SelectValue placeholder="All manufacturers" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All manufacturers</SelectItem>
            {meta.manufacturers.map((m: string) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label>Model <span className="text-muted-foreground font-normal">(optional)</span></Label>
        <Input value={params.model ?? ''} onChange={e => onChange('model', e.target.value)} placeholder="e.g. Chromebook 314" />
      </div>
    </div>
  )

  if (type === 'assets-by-person') return (
    <div className="space-y-1">
      <Label>Person name <span className="text-muted-foreground font-normal">(partial match)</span></Label>
      <Input value={params.name ?? ''} onChange={e => onChange('name', e.target.value)} placeholder="e.g. Smith" />
    </div>
  )

  if (type === 'checked-out') return (
    <p className="text-sm text-muted-foreground">No parameters needed — shows all devices currently assigned to someone.</p>
  )

  if (type === 'assets-by-year') return (
    <div className="space-y-1">
      <Label>Year <span className="text-muted-foreground font-normal">(optional — leave blank for all years)</span></Label>
      <Input type="number" value={params.year ?? ''} onChange={e => onChange('year', e.target.value)} placeholder="e.g. 2023" min="2000" max="2099" />
    </div>
  )

  if (type === 'most-repaired') return (
    <div className="space-y-1">
      <Label>Since date <span className="text-muted-foreground font-normal">(optional — leave blank for all time)</span></Label>
      <Input type="date" value={params.since ?? ''} onChange={e => onChange('since', e.target.value)} />
    </div>
  )

  if (type === 'assets-by-building') return (
    <div className="space-y-1">
      <Label>Building</Label>
      <Select
        value={params.building || '__all__'}
        onValueChange={v => onChange('building', v === '__all__' ? '' : v)}
      >
        <SelectTrigger><SelectValue placeholder="All buildings" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All buildings</SelectItem>
          {meta.buildings.length === 0 && <SelectItem value="__none__" disabled>No buildings found — add assets first</SelectItem>}
          {meta.buildings.map((b: string) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  )

  if (type === 'reconcile') return (
    <div className="space-y-1">
      <Label>Threshold</Label>
      <Select value={params.months || '6'} onValueChange={v => onChange('months', v)}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="3">3 months</SelectItem>
          <SelectItem value="6">6 months</SelectItem>
          <SelectItem value="9">9 months</SelectItem>
          <SelectItem value="12">12 months</SelectItem>
          <SelectItem value="18">18 months</SelectItem>
          <SelectItem value="24">24 months</SelectItem>
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground pt-1">Shows devices with no recorded activity (edits, check-in/out, or tickets) in the selected period.</p>
    </div>
  )

  if (type === 'ticket-summary') return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1">
        <Label>From</Label>
        <Input type="date" value={params.since ?? ''} onChange={e => onChange('since', e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label>To</Label>
        <Input type="date" value={params.until ?? ''} onChange={e => onChange('until', e.target.value)} />
      </div>
    </div>
  )

  return <p className="text-sm text-muted-foreground">No parameters needed — click Run Report.</p>
}

/* ── Report renderers ────────────────────────────────────── */
function ReportOutput({ type, data, params }: { type: string; data: any; params: Record<string, string> }) {
  if (type === 'assets-by-model') {
    const assets: any[] = data.assets ?? []
    if (!assets.length) return <Empty />
    // Group by model
    const groups: Record<string, any[]> = {}
    assets.forEach(a => { const k = `${a.manufacturer} ${a.model}`; (groups[k] = groups[k] ?? []).push(a) })
    return (
      <div className="space-y-6">
        {Object.entries(groups).map(([model, rows]) => (
          <ReportSection key={model} title={model} count={rows.length}>
            <AssetTable assets={rows} />
          </ReportSection>
        ))}
      </div>
    )
  }

  if (type === 'assets-by-person') {
    const assets: any[] = data.assets ?? []
    if (!assets.length) return <Empty message="No assets found for that name." />
    const groups: Record<string, any[]> = {}
    assets.forEach(a => {
      const person = (a.assignedToPerson as any)?.name ?? 'Unassigned'
      ;(groups[person] = groups[person] ?? []).push(a)
    })
    return (
      <div className="space-y-6">
        {Object.entries(groups).sort().map(([person, rows]) => (
          <ReportSection key={person} title={person} count={rows.length} subtitle="assigned device(s)">
            <AssetTable assets={rows} showPerson={false} />
          </ReportSection>
        ))}
      </div>
    )
  }

  if (type === 'checked-out') {
    const assets: any[] = data.assets ?? []
    if (!assets.length) return <Empty message="No devices currently checked out." />
    const groups: Record<string, any[]> = {}
    assets.forEach(a => {
      const person = (a.assignedToPerson as any)?.name ?? 'Unknown'
      ;(groups[person] = groups[person] ?? []).push(a)
    })
    const sortedNames = Object.keys(groups).sort()
    return (
      <div className="space-y-2">
        <div className="flex gap-4 mb-4 text-sm">
          <span className="font-mono font-semibold">{assets.length} device{assets.length !== 1 ? 's' : ''} checked out</span>
          <span className="text-muted-foreground">across {sortedNames.length} people</span>
        </div>
        <div className="space-y-5">
          {sortedNames.map(person => (
            <ReportSection key={person} title={person} count={groups[person].length} subtitle="device(s)">
              <AssetTable assets={groups[person]} showPerson={false} />
            </ReportSection>
          ))}
        </div>
      </div>
    )
  }

  if (type === 'assets-by-year') {
    const assets: any[] = data.assets ?? []
    if (!assets.length) return <Empty message="No assets found with a purchase date." />
    const groups: Record<string, any[]> = {}
    assets.forEach(a => {
      const yr = a.purchaseDate ? new Date(a.purchaseDate).getFullYear().toString() : 'Unknown'
      ;(groups[yr] = groups[yr] ?? []).push(a)
    })
    const years = Object.keys(groups).sort((a, b) => b.localeCompare(a))
    return (
      <div className="space-y-6">
        {years.map(yr => {
          const rows = groups[yr]
          const total = rows.reduce((s: number, a: any) => s + (parseFloat(a.purchasePrice) || 0), 0)
          return (
            <ReportSection key={yr} title={yr === 'Unknown' ? 'No Purchase Date' : `Purchased in ${yr}`} count={rows.length}>
              {total > 0 && (
                <div className="px-4 py-2 text-xs text-muted-foreground border-b bg-secondary/30 flex gap-4">
                  <span>Total spend: <span className="font-mono font-semibold text-foreground">${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></span>
                  <span>Avg: <span className="font-mono">${(total / rows.length).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></span>
                </div>
              )}
              <AssetTable assets={rows} showPerson />
            </ReportSection>
          )
        })}
      </div>
    )
  }

  if (type === 'most-repaired') {
    const rows: any[] = data.rows ?? []
    if (!rows.length) return <Empty message="No repair tickets found for this period." />
    return (
      <ReportSection title="Most Repaired Assets" count={rows.length}>
        <table className="report-table w-full">
          <thead>
            <tr>
              <Th>#</Th><Th>Asset Tag</Th><Th>Serial</Th><Th>Manufacturer</Th><Th>Model</Th><Th>Location</Th><Th align="right">Tickets</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.asset.id} className={i % 2 === 0 ? 'bg-secondary/30' : ''}>
                <Td>{i + 1}</Td>
                <Td mono>{r.asset.assetTag}</Td>
                <Td mono>{r.asset.serialNumber}</Td>
                <Td>{r.asset.manufacturer}</Td>
                <Td>{r.asset.model}</Td>
                <Td>{r.asset.building}{r.asset.room ? ` · ${r.asset.room.name}` : ''}</Td>
                <Td align="right">
                  <span className="font-semibold" style={{ color: r.ticketCount >= 5 ? 'var(--district-red)' : r.ticketCount >= 3 ? 'var(--district-gold)' : undefined }}>
                    {r.ticketCount}
                  </span>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </ReportSection>
    )
  }

  if (type === 'assets-by-building') {
    const assets: any[] = data.assets ?? []
    if (!assets.length) return <Empty />
    const groups: Record<string, Record<string, any[]>> = {}
    assets.forEach(a => {
      const b = a.building || 'No Building'
      const r = a.room?.name || 'No Room'
      if (!groups[b]) groups[b] = {}
      ;(groups[b][r] = groups[b][r] ?? []).push(a)
    })
    return (
      <div className="space-y-8">
        {Object.entries(groups).map(([building, rooms]) => (
          <div key={building} className="print-break-before">
            <h3 className="text-base font-semibold mb-3 pb-1 border-b-2" style={{ borderColor: 'var(--district-red)' }}>{building}</h3>
            <div className="space-y-4">
              {Object.entries(rooms).map(([room, rows]) => (
                <ReportSection key={room} title={room} count={rows.length} compact>
                  <AssetTable assets={rows} showLocation={false} />
                </ReportSection>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (type === 'parts-inventory') {
    const parts: any[] = data.parts ?? []
    if (!parts.length) return <Empty message="No parts in inventory." />
    const lowStock = parts.filter(p => p.quantityOnHand <= p.lowStockThreshold)
    return (
      <div className="space-y-6">
        {lowStock.length > 0 && (
          <div className="border rounded-md p-3" style={{ borderColor: 'var(--district-gold)', backgroundColor: 'rgba(205,154,59,0.08)' }}>
            <p className="text-sm font-semibold mb-1" style={{ color: 'var(--district-gold)' }}>Low Stock Alert — {lowStock.length} part(s) below threshold</p>
            <p className="text-xs text-muted-foreground">{lowStock.map(p => `${p.name} (${p.quantityOnHand})`).join(' · ')}</p>
          </div>
        )}
        <ReportSection title="Parts Inventory" count={parts.length}>
          <table className="report-table w-full">
            <thead>
              <tr><Th>Part Name</Th><Th>Part #</Th><Th>Compatibility</Th><Th align="right">On Hand</Th><Th align="right">Low @ </Th><Th align="right">Times Used</Th></tr>
            </thead>
            <tbody>
              {parts.map((p, i) => (
                <tr key={p.id} className={i % 2 === 0 ? 'bg-secondary/30' : ''}>
                  <Td>{p.name}</Td>
                  <Td mono>{p.partNumber ?? '—'}</Td>
                  <Td>{p.compatManufacturer ? `${p.compatManufacturer}${p.compatModel ? ` · ${p.compatModel}` : ''}` : 'Universal'}</Td>
                  <Td align="right">
                    <span className="font-mono font-semibold" style={{ color: p.quantityOnHand <= p.lowStockThreshold ? 'var(--district-red)' : undefined }}>
                      {p.quantityOnHand}
                    </span>
                  </Td>
                  <Td align="right">{p.lowStockThreshold}</Td>
                  <Td align="right">{p._count?.ticketParts ?? 0}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </ReportSection>
      </div>
    )
  }

  if (type === 'reconcile') {
    const assets: any[] = data.assets ?? []
    const months = data.months ?? 6
    if (!assets.length) return <Empty message={`All devices have been seen within the last ${months} months.`} />
    return (
      <div className="space-y-4">
        <div className="flex gap-6 text-sm border rounded-md p-3 bg-secondary/30">
          <span><span className="font-mono font-semibold text-foreground">{assets.length}</span> <span className="text-muted-foreground">device{assets.length !== 1 ? 's' : ''} not seen in {months}+ months</span></span>
          <span className="text-muted-foreground">Cutoff: {new Date(data.cutoff).toLocaleDateString()}</span>
        </div>
        <div className="rounded-md border overflow-hidden">
          <table className="report-table w-full">
            <thead>
              <tr>
                <Th>Asset Tag</Th><Th>Serial #</Th><Th>Manufacturer</Th><Th>Model</Th><Th>Condition</Th><Th>Location</Th><Th>Assigned To</Th><Th align="right">Last Seen</Th><Th align="right">Days Ago</Th>
              </tr>
            </thead>
            <tbody>
              {assets.map((a, i) => {
                const urgent = a.daysSince > 365
                return (
                  <tr key={a.id} className={i % 2 === 0 ? 'bg-secondary/30' : ''}>
                    <Td mono>{a.assetTag}</Td>
                    <Td mono>{a.serialNumber}</Td>
                    <Td>{a.manufacturer}</Td>
                    <Td>{a.model}</Td>
                    <Td><ConditionBadge condition={a.condition} /></Td>
                    <Td>{a.building}{a.room ? ` · ${a.room.name}` : ''}</Td>
                    <Td>{(a.assignedToPerson as any)?.name ?? '—'}</Td>
                    <Td align="right" mono>{new Date(a.lastSeen).toLocaleDateString()}</Td>
                    <Td align="right">
                      <span className="font-mono font-semibold text-sm" style={{ color: urgent ? 'var(--district-red)' : 'var(--district-gold)' }}>
                        {a.daysSince}
                      </span>
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  if (type === 'ticket-summary') {
    const tickets: any[] = data.tickets ?? []
    if (!tickets.length) return <Empty message="No tickets found for this period." />
    const byStatus: Record<string, number> = {}
    tickets.forEach(t => { byStatus[t.status] = (byStatus[t.status] ?? 0) + 1 })
    const statusLabel: Record<string, string> = { Open: 'Open', InProgress: 'In Progress', WaitingForParts: 'Waiting for Parts', Resolved: 'Resolved', Closed: 'Closed' }
    return (
      <div className="space-y-6">
        {/* Status summary cards */}
        <div className="grid grid-cols-5 gap-3 no-print">
          {Object.entries(byStatus).map(([status, count]) => (
            <div key={status} className="bg-card border rounded-lg p-3 text-center">
              <div className="text-2xl font-bold font-mono">{count}</div>
              <div className="text-xs text-muted-foreground mt-1">{statusLabel[status] ?? status}</div>
            </div>
          ))}
        </div>
        <ReportSection title={`Ticket Log (${tickets.length} tickets)`} count={tickets.length}>
          <table className="report-table w-full">
            <thead>
              <tr><Th>Date</Th><Th>Asset</Th><Th>Issue Type</Th><Th>Description</Th><Th>Assigned To</Th><Th>Status</Th></tr>
            </thead>
            <tbody>
              {tickets.map((t, i) => (
                <tr key={t.id} className={i % 2 === 0 ? 'bg-secondary/30' : ''}>
                  <Td mono>{new Date(t.createdAt).toLocaleDateString()}</Td>
                  <Td mono>{t.asset?.assetTag ?? '—'}</Td>
                  <Td>{t.issueType}</Td>
                  <Td>{t.issueDescription}</Td>
                  <Td>{t.assignedTo?.name ?? 'Unassigned'}</Td>
                  <Td><StatusBadge status={t.status} /></Td>
                </tr>
              ))}
            </tbody>
          </table>
        </ReportSection>
      </div>
    )
  }

  return null
}

/* ── Small shared components ─────────────────────────────── */
function ReportSection({ title, count, subtitle, compact, children }: {
  title: string; count?: number; subtitle?: string; compact?: boolean; children: React.ReactNode
}) {
  return (
    <div className={compact ? 'space-y-1' : 'space-y-3'}>
      <div className="flex items-baseline gap-3">
        <h3 className="font-semibold text-sm">{title}</h3>
        {count !== undefined && (
          <span className="text-xs font-mono text-muted-foreground">{count} {subtitle ?? 'asset(s)'}</span>
        )}
      </div>
      <div className="rounded-md border overflow-hidden">
        {children}
      </div>
    </div>
  )
}

function AssetTable({ assets, showPerson = true, showLocation = true }: { assets: any[]; showPerson?: boolean; showLocation?: boolean }) {
  return (
    <table className="report-table w-full">
      <thead>
        <tr>
          <Th>Asset Tag</Th>
          <Th>Serial #</Th>
          <Th>Condition</Th>
          {showLocation && <Th>Location</Th>}
          {showPerson && <Th>Assigned To</Th>}
          <Th>Funding</Th>
        </tr>
      </thead>
      <tbody>
        {assets.map((a, i) => (
          <tr key={a.id} className={i % 2 === 0 ? 'bg-secondary/30' : ''}>
            <Td mono>{a.assetTag}</Td>
            <Td mono>{a.serialNumber}</Td>
            <Td><ConditionBadge condition={a.condition} /></Td>
            {showLocation && <Td>{a.building}{a.room ? ` · ${a.room.name}` : ''}</Td>}
            {showPerson && <Td>{(a.assignedToPerson as any)?.name ?? '—'}</Td>}
            <Td>{a.fundingSource || '—'}</Td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function Th({ children, align }: { children?: React.ReactNode; align?: 'right' }) {
  return (
    <th className={`px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground bg-secondary/60 border-b whitespace-nowrap ${align === 'right' ? 'text-right' : ''}`}>
      {children}
    </th>
  )
}

function Td({ children, mono, align }: { children?: React.ReactNode; mono?: boolean; align?: 'right' }) {
  return (
    <td className={`px-3 py-2 text-sm border-b last:border-0 ${mono ? 'font-mono text-xs' : ''} ${align === 'right' ? 'text-right' : ''}`}>
      {children}
    </td>
  )
}

function ConditionBadge({ condition }: { condition: string }) {
  const colors: Record<string, string> = {
    New: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    Good: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    Fair: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    Poor: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  }
  return <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${colors[condition] ?? ''}`}>{condition}</span>
}

function StatusBadge({ status }: { status: string }) {
  const label: Record<string, string> = { Open: 'Open', InProgress: 'In Progress', WaitingForParts: 'Waiting', Resolved: 'Resolved', Closed: 'Closed' }
  const colors: Record<string, string> = {
    Open: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    InProgress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    WaitingForParts: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    Resolved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    Closed: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  }
  return <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${colors[status] ?? ''}`}>{label[status] ?? status}</span>
}

function Empty({ message = 'No data found.' }: { message?: string }) {
  return <p className="py-12 text-center text-sm text-muted-foreground font-mono">{message.toUpperCase()}</p>
}

function PrintHeader({ title, params }: { title: string; params: Record<string, string> }) {
  const paramStr = Object.entries(params).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(' · ')
  return (
    <div className="mb-6 pb-4 border-b-2" style={{ borderColor: 'var(--district-red)' }}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-mono tracking-widest uppercase mb-1" style={{ color: 'var(--district-red)' }}>K-12 IT Inventory</div>
          <h1 className="text-xl font-bold">{title}</h1>
          {paramStr && <p className="text-xs text-muted-foreground mt-0.5">{paramStr}</p>}
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <div>{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
          <div className="font-mono mt-0.5">{new Date().toLocaleTimeString()}</div>
        </div>
      </div>
    </div>
  )
}
