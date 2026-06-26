import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import pg from 'pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

const defaults = [
  // Manufacturers
  ...['Apple', 'Acer', 'Dell', 'HP', 'Lenovo', 'Samsung', 'Asus', 'Google'].map((v, i) => ({
    category: 'manufacturer', value: v, parentValue: '', sortOrder: i,
  })),
  // Models per manufacturer
  ...([
    ['Apple',   ['MacBook Air', 'MacBook Pro', 'iPad', 'iPad Mini']],
    ['Acer',    ['Chromebook 314', 'Chromebook 315', 'Chromebook Spin 311']],
    ['Dell',    ['Chromebook 3100', 'Chromebook 3110', 'Latitude 3120']],
    ['HP',      ['Chromebook 11', 'Chromebook 14', 'ProBook 440']],
    ['Lenovo',  ['Chromebook 100e', 'Chromebook 300e', 'IdeaPad Flex 3']],
    ['Google',  ['Pixelbook Go', 'Chromebook Pixel']],
    ['Samsung', ['Chromebook 4', 'Galaxy Chromebook Go']],
    ['Asus',    ['Chromebook C204', 'Chromebook CX1']],
  ].flatMap(([mfr, models]) =>
    models.map((v, i) => ({ category: 'model', value: v, parentValue: mfr, sortOrder: i }))
  )),
  // Issue types
  ...['Cracked Screen', 'Battery', 'Keyboard', 'Charging Port', 'Software', 'Lost/Stolen', 'Water Damage', 'Other'].map((v, i) => ({
    category: 'issueType', value: v, parentValue: '', sortOrder: i,
  })),
  // Funding sources
  ...['E-Rate', 'Title I', 'General Fund', 'Bond', 'Grant', 'ESSER', 'Other'].map((v, i) => ({
    category: 'fundingSource', value: v, parentValue: '', sortOrder: i,
  })),
]

for (const row of defaults) {
  await prisma.lookupValue.upsert({
    where: { category_value_parentValue: { category: row.category, value: row.value, parentValue: row.parentValue } },
    update: {},
    create: row,
  })
}

console.log(`Seeded ${defaults.length} lookup values.`)
await prisma.$disconnect()
await pool.end()
