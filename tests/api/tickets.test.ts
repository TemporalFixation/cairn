/**
 * @jest-environment node
 */

jest.mock('@/lib/prisma', () => ({
  prisma: {
    repairTicket: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}))

jest.mock('@/lib/auth', () => ({
  auth: jest.fn().mockResolvedValue({ user: { id: 'u1', role: 'Technician' } }),
}))

import { GET, POST } from '@/app/api/tickets/route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

test('GET /api/tickets returns tickets', async () => {
  ;(prisma.repairTicket.findMany as jest.Mock).mockResolvedValue([])
  const req = new NextRequest('http://localhost/api/tickets')
  const res = await GET(req)
  const body = await res.json()
  expect(body.tickets).toEqual([])
})

test('POST /api/tickets creates ticket', async () => {
  const ticket = { id: 't1', assetId: 'a1', issueType: 'Cracked Screen', issueDescription: 'Broken', status: 'Open', submittedById: 'u1' }
  ;(prisma.repairTicket.create as jest.Mock).mockResolvedValue(ticket)
  const req = new NextRequest('http://localhost/api/tickets', {
    method: 'POST',
    body: JSON.stringify({ assetId: 'a1', issueType: 'Cracked Screen', issueDescription: 'Broken' }),
  })
  const res = await POST(req)
  expect(res.status).toBe(201)
})
