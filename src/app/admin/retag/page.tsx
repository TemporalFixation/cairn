'use client'
import { useState, useRef } from 'react'

type Step = 'serial' | 'confirm' | 'success' | 'error'

export default function RetagPage() {
  const [step, setStep] = useState<Step>('serial')
  const [serialInput, setSerialInput] = useState('')
  const [newTagInput, setNewTagInput] = useState('')
  const [asset, setAsset] = useState<any>(null)
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const newTagRef = useRef<HTMLInputElement>(null)

  async function lookupSerial(e: React.FormEvent) {
    e.preventDefault()
    if (!serialInput.trim()) return
    setLoading(true)
    const r = await fetch(`/api/assets?serialNumber=${encodeURIComponent(serialInput.trim())}`)
    const d = await r.json()
    setLoading(false)
    if (!d.asset) { setMsg(`No device found with serial "${serialInput.trim()}"`); return }
    setAsset(d.asset)
    setStep('confirm')
    setTimeout(() => newTagRef.current?.focus(), 100)
  }

  async function doRetag(e: React.FormEvent) {
    e.preventDefault()
    const newTag = newTagInput.trim()
    if (!newTag) return
    setLoading(true)
    // Check new tag not already taken
    const check = await fetch(`/api/assets?assetTag=${encodeURIComponent(newTag)}`)
    const cd = await check.json()
    if (cd.asset && cd.asset.id !== asset.id) {
      setMsg(`Tag "${newTag}" is already assigned to another device (${cd.asset.assetTag}).`)
      setLoading(false); return
    }
    const r = await fetch(`/api/assets/${asset.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assetTag: newTag,
        secondaryTags: [...(asset.secondaryTags ?? []), asset.assetTag],
      }),
    })
    setLoading(false)
    if (r.ok) { setMsg(`${asset.assetTag} → ${newTag}`); setStep('success') }
    else { setMsg('Update failed'); setStep('error') }
  }

  function reset() {
    setStep('serial'); setSerialInput(''); setNewTagInput(''); setAsset(null); setMsg('')
  }

  return (
    <div className="max-w-lg mx-auto py-10 px-4 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Replace Asset Tag</h1>
        <p className="text-muted-foreground text-sm mt-1">Find a device by serial number, then assign a new barcode tag. The old tag is preserved as a secondary tag.</p>
      </div>

      {step === 'serial' && (
        <form onSubmit={lookupSerial} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Serial Number</label>
            <input value={serialInput} onChange={e => setSerialInput(e.target.value)}
              placeholder="Scan or enter serial number" autoFocus
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm outline-none focus:border-primary" />
          </div>
          {msg && <p className="text-sm text-destructive">{msg}</p>}
          <button type="submit" disabled={loading || !serialInput.trim()}
            className="w-full py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50">
            {loading ? 'Looking up…' : 'Find Device'}
          </button>
        </form>
      )}

      {step === 'confirm' && asset && (
        <div className="space-y-6">
          <div className="rounded-lg border border-border p-4 space-y-1">
            <p className="text-xs text-muted-foreground font-mono uppercase tracking-wide">Device Found</p>
            <p className="text-xl font-bold font-mono">{asset.assetTag}</p>
            <p className="text-sm text-muted-foreground">{asset.manufacturer} {asset.model}</p>
            <p className="text-xs text-muted-foreground font-mono">S/N: {asset.serialNumber}</p>
            {asset.secondaryTags?.length > 0 && (
              <p className="text-xs text-muted-foreground">Secondary tags: {asset.secondaryTags.join(', ')}</p>
            )}
          </div>
          <form onSubmit={doRetag} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">New Asset Tag</label>
              <input ref={newTagRef} value={newTagInput} onChange={e => setNewTagInput(e.target.value)}
                placeholder="Scan new barcode tag"
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm font-mono outline-none focus:border-primary" />
              <p className="text-xs text-muted-foreground">Old tag "{asset.assetTag}" will be saved as a secondary tag</p>
            </div>
            {msg && <p className="text-sm text-destructive">{msg}</p>}
            <div className="flex gap-3">
              <button type="submit" disabled={loading || !newTagInput.trim()}
                className="flex-1 py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50">
                {loading ? 'Updating…' : 'Update Tag'}
              </button>
              <button type="button" onClick={reset} className="px-4 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {step === 'success' && (
        <div className="rounded-lg border border-border p-6 text-center space-y-3">
          <div className="text-3xl text-green-600">✓</div>
          <p className="font-semibold">Tag Updated</p>
          <p className="text-muted-foreground text-sm">{msg}</p>
          <button onClick={reset} className="mt-2 px-6 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold">Replace Another</button>
        </div>
      )}

      {step === 'error' && (
        <div className="rounded-lg border border-destructive/40 p-6 text-center space-y-3">
          <p className="text-destructive font-semibold">Error</p>
          <p className="text-sm text-muted-foreground">{msg}</p>
          <button onClick={reset} className="mt-2 px-6 py-2 rounded-md border border-border text-sm">Try Again</button>
        </div>
      )}
    </div>
  )
}
