import { google } from 'googleapis'
import type { PersonSnapshot } from '@/types'

function getAdminClient() {
  const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  if (!keyJson) throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY not set')
  const key = JSON.parse(keyJson)
  const auth = new google.auth.JWT({
    email: key.client_email,
    key: key.private_key,
    scopes: ['https://www.googleapis.com/auth/admin.directory.user.readonly'],
    subject: process.env.GOOGLE_ADMIN_SUBJECT,
  })
  return google.admin({ version: 'directory_v1', auth })
}

export async function searchDirectory(query: string): Promise<PersonSnapshot[]> {
  if (!query || query.length < 2) return []
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) return []
  const admin = getAdminClient()
  const res = await admin.users.list({
    customer: 'my_customer',
    query: `name:${query}*`,
    maxResults: 10,
    orderBy: 'givenName',
    projection: 'basic',
  })
  return (res.data.users ?? []).map((u) => ({
    name: u.name?.fullName ?? u.primaryEmail ?? '',
    email: u.primaryEmail ?? '',
    ou: (u.orgUnitPath ?? '').toLowerCase().includes('student') ? 'Student' : 'Staff',
  }))
}
