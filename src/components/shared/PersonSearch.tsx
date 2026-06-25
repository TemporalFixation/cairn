'use client'
import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { PersonSnapshot } from '@/types'

type Props = {
  label?: string
  value: PersonSnapshot | null
  onSelect: (p: PersonSnapshot | null) => void
}

export function PersonSearch({ label = 'Assign to Person', value, onSelect }: Props) {
  const [query, setQuery] = useState(value?.name ?? '')
  const [results, setResults] = useState<PersonSnapshot[]>([])
  const [open, setOpen] = useState(false)
  const debounce = useRef<NodeJS.Timeout>()

  useEffect(() => {
    clearTimeout(debounce.current)
    if (query.length < 2) { setResults([]); return }
    debounce.current = setTimeout(async () => {
      const res = await fetch(`/api/directory/search?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      setResults(data.results ?? [])
      setOpen(true)
    }, 300)
  }, [query])

  return (
    <div className="relative space-y-1">
      <Label>{label}</Label>
      <Input
        value={query}
        onChange={e => { setQuery(e.target.value); onSelect(null) }}
        placeholder="Search by name..."
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && results.length > 0 && (
        <ul className="absolute z-10 w-full bg-white border rounded shadow-md max-h-48 overflow-y-auto">
          {results.map(p => (
            <li
              key={p.email}
              className="px-3 py-2 hover:bg-slate-100 cursor-pointer text-sm"
              onMouseDown={() => { onSelect(p); setQuery(p.name); setOpen(false) }}
            >
              <span className="font-medium">{p.name}</span>{' '}
              <span className="text-slate-500">({p.ou}) {p.email}</span>
            </li>
          ))}
        </ul>
      )}
      {value && (
        <p className="text-xs text-slate-500">{value.email} · {value.ou}</p>
      )}
    </div>
  )
}
