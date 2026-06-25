'use client'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import type { Room } from '@/types'

type Props = { rooms: Room[]; onDelete: (id: string) => void }

export function RoomTable({ rooms, onDelete }: Props) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Building</TableHead>
          <TableHead>Room Name</TableHead>
          <TableHead>Responsible Person</TableHead>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rooms.map(r => (
          <TableRow key={r.id}>
            <TableCell>{r.building}</TableCell>
            <TableCell>{r.name}</TableCell>
            <TableCell>{(r.responsiblePerson as any)?.name ?? '—'}</TableCell>
            <TableCell>
              <Button variant="destructive" size="sm" onClick={() => onDelete(r.id)}>Delete</Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
