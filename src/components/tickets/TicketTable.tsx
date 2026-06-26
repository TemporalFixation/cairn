import Link from 'next/link'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import type { TicketWithRelations } from '@/types'

const STATUS_LABELS: Record<string, string> = {
  Open: 'Open',
  InProgress: 'In Progress',
  WaitingForParts: 'Waiting for Parts',
  Resolved: 'Resolved',
  Closed: 'Closed',
}

const statusColor: Record<string, string> = {
  Open: 'bg-red-100 text-red-800',
  InProgress: 'bg-yellow-100 text-yellow-800',
  WaitingForParts: 'bg-purple-100 text-purple-800',
  Resolved: 'bg-green-100 text-green-800',
  Closed: 'bg-slate-100 text-slate-600',
}

export function TicketTable({ tickets }: { tickets: TicketWithRelations[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Asset</TableHead>
          <TableHead>Issue Type</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Assigned To</TableHead>
          <TableHead>CS Number</TableHead>
          <TableHead>Created</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tickets.map(t => (
          <TableRow key={t.id}>
            <TableCell>
              <Link href={`/tickets/${t.id}`} className="text-blue-600 hover:underline">{t.asset.assetTag}</Link>
              <span className="ml-1 text-slate-500 text-xs">{t.asset.serialNumber}</span>
            </TableCell>
            <TableCell>{t.issueType}</TableCell>
            <TableCell>
              <Badge className={statusColor[t.status]}>{STATUS_LABELS[t.status] ?? t.status}</Badge>
            </TableCell>
            <TableCell>{(t.assignedTo as any)?.name ?? '—'}</TableCell>
            <TableCell>{t.csNumber ?? '—'}</TableCell>
            <TableCell>{new Date(t.createdAt).toLocaleDateString()}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
