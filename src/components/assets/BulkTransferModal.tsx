'use client'
import { useState } from 'react'
import { Modal } from '@/components/shared/Modal'
import { Label } from '@/components/ui/label'
import { BuildingRoomSelect } from '@/components/shared/BuildingRoomSelect'
import { PersonSearch } from '@/components/shared/PersonSearch'
import type { PersonSnapshot } from '@/types'

const BUILDINGS = ['LPQ', 'MHS', 'BG', 'CC']

type Mode = 'building' | 'room' | 'person'
type Props = { assetIds: string[]; open: boolean; onClose: () => void; onDone: () => void }

export function BulkTransferModal({ assetIds, open, onClose, onDone }: Props) {
  const [mode, setMode] = useState<Mode>('building')
  const [building, setBuilding] = useState('')
  const [roomBuilding, setRoomBuilding] = useState('')
  const [roomId, setRoomId] = useState('')
  const [person, setPerson] = useState<PersonSnapshot | null>(null)
  const [loading, setLoading] = useState(false)

  const canConfirm = (mode === 'building' && !!building)
    || (mode === 'room' && !!roomId)
    || (mode === 'person' && !!person)

  async function handleConfirm() {
    if (!canConfirm) return
    setLoading(true)
    const body =
      mode === 'building' ? { assetIds, building } :
      mode === 'room'     ? { assetIds, roomId, building: roomBuilding } :
                            { assetIds, person }
    await fetch('/api/assets/bulk-transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setLoading(false)
    onDone()
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={`Move ${assetIds.length} Asset${assetIds.length !== 1 ? 's' : ''}`} width="max-w-lg">
      <div className="space-y-5">
        {/* Mode selector */}
        <div className="flex gap-2">
          {(['building', 'room', 'person'] as Mode[]).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors ${
                mode === m
                  ? 'text-white border-transparent'
                  : 'border-border text-muted-foreground hover:text-foreground'
              }`}
              style={mode === m ? { backgroundColor: 'var(--navy)' } : undefined}
            >
              {m === 'building' ? 'To Building' : m === 'room' ? 'To Room' : 'Assign Person'}
            </button>
          ))}
        </div>

        {mode === 'building' && (
          <div className="space-y-1">
            <Label>Destination Building</Label>
            <select
              value={building}
              onChange={e => setBuilding(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Select building…</option>
              {BUILDINGS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
        )}

        {mode === 'room' && (
          <BuildingRoomSelect
            buildingValue={roomBuilding}
            roomValue={roomId}
            onBuildingChange={b => { setRoomBuilding(b); setRoomId('') }}
            onRoomChange={setRoomId}
          />
        )}

        {mode === 'person' && (
          <PersonSearch value={person} onSelect={setPerson} />
        )}

        <div className="flex gap-3 pt-1">
          <button
            onClick={handleConfirm}
            disabled={loading || !canConfirm}
            className="px-4 py-2 text-sm font-semibold text-white rounded-md disabled:opacity-50 hover:opacity-90 transition-opacity"
            style={{ backgroundColor: 'var(--navy)' }}
          >
            {loading ? 'Moving…' : 'Confirm Move'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium border rounded-md bg-card hover:bg-secondary transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  )
}
