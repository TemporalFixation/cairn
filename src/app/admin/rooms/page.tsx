'use client'
import { useEffect, useState } from 'react'
import { RoomTable } from '@/components/rooms/RoomTable'
import { RoomCsvImport } from '@/components/rooms/RoomCsvImport'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Room } from '@/types'

const BUILDINGS = ['LPQ', 'MHS', 'BG', 'CC']

export default function RoomsAdminPage() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [newName, setNewName] = useState('')
  const [newBuilding, setNewBuilding] = useState('')
  const [newEmail, setNewEmail] = useState('')

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
      body: JSON.stringify({
        name: newName,
        building: newBuilding,
        responsiblePersonEmail: newEmail || null,
      }),
    })
    setNewName('')
    setNewBuilding('')
    setNewEmail('')
    load()
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-mono tracking-widest text-muted-foreground uppercase mb-1">Admin</p>
        <h1 className="text-2xl font-semibold">Rooms Management</h1>
      </div>

      {/* Add room form */}
      <div className="bg-card border rounded-md p-5 space-y-4 max-w-xl">
        <h2 className="text-sm font-semibold">Add Room</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="building">Building</Label>
            <select
              id="building"
              value={newBuilding}
              onChange={e => setNewBuilding(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Select building</option>
              {BUILDINGS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="roomName">Room name</Label>
            <Input
              id="roomName"
              placeholder="e.g. Room 204"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="respEmail">Responsible person email <span className="text-muted-foreground font-normal">(optional)</span></Label>
          <Input
            id="respEmail"
            type="email"
            placeholder="teacher@school.org"
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
        </div>
        <Button onClick={handleAdd} disabled={!newName || !newBuilding}>Add Room</Button>
      </div>

      <RoomCsvImport onImported={load} />
      <RoomTable rooms={rooms} onDelete={handleDelete} />
    </div>
  )

  async function handleDelete(id: string) {
    await fetch(`/api/rooms/${id}`, { method: 'DELETE' })
    load()
  }
}
