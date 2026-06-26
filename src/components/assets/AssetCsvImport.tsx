'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

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
    <div className="space-y-4 max-w-xl">
      <div>
        <p className="text-sm font-medium mb-1">Required columns:</p>
        <code className="text-xs bg-slate-100 px-2 py-1 rounded block">
          asset_tag, serial_number, model, manufacturer, building, condition, purchase_date, purchase_price, warranty_expiration, funding_source, notes
        </code>
        <p className="text-xs text-slate-500 mt-1">
          Only asset_tag, serial_number, model, manufacturer, building are required. Existing serial numbers will be updated.
        </p>
      </div>
      <div className="flex gap-2">
        <Input type="file" accept=".csv" onChange={e => setFile(e.target.files?.[0] ?? null)} />
        <Button onClick={handleImport} disabled={!file || loading}>
          {loading ? 'Importing...' : 'Import'}
        </Button>
      </div>
      {result && (
        <div className="text-sm space-y-1">
          <p className="text-green-600">{result.created} created, {result.updated} updated</p>
          {result.errors.map((e, i) => <p key={i} className="text-red-500">{e}</p>)}
        </div>
      )}
    </div>
  )
}
