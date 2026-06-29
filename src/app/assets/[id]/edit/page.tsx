'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AssetForm } from '@/components/assets/AssetForm'
import type { Asset } from '@/types'

export default function EditAssetPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [asset, setAsset] = useState<Asset | null>(null)

  useEffect(() => {
    fetch(`/api/assets/${id}`).then(r => r.json()).then(d => setAsset(d.asset))
  }, [id])

  async function handleSave(data: any) {
    const res = await fetch(`/api/assets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      alert(err.error ?? 'Save failed')
      return
    }
    router.push(`/assets/${id}`)
  }

  if (!asset) return <p>Loading...</p>
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Edit Asset</h1>
      <AssetForm asset={asset} onSave={handleSave} />
    </div>
  )
}
