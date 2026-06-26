'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const SAMPLE_CSV = [
  'asset_tag,serial_number,manufacturer,model,building,condition,purchase_date,purchase_price,warranty_expiration,funding_source,notes',
  'LPQ-1001,SN123456,Apple,MacBook Air 13,LPQ,Good,2023-08-15,899.00,2026-08-15,E-Rate,',
  'MHS-2002,SN789012,Dell,Chromebook 3110,MHS,Fair,2022-05-01,299.00,,Title I,Screen crack repaired',
].join('\n')

function downloadSample() {
  const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'cairn-assets-sample.csv'
  a.click()
}

export function AssetCsvImport() {
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<{ created: number; updated: number; errors: string[] } | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleImport() {
    if (!file) return
    setLoading(true)
    const form = new FormData()
    form.append('file', file)
    const res = await fetch('/api/assets/import', { method: 'POST', body: form })
    setResult(await res.json())
    setLoading(false)
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm font-semibold">CSV Format</p>
          <button onClick={downloadSample}
            className="text-xs px-3 py-1.5 rounded-md border border-border hover:bg-accent transition-colors font-medium">
            ↓ Download Sample CSV
          </button>
        </div>
        <div className="space-y-1.5 text-xs text-muted-foreground">
          <p><span className="font-semibold text-foreground">Required:</span>{' '}
            <span className="font-mono">asset_tag, serial_number, manufacturer, model, building</span>
          </p>
          <p><span className="font-semibold text-foreground">Optional:</span>{' '}
            <span className="font-mono">condition, purchase_date, purchase_price, warranty_expiration, funding_source, notes</span>
          </p>
          <p>Valid buildings: <span className="font-mono">LPQ, MHS, BG, CC</span> · Valid conditions: <span className="font-mono">New, Good, Fair, Poor</span></p>
          <p>Existing assets matched by serial number are updated, not duplicated.</p>
        </div>
      </div>

      <div className="flex gap-2">
        <Input type="file" accept=".csv" onChange={e => setFile(e.target.files?.[0] ?? null)} />
        <Button onClick={handleImport} disabled={!file || loading}>
          {loading ? 'Importing…' : 'Import'}
        </Button>
      </div>

      {result && (
        <div className="rounded-lg border border-border p-4 space-y-1 text-sm">
          <p className="font-semibold text-green-600 dark:text-green-400">{result.created} created, {result.updated} updated</p>
          {result.errors.map((e, i) => <p key={i} className="text-destructive text-xs">{e}</p>)}
        </div>
      )}
    </div>
  )
}
