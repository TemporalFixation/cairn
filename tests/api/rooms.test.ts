/**
 * @jest-environment node
 */

import { prisma } from '@/lib/prisma'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    room: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}))

jest.mock('@/lib/auth', () => ({
  auth: jest.fn().mockResolvedValue({ user: { id: 'u1', role: 'Admin' } }),
}))

import { GET, POST } from '@/app/api/rooms/route'
import { NextRequest } from 'next/server'

test('GET /api/rooms returns rooms for building', async () => {
  const mockRooms = [{ id: 'r1', name: 'Room 101', building: 'MHS' }]
  ;(prisma.room.findMany as jest.Mock).mockResolvedValue(mockRooms)
  const req = new NextRequest('http://localhost/api/rooms?building=MHS')
  const res = await GET(req)
  const body = await res.json()
  expect(body.rooms).toEqual(mockRooms)
  expect(prisma.room.findMany).toHaveBeenCalledWith({ where: { building: 'MHS' }, orderBy: { name: 'asc' } })
})

test('POST /api/rooms creates a room', async () => {
  const newRoom = { id: 'r2', name: 'Room 202', building: 'BG', responsiblePerson: null }
  ;(prisma.room.create as jest.Mock).mockResolvedValue(newRoom)
  const req = new NextRequest('http://localhost/api/rooms', {
    method: 'POST',
    body: JSON.stringify({ name: 'Room 202', building: 'BG' }),
  })
  const res = await POST(req)
  const body = await res.json()
  expect(res.status).toBe(201)
  expect(body.room.name).toBe('Room 202')
})
