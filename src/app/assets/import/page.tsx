import { AssetCsvImport } from '@/components/assets/AssetCsvImport'

export default function AssetImportPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Import Assets from CSV</h1>
      <AssetCsvImport />
    </div>
  )
}
