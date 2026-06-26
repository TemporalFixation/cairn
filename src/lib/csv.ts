import Papa from 'papaparse'

export function parseCsv<T>(text: string): { data: T[]; errors: string[] } {
  const result = Papa.parse<T>(text, { header: true, skipEmptyLines: true })
  const errors = result.errors.map(e => `Row ${e.row}: ${e.message}`)
  return { data: result.data, errors }
}
