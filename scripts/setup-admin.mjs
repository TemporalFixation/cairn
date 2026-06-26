/**
 * Generates a random admin password on first run.
 * Stores a scrypt hash in AppSetting.
 * Prints the plaintext password to stdout for the operator to read.
 */
import pg from 'pg'
import { scryptSync, randomBytes } from 'crypto'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

function generatePassword(length = 16) {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$'
  let pw = ''
  const bytes = randomBytes(length)
  for (let i = 0; i < length; i++) pw += chars[bytes[i] % chars.length]
  return pw
}

try {
  // Check if a password hash already exists
  const { rows } = await pool.query(
    `SELECT value FROM "AppSetting" WHERE key = 'adminPasswordHash' LIMIT 1`
  )

  if (rows.length > 0 && rows[0].value) {
    // Password already set — nothing to do
    await pool.end()
    process.exit(0)
  }

  // First run — generate and store password
  const password = generatePassword()
  const hash = hashPassword(password)
  const now = new Date().toISOString()

  await pool.query(`
    INSERT INTO "AppSetting" ("key", "value", "updatedAt")
    VALUES ('adminPasswordHash', $1, $2),
           ('passwordChangeRequired', 'true', $2)
    ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED."value", "updatedAt" = EXCLUDED."updatedAt"
  `, [hash, now])

  // Print prominently to terminal
  const border = '═'.repeat(56)
  console.log('\n╔' + border + '╗')
  console.log('║  ⚠  K-12 INVENTORY — FIRST RUN ADMIN PASSWORD         ║')
  console.log('╠' + border + '╣')
  console.log(`║  Password: ${password.padEnd(44)} ║`)
  console.log('║                                                        ║')
  console.log('║  You will be asked to change this on first login.      ║')
  console.log('║  Save it now — it will NOT be shown again.             ║')
  console.log('╚' + border + '╝\n')

  await pool.end()
  process.exit(0)
} catch (err) {
  console.error('[setup-admin] Error:', err.message)
  await pool.end()
  process.exit(1)
}
