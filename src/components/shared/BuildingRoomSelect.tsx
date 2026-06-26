'use client'
import { useEffect, useState } from 'react'
import { Label } from '@/components/ui/label'
import type { Room } from '@/types'

const BUILDINGS = ['LPQ', 'MHS', 'BG', 'CC'] as const

type Props = {
  buildingValue: string
  roomValue: string
  onBuildingChange: (b: string) => void
  onRoomChange: (r: string) => void
}

export function BuildingRoomSelect({ buildingValue, roomValue, onBuildingChange, onRoomChange }: Props) {
  const [rooms, setRooms] = useState<Room[]>([])

  useEffect(() => {
    if (!buildingValue) { setRooms([]); return }
    fetch(`/api/rooms?building=${buildingValue}`)
      .then(r => r.json())
      .then(d => setRooms(d.rooms ?? []))
  }, [buildingValue])

  function handleBuildingChange(value: string) {
    onBuildingChange(value)
    onRoomChange('')
    if (!value) { setRooms([]); return }
    fetch(`/api/rooms?building=${value}`)
      .then(r => r.json())
      .then(d => setRooms(d.rooms ?? []))
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-1">
        <Label htmlFor="building">Building</Label>
        <select
          id="building"
          value={buildingValue}
          onChange={e => handleBuildingChange(e.target.value)}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">Select building</option>
          {BUILDINGS.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="room">Room</Label>
        <select
          id="room"
          value={roomValue}
          onChange={e => onRoomChange(e.target.value)}
          disabled={!buildingValue}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">— None —</option>
          {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
      </div>
    </div>
  )
}
