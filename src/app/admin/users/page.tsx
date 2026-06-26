'use client'
import { useState, useEffect, useRef } from 'react'

const USERS_SAMPLE_CSV = [
  'FirstName,LastName,EmailAddress,IdNumber,UserType,Role',
  'Jane,Smith,jsmith@district.edu,12345,Staff,User',
  'Bob,Johnson,bjohnson@district.edu,67890,Staff,SuperUser',
  'Alice,Chen,achen@district.edu,11111,Student,User',
].join('\n')

function downloadUsersSample() {
  const blob = new Blob([USERS_SAMPLE_CSV], { type: 'text/csv' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'cairn-users-sample.csv'
  a.click()
}

type LocalUser = {
  id: string; firstName: string; lastName: string; email: string | null
  idNumber: string | null; userType: string; role: string; createdAt: string
}
type PwModal = { id: string; name: string; email: string | null }
type EditState = Omit<LocalUser, 'id' | 'createdAt'> | null

const ROLE_COLORS: Record<string, string> = { Admin: 'text-red-500', SuperUser: 'text-amber-500', User: 'text-muted-foreground' }

export default function UsersPage() {
  const [users, setUsers] = useState<LocalUser[]>([])
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState<string | null>(null)
  const [editData, setEditData] = useState<EditState>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newUser, setNewUser] = useState({ firstName: '', lastName: '', email: '', idNumber: '', userType: 'Staff', role: 'User' })
  const [importResult, setImportResult] = useState<any>(null)
  const [importError, setImportError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const [saving, setSaving] = useState(false)
  const [pwModal, setPwModal] = useState<PwModal | null>(null)
  const [pwValue, setPwValue] = useState('')
  const [pwConfirm, setPwConfirm] = useState('')
  const [pwError, setPwError] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwSuccess, setPwSuccess] = useState(false)

  useEffect(() => {
    const t = setTimeout(load, q ? 200 : 0)
    return () => clearTimeout(t)
  }, [q])

  async function load() {
    const r = await fetch(`/api/local-users?q=${encodeURIComponent(q)}`)
    const d = await r.json()
    setUsers(d.users ?? [])
  }

  async function saveEdit() {
    if (!editing || !editData) return
    setSaving(true)
    await fetch(`/api/local-users/${editing}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editData) })
    setSaving(false); setEditing(null); setEditData(null); load()
  }

  async function deleteUser(id: string, name: string) {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return
    await fetch(`/api/local-users/${id}`, { method: 'DELETE' }); load()
  }

  async function addUser() {
    if (!newUser.firstName || !newUser.lastName) return
    setSaving(true)
    await fetch('/api/local-users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newUser) })
    setSaving(false); setShowAdd(false); setNewUser({ firstName: '', lastName: '', email: '', idNumber: '', userType: 'Staff', role: 'User' }); load()
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setImportResult(null); setImportError('')
    const text = await file.text()
    const r = await fetch('/api/local-users/import', { method: 'POST', body: text, headers: { 'Content-Type': 'text/plain' } })
    const d = await r.json()
    if (r.ok) { setImportResult(d); load() }
    else setImportError(d.error ?? 'Import failed')
    e.target.value = ''
  }

  async function setPassword() {
    if (!pwModal) return
    setPwError('')
    if (pwValue.length < 8) { setPwError('Password must be at least 8 characters'); return }
    if (pwValue !== pwConfirm) { setPwError('Passwords do not match'); return }
    setPwSaving(true)
    const r = await fetch(`/api/local-users/${pwModal.id}/set-password`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pwValue }),
    })
    const d = await r.json()
    setPwSaving(false)
    if (!r.ok) { setPwError(d.error ?? 'Failed to set password'); return }
    setPwSuccess(true)
    setTimeout(() => { setPwModal(null); setPwValue(''); setPwConfirm(''); setPwSuccess(false) }, 1200)
  }

  const startEdit = (u: LocalUser) => {
    setEditing(u.id)
    setEditData({ firstName: u.firstName, lastName: u.lastName, email: u.email ?? '', idNumber: u.idNumber ?? '', userType: u.userType, role: u.role })
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Manage staff and students. Assign devices during Check Out.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => fileRef.current?.click()} className="px-3 py-2 rounded-md border border-border text-sm hover:bg-accent">
            Import CSV
          </button>
          <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleImport} />
          <button onClick={() => setShowAdd(true)} className="px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold">
            + Add User
          </button>
        </div>
      </div>

      {/* CSV info */}
      <div className="rounded-md border border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground space-y-1.5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="font-semibold text-foreground text-sm">CSV Format</p>
          <button onClick={downloadUsersSample}
            className="text-xs px-3 py-1.5 rounded-md border border-border hover:bg-accent transition-colors font-medium text-foreground">
            ↓ Download Sample CSV
          </button>
        </div>
        <p><span className="font-semibold text-foreground">Required:</span> <span className="font-mono">FirstName, LastName</span></p>
        <p><span className="font-semibold text-foreground">Optional:</span> <span className="font-mono">EmailAddress, IdNumber, UserType (Staff/Student), Role (User/SuperUser/Admin)</span></p>
        <p>Existing users with matching email are updated; others are created.</p>
      </div>

      {importResult && (
        <div className="rounded-md border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm space-y-1">
          <p className="font-semibold text-green-700 dark:text-green-400">Import complete — {importResult.created} records processed</p>
          {importResult.skipped > 0 && <p className="text-muted-foreground">{importResult.skipped} skipped (duplicates or errors)</p>}
          {importResult.errors?.length > 0 && <ul className="list-disc list-inside text-xs text-muted-foreground">{importResult.errors.map((e: string, i: number) => <li key={i}>{e}</li>)}</ul>}
        </div>
      )}
      {importError && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{importError}</div>}

      {/* Search */}
      <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by name, email, or ID…"
        className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm outline-none focus:border-primary" />

      {/* Add form */}
      {showAdd && (
        <div className="rounded-lg border border-border p-4 space-y-4 bg-card">
          <h3 className="font-semibold text-sm">New User</h3>
          <div className="grid grid-cols-2 gap-3">
            <Field label="First Name *"><input value={newUser.firstName} onChange={e => setNewUser(u => ({ ...u, firstName: e.target.value }))} className="form-input" placeholder="First" /></Field>
            <Field label="Last Name *"><input value={newUser.lastName} onChange={e => setNewUser(u => ({ ...u, lastName: e.target.value }))} className="form-input" placeholder="Last" /></Field>
            <Field label="Email"><input type="email" value={newUser.email} onChange={e => setNewUser(u => ({ ...u, email: e.target.value }))} className="form-input" placeholder="optional" /></Field>
            <Field label="ID Number"><input value={newUser.idNumber} onChange={e => setNewUser(u => ({ ...u, idNumber: e.target.value }))} className="form-input" placeholder="optional" /></Field>
            <Field label="Type">
              <select value={newUser.userType} onChange={e => setNewUser(u => ({ ...u, userType: e.target.value }))} className="form-input">
                <option value="Staff">Staff</option><option value="Student">Student</option>
              </select>
            </Field>
            <Field label="Role">
              <select value={newUser.role} onChange={e => setNewUser(u => ({ ...u, role: e.target.value }))} className="form-input">
                <option value="User">User</option><option value="SuperUser">SuperUser</option><option value="Admin">Admin</option>
              </select>
            </Field>
          </div>
          <div className="flex gap-2">
            <button onClick={addUser} disabled={saving || !newUser.firstName || !newUser.lastName}
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50">
              {saving ? 'Saving…' : 'Add User'}
            </button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground">Cancel</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-2.5">Name</th>
              <th className="text-left px-4 py-2.5">Email / ID</th>
              <th className="text-left px-4 py-2.5">Type</th>
              <th className="text-left px-4 py-2.5">Role</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground text-sm">No users found</td></tr>
            )}
            {users.map(u => editing === u.id && editData ? (
              <tr key={u.id} className="bg-accent/20">
                <td className="px-4 py-2">
                  <div className="flex gap-2">
                    <input value={editData.firstName} onChange={e => setEditData(d => d && ({ ...d, firstName: e.target.value }))} className="form-input text-xs w-24" />
                    <input value={editData.lastName} onChange={e => setEditData(d => d && ({ ...d, lastName: e.target.value }))} className="form-input text-xs w-28" />
                  </div>
                </td>
                <td className="px-4 py-2">
                  <div className="flex gap-2">
                    <input value={editData.email ?? ''} onChange={e => setEditData(d => d && ({ ...d, email: e.target.value }))} className="form-input text-xs w-40" placeholder="email" />
                    <input value={editData.idNumber ?? ''} onChange={e => setEditData(d => d && ({ ...d, idNumber: e.target.value }))} className="form-input text-xs w-20" placeholder="ID#" />
                  </div>
                </td>
                <td className="px-4 py-2">
                  <select value={editData.userType} onChange={e => setEditData(d => d && ({ ...d, userType: e.target.value }))} className="form-input text-xs">
                    <option value="Staff">Staff</option><option value="Student">Student</option>
                  </select>
                </td>
                <td className="px-4 py-2">
                  <select value={editData.role} onChange={e => setEditData(d => d && ({ ...d, role: e.target.value }))} className="form-input text-xs">
                    <option value="User">User</option><option value="SuperUser">SuperUser</option><option value="Admin">Admin</option>
                  </select>
                </td>
                <td className="px-4 py-2">
                  <div className="flex gap-1.5 justify-end">
                    <button onClick={saveEdit} disabled={saving} className="px-2.5 py-1 rounded bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-50">Save</button>
                    <button onClick={() => { setEditing(null); setEditData(null) }} className="px-2.5 py-1 rounded border border-border text-xs text-muted-foreground">Cancel</button>
                  </div>
                </td>
              </tr>
            ) : (
              <tr key={u.id} className="hover:bg-accent/20 transition-colors">
                <td className="px-4 py-3 font-medium">{u.firstName} {u.lastName}</td>
                <td className="px-4 py-3 text-muted-foreground text-xs">
                  <div>{u.email ?? <span className="italic opacity-50">no email</span>}</div>
                  {u.idNumber && <div className="font-mono">ID: {u.idNumber}</div>}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{u.userType}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-semibold ${ROLE_COLORS[u.role] ?? ''}`}>{u.role}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5 justify-end">
                    {(u.role === 'SuperUser' || u.role === 'Admin') && (
                      <button onClick={() => { setPwModal({ id: u.id, name: `${u.firstName} ${u.lastName}`, email: u.email }); setPwValue(''); setPwConfirm(''); setPwError(''); setPwSuccess(false) }}
                        className="px-2.5 py-1 rounded border border-border text-xs hover:bg-accent">
                        Set PW
                      </button>
                    )}
                    <button onClick={() => startEdit(u)} className="px-2.5 py-1 rounded border border-border text-xs hover:bg-accent">Edit</button>
                    <button onClick={() => deleteUser(u.id, `${u.firstName} ${u.lastName}`)} className="px-2.5 py-1 rounded border border-destructive/40 text-xs text-destructive hover:bg-destructive/10">Del</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-2 border-t border-border text-xs text-muted-foreground">{users.length} users{q ? ' matching' : ' total'}</div>
      </div>

      {/* Set Password Modal */}
      {pwModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-sm space-y-4 shadow-xl">
            <h2 className="font-semibold text-base">Set Password — {pwModal.name}</h2>
            {!pwModal.email && (
              <p className="text-amber-600 dark:text-amber-400 text-xs bg-amber-500/10 border border-amber-500/30 rounded px-3 py-2">
                This user has no email address. Add one first — they need it to log in.
              </p>
            )}
            {pwSuccess ? (
              <p className="text-green-600 dark:text-green-400 text-sm font-medium">Password updated successfully.</p>
            ) : (
              <>
                <div className="space-y-3">
                  <Field label="New Password">
                    <input type="password" value={pwValue} onChange={e => setPwValue(e.target.value)}
                      className="form-input" placeholder="min 8 characters" autoFocus />
                  </Field>
                  <Field label="Confirm Password">
                    <input type="password" value={pwConfirm} onChange={e => setPwConfirm(e.target.value)}
                      className="form-input" placeholder="repeat password"
                      onKeyDown={e => e.key === 'Enter' && setPassword()} />
                  </Field>
                  {pwError && <p className="text-destructive text-xs">{pwError}</p>}
                </div>
                <div className="flex gap-2">
                  <button onClick={setPassword} disabled={pwSaving}
                    className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50">
                    {pwSaving ? 'Saving…' : 'Set Password'}
                  </button>
                  <button onClick={() => setPwModal(null)} className="px-4 py-2 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground">
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground block">{label}</label>
      {children}
    </div>
  )
}
