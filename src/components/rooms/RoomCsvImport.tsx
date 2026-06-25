'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type Props = { onImported: () => void }

export function RoomCsvImport({ onImported }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<{ created: number; errors: string[] } | null>(null)

  async function handleImport() {
    if (!file) return
    const form = new FormData()
    form.append('file', file)
    const res = await fetch('/api/rooms/import', { method: 'POST', body: form })
    const data = await res.json()
    setResult(data)
    if (data.created > 0) onImported()
  }

  return (
    <div className="space-y-3 border rounded p-4">
      <p className="text-sm font-medium">CSV Import</p>
      <p className="text-xs text-slate-500">Columns: <code>building, room_name, responsible_person_email</code></p>
      <div className="flex gap-2">
        <Input type="file" accept=".csv" onChange={e => setFile(e.target.files?.[0] ?? null)} />
        <Button onClick={handleImport} disabled={!file}>Import</Button>
      </div>
      {result && (
        <div className="text-sm space-y-1">
          <p className="text-green-600">{result.created} rooms created</p>
          {result.errors.map((e, i) => <p key={i} className="text-red-500">{e}</p>)}
        </div>
      )}
    </div>
  )
}
