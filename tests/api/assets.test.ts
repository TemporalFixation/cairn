/**
 * @jest-environment node
 */
import { prisma } from '@/lib/prisma'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    asset: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
  },
}))

jest.mock('@/lib/auth', () => ({
  auth: jest.fn().mockResolvedValue({ user: { id: 'u1', role: 'Technician' } }),
}))

import { GET, POST } from '@/app/api/assets/route'
import { NextRequest } from 'next/server'

test('GET /api/assets returns assets', async () => {
  const mockAssets = [{ id: 'a1', serialNumber: 'SN001', model: 'Chromebook' }]
  ;(prisma.asset.findMany as jest.Mock).mockResolvedValue(mockAssets)
  const req = new NextRequest('http://localhost/api/assets')
  const res = await GET(req)
  const body = await res.json()
  expect(body.assets).toEqual(mockAssets)
})

test('POST /api/assets creates asset', async () => {
  const newAsset = { id: 'a2', serialNumber: 'SN002', assetTag: 'TAG002', model: 'Chromebook 4', manufacturer: 'Lenovo', building: 'MHS', condition: 'New' }
  ;(prisma.asset.create as jest.Mock).mockResolvedValue(newAsset)
  const req = new NextRequest('http://localhost/api/assets', {
    method: 'POST',
    body: JSON.stringify({ serialNumber: 'SN002', assetTag: 'TAG002', model: 'Chromebook 4', manufacturer: 'Lenovo', building: 'MHS', condition: 'New' }),
  })
  const res = await POST(req)
  expect(res.status).toBe(201)
})
