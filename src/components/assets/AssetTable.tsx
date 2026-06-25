'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BulkTransferModal } from './BulkTransferModal'
import type { AssetWithRelations } from '@/types'

const conditionColor: Record<string, string> = {
  New: 'bg-blue-100 text-blue-800',
  Good: 'bg-green-100 text-green-800',
  Fair: 'bg-yellow-100 text-yellow-800',
  Poor: 'bg-red-100 text-red-800',
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
    next.has(id) ? next.delete(id) : next.add(id)
    setSelected(next)
  }

  return (
    <>
      {selected.size > 0 && (
        <div className="flex items-center gap-3 mb-3 p-2 bg-slate-50 rounded">
          <span className="text-sm">{selected.size} selected</span>
          <Button size="sm" onClick={() => setShowTransfer(true)}>Bulk Transfer</Button>
          <Button size="sm" variant="outline" onClick={() => setSelected(new Set())}>Clear</Button>
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8">
              <Checkbox
                checked={selected.size === assets.length && assets.length > 0}
                onCheckedChange={toggleAll}
              />
            </TableHead>
            <TableHead>Asset Tag</TableHead>
            <TableHead>Serial Number</TableHead>
            <TableHead>Model</TableHead>
            <TableHead>Building</TableHead>
            <TableHead>Assigned To</TableHead>
            <TableHead>Condition</TableHead>
            <TableHead>Open Tickets</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assets.map(a => (
            <TableRow key={a.id}>
              <TableCell>
                <Checkbox
                  checked={selected.has(a.id)}
                  onCheckedChange={() => toggle(a.id)}
                />
              </TableCell>
              <TableCell>
                <Link href={`/assets/${a.id}`} className="text-blue-600 hover:underline">
                  {a.assetTag}
                </Link>
              </TableCell>
              <TableCell className="font-mono text-sm">{a.serialNumber}</TableCell>
              <TableCell>{a.manufacturer} {a.model}</TableCell>
              <TableCell>{a.building}{a.room ? ` / ${a.room.name}` : ''}</TableCell>
              <TableCell>{(a.assignedToPerson as any)?.name ?? '—'}</TableCell>
              <TableCell>
                <Badge className={conditionColor[a.condition]}>{a.condition}</Badge>
              </TableCell>
              <TableCell>
                {a.repairTickets.filter(t => t.status !== 'Closed' && t.status !== 'Resolved').length || '—'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <BulkTransferModal
        assetIds={[...selected]}
        open={showTransfer}
        onClose={() => setShowTransfer(false)}
        onDone={() => { setSelected(new Set()); onRefresh() }}
      />
    </>
  )
}
