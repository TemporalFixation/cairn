'use client'
import { useRouter } from 'next/navigation'
import { AssetForm } from '@/components/assets/AssetForm'

export default function NewAssetPage() {
  const router = useRouter()
  async function handleSave(data: any) {
    const res = await fetch('/api/assets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      const { asset } = await res.json()
      router.push(`/assets/${asset.id}`)
    } else {
      const err = await res.json().catch(() => ({}))
      alert(`Failed to create asset: ${err.error ?? res.statusText}`)
    }
  }
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Add Asset</h1>
      <AssetForm onSave={handleSave} />
    </div>
  )
}
