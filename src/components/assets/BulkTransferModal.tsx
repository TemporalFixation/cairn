'use client'
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { BuildingRoomSelect } from '@/components/shared/BuildingRoomSelect'
import { PersonSearch } from '@/components/shared/PersonSearch'
import type { PersonSnapshot } from '@/types'

type Props = { assetIds: string[]; open: boolean; onClose: () => void; onDone: () => void }

export function BulkTransferModal({ assetIds, open, onClose, onDone }: Props) {
  const [mode, setMode] = useState<'room' | 'person'>('room')
  const [building, setBuilding] = useState('')
  const [roomId, setRoomId] = useState('')
  const [person, setPerson] = useState<PersonSnapshot | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleConfirm() {
    setLoading(true)
    await fetch('/api/assets/bulk-transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assetIds, ...(mode === 'room' ? { roomId } : { person }) }),
    })
    setLoading(false)
    onDone()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="space-y-4">
        <DialogHeader>
          <DialogTitle>Bulk Transfer ({assetIds.length} assets)</DialogTitle>
        </DialogHeader>
        <div className="flex gap-2">
          <Button variant={mode === 'room' ? 'default' : 'outline'} size="sm" onClick={() => setMode('room')}>Transfer to Room</Button>
          <Button variant={mode === 'person' ? 'default' : 'outline'} size="sm" onClick={() => setMode('person')}>Assign to Person</Button>
        </div>
        {mode === 'room' ? (
          <BuildingRoomSelect buildingValue={building} roomValue={roomId} onBuildingChange={setBuilding} onRoomChange={setRoomId} />
        ) : (
          <PersonSearch value={person} onSelect={setPerson} />
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={loading}>
            {loading ? 'Transferring...' : 'Confirm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
