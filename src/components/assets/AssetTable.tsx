'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { BulkTransferModal } from './BulkTransferModal'
import type { AssetWithRelations } from '@/types'

const conditionStrip: Record<string, string> = {
  New:  'border-l-4 border-l-[#1B3358]',
  Good: 'border-l-4 border-l-[#0F7D5A]',
  Fair: 'border-l-4 border-l-[#D97706]',
  Poor: 'border-l-4 border-l-red-600',
}

const conditionBadge: Record<string, string> = {
  New:  'bg-blue-50 text-blue-800 ring-1 ring-blue-200',
  Good: 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200',
  Fair: 'bg-amber-50 text-amber-800 ring-1 ring-amber-200',
  Poor: 'bg-red-50 text-red-800 ring-1 ring-red-200',
}

type Props = { assets: AssetWithRelations[]; onRefresh: () => void }

export function AssetTable({ assets, onRefresh }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [showTransfer, setShowTransfer] = useState(false)

  function toggleAll() {
    setSelected(selected.size === assets.length ? new Set() : new Set(assets.map(a => a.id)))
  }

  function toggle(id: string) {
    const next = new Set(selected)
    if (next.has(id)) { next.delete(id) } else { next.add(id) }
    setSelected(next)
  }

  return (
    <>
      {selected.size > 0 && (
        <div className="flex items-center gap-3 mb-3 px-3 py-2 bg-primary/5 border border-primary/20 rounded-md">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <button
            onClick={() => setShowTransfer(true)}
            className="px-3 py-1 text-xs font-semibold text-white rounded"
            style={{ backgroundColor: 'var(--navy)' }}
          >
            Bulk Transfer
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="px-3 py-1 text-xs font-medium border rounded hover:bg-secondary transition-colors"
          >
            Clear
          </button>
        </div>
      )}

      {assets.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          <p className="font-mono tracking-wide mb-1">NO ASSETS FOUND</p>
          <p>Try adjusting your filters or add a new asset.</p>
        </div>
      ) : (
        <div className="bg-card rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/60 hover:bg-secondary/60">
                <TableHead className="w-10 pl-4">
                  <Checkbox
                    checked={selected.size === assets.length && assets.length > 0}
                    onCheckedChange={toggleAll}
                  />
                </TableHead>
                <TableHead className="font-semibold text-xs tracking-wide uppercase text-muted-foreground">Asset Tag</TableHead>
                <TableHead className="font-semibold text-xs tracking-wide uppercase text-muted-foreground">Serial #</TableHead>
                <TableHead className="font-semibold text-xs tracking-wide uppercase text-muted-foreground">Device</TableHead>
                <TableHead className="font-semibold text-xs tracking-wide uppercase text-muted-foreground">Location</TableHead>
                <TableHead className="font-semibold text-xs tracking-wide uppercase text-muted-foreground">Assigned To</TableHead>
                <TableHead className="font-semibold text-xs tracking-wide uppercase text-muted-foreground">Condition</TableHead>
                <TableHead className="font-semibold text-xs tracking-wide uppercase text-muted-foreground">Tickets</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.map(a => {
                const openTickets = a.repairTickets.filter(t => t.status !== 'Closed' && t.status !== 'Resolved').length
                return (
                  <TableRow
                    key={a.id}
                    className={`${conditionStrip[a.condition] ?? ''} hover:bg-secondary/30 transition-colors`}
                  >
                    <TableCell className="pl-4">
                      <Checkbox checked={selected.has(a.id)} onCheckedChange={() => toggle(a.id)} />
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/assets/${a.id}`}
                        className="font-semibold text-primary hover:underline"
                        style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}
                      >
                        {a.assetTag}
                      </Link>
                    </TableCell>
                    <TableCell
                      className="text-muted-foreground"
                      style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}
                    >
                      {a.serialNumber}
                    </TableCell>
                    <TableCell className="text-sm">{a.manufacturer} {a.model}</TableCell>
                    <TableCell className="text-sm">
                      <span className="font-medium">{a.building}</span>
                      {a.room && <span className="text-muted-foreground"> · {a.room.name}</span>}
                    </TableCell>
                    <TableCell className="text-sm">{(a.assignedToPerson as any)?.name ?? <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${conditionBadge[a.condition] ?? ''}`}>
                        {a.condition}
                      </span>
                    </TableCell>
                    <TableCell>
                      {openTickets > 0
                        ? <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 ring-1 ring-amber-200">{openTickets} open</span>
                        : <span className="text-muted-foreground text-sm">—</span>}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <BulkTransferModal
        assetIds={Array.from(selected)}
        open={showTransfer}
        onClose={() => setShowTransfer(false)}
        onDone={() => { setSelected(new Set()); onRefresh() }}
      />
    </>
  )
}
