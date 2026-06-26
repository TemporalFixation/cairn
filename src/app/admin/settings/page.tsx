'use client'
import { useState, useEffect } from 'react'

const PRESETS = [
  { name: 'District Crimson & Gold', primary: '#BC1616', navbar: '#7A0E0E', gold: '#CD9A3B' },
  { name: 'Navy & Amber', primary: '#1B3358', navbar: '#0F2040', gold: '#D97706' },
  { name: 'Forest & Sage', primary: '#1A5C34', navbar: '#0F3D22', gold: '#8FBE6A' },
  { name: 'Slate & Violet', primary: '#3B3F8C', navbar: '#252860', gold: '#7C6EE8' },
  { name: 'Teal & Copper', primary: '#0F7D7D', navbar: '#085454', gold: '#B86A2A' },
]

export default function SettingsPage() {
  const [settings, setSettings] = useState({ appName: 'K-12 Inventory', primaryColor: '#BC1616', navbarColor: '#7A0E0E', goldColor: '#CD9A3B' })
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(d => {
      if (d.settings) setSettings(s => ({ ...s, ...d.settings }))
      setLoading(false)
    })
  }, [])

  async function save() {
    setSaving(true)
    await fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) })
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 3000)
  }

  function applyPreset(p: typeof PRESETS[0]) {
    setSettings(s => ({ ...s, primaryColor: p.primary, navbarColor: p.navbar, goldColor: p.gold }))
  }

  if (loading) return <div className="p-8 text-muted-foreground text-sm">Loading…</div>

  return (
    <div className="max-w-xl mx-auto py-8 px-4 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">App Settings</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Customize the app name and color scheme for your district.</p>
      </div>

      {/* App Name */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">App Name</h2>
        <div className="space-y-1">
          <label className="text-sm font-medium">Name shown in the navbar</label>
          <input value={settings.appName} onChange={e => setSettings(s => ({ ...s, appName: e.target.value }))}
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm outline-none focus:border-primary" />
        </div>
      </div>

      {/* Color Scheme */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Color Scheme</h2>

        <div className="grid gap-2">
          {PRESETS.map(p => (
            <button key={p.name} onClick={() => applyPreset(p)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md border border-border hover:border-primary text-left transition-colors text-sm">
              <div className="flex gap-1 shrink-0">
                <div className="w-5 h-5 rounded-full border border-white/20" style={{ backgroundColor: p.navbar }} />
                <div className="w-5 h-5 rounded-full border border-white/20" style={{ backgroundColor: p.primary }} />
                <div className="w-5 h-5 rounded-full border border-white/20" style={{ backgroundColor: p.gold }} />
              </div>
              <span>{p.name}</span>
            </button>
          ))}
        </div>

        <div className="border-t border-border pt-4 space-y-3">
          <p className="text-xs text-muted-foreground">Or set custom values:</p>
          <div className="grid grid-cols-3 gap-3">
            <ColorField label="Primary" value={settings.primaryColor} onChange={v => setSettings(s => ({ ...s, primaryColor: v }))} />
            <ColorField label="Navbar" value={settings.navbarColor} onChange={v => setSettings(s => ({ ...s, navbarColor: v }))} />
            <ColorField label="Accent" value={settings.goldColor} onChange={v => setSettings(s => ({ ...s, goldColor: v }))} />
          </div>
        </div>

        {/* Live preview */}
        <div className="rounded-lg overflow-hidden border border-border">
          <div className="px-4 py-2.5 text-sm font-semibold text-white" style={{ backgroundColor: settings.navbarColor }}>
            {settings.appName || 'K-12 Inventory'}
          </div>
          <div className="p-4 space-y-2 bg-card">
            <button className="px-3 py-1.5 rounded text-xs text-white font-semibold" style={{ backgroundColor: settings.primaryColor }}>Primary Button</button>
            <span className="ml-2 px-2 py-0.5 rounded text-xs font-semibold text-white" style={{ backgroundColor: settings.goldColor }}>Accent</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving}
          className="px-5 py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50">
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
        {saved && <span className="text-green-600 text-sm font-medium">Saved ✓</span>}
      </div>
      <p className="text-xs text-muted-foreground">Note: Color changes apply on next page load. A full site reload may be required to see the new navbar color.</p>
    </div>
  )
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground block">{label}</label>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={e => onChange(e.target.value)} className="w-8 h-8 rounded cursor-pointer border border-border bg-transparent" />
        <input value={value} onChange={e => onChange(e.target.value)} className="flex-1 min-w-0 px-2 py-1.5 rounded border border-input bg-background text-xs font-mono outline-none focus:border-primary" />
      </div>
    </div>
  )
}
