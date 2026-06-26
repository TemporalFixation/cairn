'use client'
import { useState, useEffect, useRef, useCallback } from 'react'

const ACCESSORIES = ['Case', 'Power Cord', 'Stylus', 'Headphones', 'Mouse', 'Keyboard']
const CONDITION_COLORS: Record<string, string> = {
  New: '#1C4E8A', Good: '#1A6B45', Fair: '#CD9A3B', Poor: '#BC1616',
}
const BUILDINGS = ['LPQ', 'MHS', 'BG', 'CC']

type Mode = 'checkout' | 'checkin' | 'enroll'
const MODE_CONFIG: Record<Mode, { label: string; color: string; prompt: string; hint: string }> = {
  checkout: { label: 'Check Out',        color: '#BC1616', prompt: 'Scan Asset Tag',     hint: 'Scan to check out a device' },
  checkin:  { label: 'Check In',         color: '#1A6B45', prompt: 'Scan Asset Tag',     hint: 'Scan to check in a device' },
  enroll:   { label: 'Rapid Enrollment', color: '#1C4E8A', prompt: 'Scan New Asset Tag', hint: 'Scan barcode to enroll a new device' },
}
type Step = 'scan' | 'form' | 'confirm' | 'success' | 'error'

export default function KioskPage() {
  const [mode, setMode] = useState<Mode>('checkout')
  const [step, setStep] = useState<Step>('scan')
  const [scanInput, setScanInput] = useState('')
  const [asset, setAsset] = useState<any>(null)
  const [accessories, setAccessories] = useState<string[]>([])
  const [statusMsg, setStatusMsg] = useState('')
  const [searching, setSearching] = useState(false)
  const [saving, setSaving] = useState(false)

  // Person / user state
  const [personQuery, setPersonQuery] = useState('')
  const [personResults, setPersonResults] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [newUser, setNewUser] = useState({ firstName: '', lastName: '', email: '', idNumber: '', userType: 'Staff' })

  // Enrollment form
  const [manufacturers, setManufacturers] = useState<string[]>([])
  const [models, setModels] = useState<string[]>([])
  const [enrollForm, setEnrollForm] = useState({ serialNumber: '', manufacturer: '', model: '', condition: 'Good', building: 'LPQ' })

  const scanRef = useRef<HTMLInputElement>(null)
  const personRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/lookup?category=manufacturer&parent=').then(r => r.json())
      .then(d => setManufacturers(d.values?.map((v: any) => v.value) ?? []))
  }, [])
  useEffect(() => {
    if (!enrollForm.manufacturer) { setModels([]); return }
    fetch(`/api/lookup?category=model&parent=${encodeURIComponent(enrollForm.manufacturer)}`)
      .then(r => r.json()).then(d => setModels(d.values?.map((v: any) => v.value) ?? []))
  }, [enrollForm.manufacturer])

  // Debounced user search
  useEffect(() => {
    if (!personQuery.trim() || personQuery.length < 2) { setPersonResults([]); return }
    const t = setTimeout(() => {
      fetch(`/api/local-users?q=${encodeURIComponent(personQuery)}`).then(r => r.json())
        .then(d => setPersonResults(d.users ?? []))
    }, 200)
    return () => clearTimeout(t)
  }, [personQuery])

  const reset = useCallback(() => {
    setStep('scan'); setAsset(null); setAccessories([]); setScanInput(''); setStatusMsg('')
    setPersonQuery(''); setPersonResults([]); setSelectedUser(null); setShowCreateUser(false)
    setNewUser({ firstName: '', lastName: '', email: '', idNumber: '', userType: 'Staff' })
    setEnrollForm({ serialNumber: '', manufacturer: '', model: '', condition: 'Good', building: 'LPQ' })
    setTimeout(() => scanRef.current?.focus(), 50)
  }, [])

  const switchMode = useCallback((m: Mode) => { setMode(m); reset() }, [reset])

  useEffect(() => { scanRef.current?.focus() }, [])
  useEffect(() => { if (step === 'success') { const t = setTimeout(reset, 3500); return () => clearTimeout(t) } }, [step, reset])
  useEffect(() => { if (step === 'confirm' && mode === 'checkout') setTimeout(() => personRef.current?.focus(), 100) }, [step, mode])
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') { setShowCreateUser(false); if (!showCreateUser) reset() } }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [reset, showCreateUser])

  // ── Scan ──────────────────────────────────────────────────
  async function handleScan(e: React.KeyboardEvent) {
    if (e.key !== 'Enter') return
    const val = scanInput.trim()
    if (!val) return
    setSearching(true)

    if (mode === 'enroll') {
      const r = await fetch(`/api/assets?assetTag=${encodeURIComponent(val)}`)
      const d = await r.json()
      setSearching(false)
      if (d.asset) { setStatusMsg(`"${val}" is already registered.`); setStep('error'); setTimeout(reset, 3000); return }
      setStep('form')
      return
    }

    const r = await fetch(`/api/assets?assetTag=${encodeURIComponent(val)}`)
    const d = await r.json()
    setSearching(false)
    if (!d.asset) { setStatusMsg(`No asset found: "${val}"`); setStep('error'); setScanInput(''); setTimeout(reset, 2500); return }
    setAsset(d.asset)
    // Pre-populate accessories from stored providedAccessories
    setAccessories(d.asset.providedAccessories ?? [])
    setStep('confirm')
  }

  // ── Save ──────────────────────────────────────────────────
  async function handleSaveEnroll() {
    if (!enrollForm.serialNumber || !enrollForm.manufacturer || !enrollForm.model) return
    setSaving(true)
    const r = await fetch('/api/assets', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assetTag: scanInput.trim(), ...enrollForm, providedAccessories: accessories }),
    })
    setSaving(false)
    if (r.ok) { setStatusMsg(`${scanInput.trim()} enrolled — ${enrollForm.manufacturer} ${enrollForm.model}`); setStep('success') }
    else { const e = await r.json(); setStatusMsg(e.error ?? 'Enrollment failed'); setStep('error'); setTimeout(reset, 3000) }
  }

  async function handleSaveCheckout() {
    if (!selectedUser && !personQuery.trim()) { personRef.current?.focus(); return }
    const person = selectedUser
      ? { name: `${selectedUser.firstName} ${selectedUser.lastName}`, id: selectedUser.id, email: selectedUser.email }
      : { name: personQuery.trim() }
    setSaving(true)
    const r = await fetch(`/api/assets/${asset.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignedToPerson: person, checkedOutAt: new Date().toISOString(), providedAccessories: accessories }),
    })
    setSaving(false)
    if (r.ok) { setStatusMsg(`${asset.assetTag} → ${person.name}`); setStep('success') }
    else { setStatusMsg('Save failed'); setStep('error'); setTimeout(reset, 2500) }
  }

  async function handleSaveCheckin() {
    setSaving(true)
    const r = await fetch(`/api/assets/${asset.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignedToPerson: null, checkedOutAt: null, providedAccessories: accessories }),
    })
    setSaving(false)
    if (r.ok) { setStatusMsg(`${asset.assetTag} checked in`); setStep('success') }
    else { setStatusMsg('Save failed'); setStep('error'); setTimeout(reset, 2500) }
  }

  async function handleCreateUser() {
    if (!newUser.firstName || !newUser.lastName) return
    const r = await fetch('/api/local-users', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser),
    })
    if (r.ok) {
      const { user } = await r.json()
      setSelectedUser(user)
      setPersonQuery(`${user.firstName} ${user.lastName}`)
      setPersonResults([])
      setShowCreateUser(false)
    }
  }

  function toggleAcc(acc: string) {
    setAccessories(p => p.includes(acc) ? p.filter(a => a !== acc) : [...p, acc])
  }

  const cfg = MODE_CONFIG[mode]
  const assignee = asset?.assignedToPerson as any

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#0C0D0D', color: 'white' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 shrink-0">
        <span className="text-white/60 text-sm font-semibold tracking-wide">K-12 Inventory · Kiosk</span>
        <div className="flex rounded-lg overflow-hidden border border-white/15">
          {(Object.keys(MODE_CONFIG) as Mode[]).map(m => (
            <button key={m} onClick={() => switchMode(m)}
              className="px-4 py-2 text-xs font-semibold transition-colors"
              style={mode === m ? { backgroundColor: MODE_CONFIG[m].color, color: 'white' } : { color: 'rgba(255,255,255,0.35)' }}>
              {MODE_CONFIG[m].label}
            </button>
          ))}
        </div>
        <a href="/" className="text-white/25 hover:text-white/60 text-xs transition-colors">Exit</a>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-8 py-10 gap-6 max-w-2xl mx-auto w-full">

        {/* SCAN */}
        {step === 'scan' && (
          <div className="w-full space-y-6 text-center">
            <div>
              <p className="text-xs font-mono tracking-widest uppercase mb-2" style={{ color: cfg.color }}>{cfg.label}</p>
              <h1 className="text-4xl font-bold mb-1">{cfg.prompt}</h1>
              <p className="text-white/30 text-sm">{cfg.hint}</p>
            </div>
            <BarcodeIcon />
            <input ref={scanRef} value={scanInput} onChange={e => setScanInput(e.target.value)} onKeyDown={handleScan}
              disabled={searching} placeholder={searching ? 'Looking up…' : 'Scan or type and press Enter'}
              className="w-full text-center text-2xl font-mono px-6 py-5 rounded-xl border-2 outline-none bg-[#181919] text-white"
              style={{ borderColor: cfg.color }} autoComplete="off" spellCheck={false} />
          </div>
        )}

        {/* ENROLLMENT FORM */}
        {step === 'form' && mode === 'enroll' && (
          <div className="w-full space-y-5">
            <div>
              <p className="text-xs font-mono tracking-widest uppercase mb-0.5" style={{ color: cfg.color }}>Rapid Enrollment</p>
              <h2 className="text-2xl font-bold">Tag <span className="font-mono">{scanInput}</span></h2>
            </div>
            <div className="space-y-3">
              <KField label="Serial Number *"><input value={enrollForm.serialNumber} onChange={e => setEnrollForm(f => ({ ...f, serialNumber: e.target.value }))} className="kiosk-input font-mono" placeholder="Scan or type serial #" autoComplete="off" /></KField>
              <KField label="Manufacturer *">
                <select value={enrollForm.manufacturer} onChange={e => setEnrollForm(f => ({ ...f, manufacturer: e.target.value, model: '' }))} className="kiosk-select" style={{ colorScheme: 'dark' }}>
                  <option value="">Select manufacturer</option>
                  {manufacturers.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </KField>
              <KField label="Model *">
                <select value={enrollForm.model} onChange={e => setEnrollForm(f => ({ ...f, model: e.target.value }))} className="kiosk-select" style={{ colorScheme: 'dark' }} disabled={!enrollForm.manufacturer}>
                  <option value="">{enrollForm.manufacturer ? 'Select model' : 'Select manufacturer first'}</option>
                  {models.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </KField>
              <div className="grid grid-cols-2 gap-3">
                <KField label="Condition">
                  <select value={enrollForm.condition} onChange={e => setEnrollForm(f => ({ ...f, condition: e.target.value }))} className="kiosk-select" style={{ colorScheme: 'dark' }}>
                    {['New', 'Good', 'Fair', 'Poor'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </KField>
                <KField label="Building">
                  <select value={enrollForm.building} onChange={e => setEnrollForm(f => ({ ...f, building: e.target.value }))} className="kiosk-select" style={{ colorScheme: 'dark' }}>
                    {BUILDINGS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </KField>
              </div>
              <AccessoryPicker label="Provided Accessories" values={accessories} toggle={toggleAcc} />
            </div>
            <div className="flex gap-3">
              <button onClick={handleSaveEnroll} disabled={saving || !enrollForm.serialNumber || !enrollForm.manufacturer || !enrollForm.model}
                className="flex-1 py-4 rounded-xl text-lg font-bold text-white disabled:opacity-40 transition-opacity"
                style={{ backgroundColor: cfg.color }}>
                {saving ? 'Enrolling…' : 'Enroll Device'}
              </button>
              <button onClick={reset} className="px-5 rounded-xl border border-white/20 text-white/50 hover:text-white/80 text-sm">Cancel</button>
            </div>
          </div>
        )}

        {/* CONFIRM */}
        {step === 'confirm' && asset && (
          <div className="w-full space-y-5">
            <AssetCard asset={asset} label={mode === 'checkout' ? 'Check Out' : 'Check In'} />

            {/* Check-in: show who's returning it */}
            {mode === 'checkin' && assignee?.name && (
              <div className="rounded-xl border border-white/10 px-4 py-3 flex items-center gap-3 bg-[#181919]">
                <span className="text-white/40 text-sm">Returning from:</span>
                <span className="font-semibold">{assignee.name}</span>
              </div>
            )}

            {/* Check-out: user lookup */}
            {mode === 'checkout' && (
              <div className="space-y-2">
                <label className="text-white/60 text-sm font-medium block">Assign to Person *</label>
                {selectedUser ? (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/20 bg-[#181919]">
                    <div className="flex-1">
                      <p className="font-semibold">{selectedUser.firstName} {selectedUser.lastName}</p>
                      <p className="text-white/40 text-xs">{selectedUser.userType} · {selectedUser.email ?? 'No email'}</p>
                    </div>
                    <button onClick={() => { setSelectedUser(null); setPersonQuery(''); setTimeout(() => personRef.current?.focus(), 50) }}
                      className="text-white/40 hover:text-white text-xs px-2 py-1 rounded border border-white/20">Change</button>
                  </div>
                ) : (
                  <div className="relative">
                    <input ref={personRef} value={personQuery} onChange={e => setPersonQuery(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && personResults.length === 0 && personQuery.trim() && setShowCreateUser(true)}
                      placeholder="Search by name, ID, or email…"
                      className="w-full text-lg px-4 py-3 rounded-xl border-2 outline-none bg-[#181919] text-white"
                      style={{ borderColor: personQuery ? cfg.color : '#2a2a2a' }}
                      autoComplete="off" />
                    {personResults.length > 0 && (
                      <ul className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl border border-white/15 overflow-hidden bg-[#1E1F1F] shadow-2xl">
                        {personResults.map(u => (
                          <li key={u.id} onClick={() => { setSelectedUser(u); setPersonQuery(`${u.firstName} ${u.lastName}`); setPersonResults([]) }}
                            className="px-4 py-3 flex items-center gap-3 hover:bg-white/10 cursor-pointer border-b border-white/5 last:border-0">
                            <div>
                              <p className="font-medium text-sm">{u.firstName} {u.lastName}</p>
                              <p className="text-white/40 text-xs">{u.userType} {u.idNumber ? `· ID: ${u.idNumber}` : ''} {u.email ? `· ${u.email}` : ''}</p>
                            </div>
                          </li>
                        ))}
                        <li onClick={() => setShowCreateUser(true)} className="px-4 py-3 text-sm font-medium cursor-pointer hover:bg-white/10 border-t border-white/10" style={{ color: cfg.color }}>
                          + Create new user
                        </li>
                      </ul>
                    )}
                    {personQuery.length >= 2 && personResults.length === 0 && (
                      <button onClick={() => setShowCreateUser(true)}
                        className="mt-2 w-full py-2 rounded-lg border border-white/20 text-sm text-white/50 hover:text-white/80 hover:border-white/40 transition-colors">
                        + Create user "{personQuery}"
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            <AccessoryPicker
              label={mode === 'checkout' ? 'Provided Accessories' : 'Accessories Returned'}
              values={accessories} toggle={toggleAcc}
              hint={mode === 'checkin' ? 'Pre-filled from check-out — uncheck anything not returned' : undefined}
            />

            <div className="flex gap-3 pt-1">
              <button
                onClick={mode === 'checkout' ? handleSaveCheckout : handleSaveCheckin}
                disabled={saving || (mode === 'checkout' && !selectedUser && !personQuery.trim())}
                className="flex-1 py-4 rounded-xl text-lg font-bold text-white disabled:opacity-40"
                style={{ backgroundColor: cfg.color }}>
                {saving ? 'Saving…' : mode === 'checkout' ? `Check Out → ${selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName}` : personQuery.trim() || '…'}` : 'Confirm Check In'}
              </button>
              <button onClick={reset} className="px-5 rounded-xl border border-white/20 text-white/50 hover:text-white/80 text-sm">Cancel</button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center space-y-4">
            <div className="text-5xl">✓</div>
            <h2 className="text-3xl font-bold" style={{ color: cfg.color }}>
              {mode === 'checkout' ? 'Checked Out' : mode === 'checkin' ? 'Checked In' : 'Enrolled'}
            </h2>
            <p className="text-white/60 text-lg">{statusMsg}</p>
            <p className="text-white/25 text-sm font-mono">Resetting…</p>
            <button onClick={reset} className="mt-2 px-6 py-3 rounded-xl border border-white/20 text-white/60 hover:text-white text-sm">Next →</button>
          </div>
        )}

        {step === 'error' && (
          <div className="text-center space-y-3">
            <div className="text-5xl text-red-500">✗</div>
            <h2 className="text-2xl font-bold">Error</h2>
            <p className="text-white/60">{statusMsg}</p>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setShowCreateUser(false)}>
          <div className="rounded-2xl border border-white/15 p-6 w-full max-w-md space-y-4 bg-[#1A1B1B]" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold">Create New User</h3>
            <div className="grid grid-cols-2 gap-3">
              <KField label="First Name *"><input value={newUser.firstName} onChange={e => setNewUser(u => ({ ...u, firstName: e.target.value }))} className="kiosk-input" placeholder="First" /></KField>
              <KField label="Last Name *"><input value={newUser.lastName} onChange={e => setNewUser(u => ({ ...u, lastName: e.target.value }))} className="kiosk-input" placeholder="Last" /></KField>
              <KField label="Email"><input type="email" value={newUser.email} onChange={e => setNewUser(u => ({ ...u, email: e.target.value }))} className="kiosk-input" placeholder="optional" /></KField>
              <KField label="ID Number"><input value={newUser.idNumber} onChange={e => setNewUser(u => ({ ...u, idNumber: e.target.value }))} className="kiosk-input" placeholder="optional" /></KField>
              <KField label="Type" className="col-span-2">
                <select value={newUser.userType} onChange={e => setNewUser(u => ({ ...u, userType: e.target.value }))} className="kiosk-select" style={{ colorScheme: 'dark' }}>
                  <option value="Staff">Staff</option>
                  <option value="Student">Student</option>
                </select>
              </KField>
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={handleCreateUser} disabled={!newUser.firstName || !newUser.lastName}
                className="flex-1 py-3 rounded-xl font-bold text-white disabled:opacity-40"
                style={{ backgroundColor: cfg.color }}>Create User</button>
              <button onClick={() => setShowCreateUser(false)} className="px-4 rounded-xl border border-white/20 text-white/50 hover:text-white/80 text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <p className="text-center pb-4 text-white/10 text-xs font-mono tracking-widest">ENTER · ESC</p>

      <style>{`
        .kiosk-input { width: 100%; padding: 10px 14px; background: #111; color: white; border: 1px solid rgba(255,255,255,0.12); border-radius: 8px; outline: none; font-size: 14px; }
        .kiosk-input:focus { border-color: rgba(255,255,255,0.35); }
        .kiosk-select { width: 100%; padding: 10px 14px; background: #111; color: white; border: 1px solid rgba(255,255,255,0.12); border-radius: 8px; outline: none; font-size: 14px; }
      `}</style>
    </div>
  )
}

function AssetCard({ asset, label }: { asset: any; label: string }) {
  const assignee = asset.assignedToPerson as any
  return (
    <div className="rounded-xl overflow-hidden border border-white/10 bg-[#181919]">
      <div className="h-1.5" style={{ backgroundColor: CONDITION_COLORS[asset.condition] ?? '#555' }} />
      <div className="p-5 flex items-start justify-between">
        <div>
          <p className="text-white/30 text-xs font-mono uppercase tracking-widest mb-0.5">{label}</p>
          <h2 className="text-3xl font-bold font-mono">{asset.assetTag}</h2>
          <p className="text-white/55 text-base mt-0.5">{asset.manufacturer} {asset.model}</p>
          <p className="text-white/25 text-xs font-mono mt-1.5">S/N: {asset.serialNumber}</p>
        </div>
        <div className="text-right space-y-1.5">
          <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{ backgroundColor: (CONDITION_COLORS[asset.condition] ?? '#555') + '33', color: CONDITION_COLORS[asset.condition] ?? '#aaa' }}>
            {asset.condition}
          </span>
          {asset.room && <p className="text-white/25 text-xs">{asset.building} · {asset.room.name}</p>}
          {assignee?.name && <p className="text-white/40 text-xs">→ {assignee.name}</p>}
        </div>
      </div>
    </div>
  )
}

function AccessoryPicker({ label, values, toggle, hint }: { label: string; values: string[]; toggle: (a: string) => void; hint?: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <label className="text-white/60 text-sm font-medium">{label}</label>
        {values.length > 0 && <span className="text-xs px-2 py-0.5 rounded font-semibold bg-[#CD9A3B22] text-[#CD9A3B]">{values.length} selected</span>}
      </div>
      {hint && <p className="text-white/30 text-xs">{hint}</p>}
      <div className="flex flex-wrap gap-2">
        {ACCESSORIES.map(acc => {
          const on = values.includes(acc)
          return (
            <button key={acc} onClick={() => toggle(acc)} type="button"
              className="px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition-all"
              style={on
                ? { backgroundColor: '#CD9A3B22', borderColor: '#CD9A3B', color: '#CD9A3B' }
                : { backgroundColor: '#181919', borderColor: '#2a2a2a', color: 'rgba(255,255,255,0.35)' }}>
              {acc}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function KField({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-1 ${className ?? ''}`}>
      <label className="text-white/45 text-xs font-medium block">{label}</label>
      {children}
    </div>
  )
}

function BarcodeIcon() {
  return (
    <div className="flex justify-center opacity-15">
      <svg width="64" height="56" viewBox="0 0 64 56" fill="none">
        <rect x="0" y="0" width="4" height="56" fill="white"/>
        <rect x="8" y="0" width="2" height="56" fill="white"/>
        <rect x="14" y="0" width="6" height="56" fill="white"/>
        <rect x="24" y="0" width="2" height="56" fill="white"/>
        <rect x="30" y="0" width="4" height="56" fill="white"/>
        <rect x="38" y="0" width="2" height="56" fill="white"/>
        <rect x="44" y="0" width="6" height="56" fill="white"/>
        <rect x="54" y="0" width="4" height="56" fill="white"/>
        <rect x="60" y="0" width="4" height="56" fill="white"/>
      </svg>
    </div>
  )
}
