'use client'
import { useEffect, useState } from 'react'
import { RoomTable } from '@/components/rooms/RoomTable'
import { RoomCsvImport } from '@/components/rooms/RoomCsvImport'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BuildingRoomSelect } from '@/components/shared/BuildingRoomSelect'
import type { Room } from '@/types'

export default function RoomsAdminPage() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [newName, setNewName] = useState('')
  const [newBuilding, setNewBuilding] = useState('')

  async function load() {
    const res = await fetch('/api/rooms')
    const data = await res.json()
    setRooms(data.rooms)
  }

  useEffect(() => { load() }, [])

  async function handleAdd() {
    if (!newName || !newBuilding) return
    await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName, building: newBuilding }),
    })
    setNewName('')
    setNewBuilding('')
    load()
  }

  async function handleDelete(id: string) {
    await fetch(`/api/rooms/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Rooms Management</h1>
      <div className="flex gap-3 items-end">
        <div className="w-32">
          <BuildingRoomSelect
            buildingValue={newBuilding}
            roomValue=""
            onBuildingChange={setNewBuilding}
            onRoomChange={() => {}}
          />
        </div>
        <Input placeholder="Room name" value={newName} onChange={e => setNewName(e.target.value)} className="w-48" />
        <Button onClick={handleAdd}>Add Room</Button>
      </div>
      <RoomCsvImport onImported={load} />
      <RoomTable rooms={rooms} onDelete={handleDelete} />
    </div>
  )
}
