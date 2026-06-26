import { PrismaClient, Building } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // Buildings are represented as enum values in Prisma — no separate table needed.
  // Seed a sample room per building so the app is usable immediately.
  const rooms = [
    { name: 'Room 101', building: Building.MHS },
    { name: 'Room 102', building: Building.MHS },
    { name: 'Library Cart A', building: Building.LPQ },
    { name: 'Room 201', building: Building.BG },
    { name: 'Room 301', building: Building.CC },
  ]
  for (const room of rooms) {
    await prisma.room.upsert({
      where: { name_building: { name: room.name, building: room.building } },
      update: {},
      create: room,
    })
  }
  console.log('Seed complete')
}

main().catch(console.error).finally(() => prisma.$disconnect())
