'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const SAMPLE_CSV = [
  'building,room_name,responsible_person_name,responsible_person_email',
  'LPQ,Room 101,Jane Smith,jsmith@district.edu',
  'MHS,Library,Bob Johnson,bjohnson@district.edu',
  'BG,Computer Lab,,',
].join('\n')

function downloadSample() {
  const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'cairn-rooms-sample.csv'
  a.click()
}

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
    <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm font-semibold">CSV Import</p>
        <button onClick={downloadSample}
          className="text-xs px-3 py-1.5 rounded-md border border-border hover:bg-accent transition-colors font-medium">
          ↓ Download Sample CSV
        </button>
      </div>
      <div className="text-xs text-muted-foreground space-y-1">
        <p><span className="font-semibold text-foreground">Required:</span> <span className="font-mono">building, room_name</span></p>
        <p><span className="font-semibold text-foreground">Optional:</span> <span className="font-mono">responsible_person_name, responsible_person_email</span></p>
        <p>Valid buildings: <span className="font-mono">LPQ, MHS, BG, CC</span></p>
      </div>
      <div className="flex gap-2">
        <Input type="file" accept=".csv" onChange={e => setFile(e.target.files?.[0] ?? null)} />
        <Button onClick={handleImport} disabled={!file}>Import</Button>
      </div>
      {result && (
        <div className="text-sm space-y-1">
          <p className="text-green-600 dark:text-green-400 font-medium">{result.created} rooms created</p>
          {result.errors.map((e, i) => <p key={i} className="text-destructive text-xs">{e}</p>)}
        </div>
      )}
    </div>
  )
}
