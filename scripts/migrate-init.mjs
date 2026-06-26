/**
 * Detects whether the database is brand-new, a legacy db-push deployment,
 * or already running under Prisma migrations.
 *
 * Exit codes:
 *   0 — fresh DB or already tracking migrations → just run `migrate deploy`
 *   2 — legacy db-push DB (tables exist, no migrations table)
 *        → caller should run `prisma migrate resolve --applied <baseline>`
 *           then run `migrate deploy` to pick up any new migrations
 */
import pg from 'pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })

try {
  const { rows: mRows } = await pool.query(`
    SELECT EXISTS(
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = '_prisma_migrations'
    ) AS exists
  `)
  const hasMigrationsTable = mRows[0].exists === true || mRows[0].exists === 'true'

  if (hasMigrationsTable) {
    // Check if our baseline exists but failed (no finished_at means it recorded but didn't complete)
    const { rows: baseRows } = await pool.query(`
      SELECT finished_at FROM "_prisma_migrations"
      WHERE migration_name = '20260101000000_init' LIMIT 1
    `)
    if (baseRows.length > 0 && !baseRows[0].finished_at) {
      // Baseline recorded as failed — fix it if tables already exist
      const { rows: aRows } = await pool.query(`
        SELECT EXISTS(
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'Asset'
        ) AS exists
      `)
      const hasData = aRows[0].exists === true || aRows[0].exists === 'true'
      if (hasData) {
        console.log('[migrate-init] Baseline migration recorded but failed — tables exist. Marking as applied.')
        await pool.query(`
          UPDATE "_prisma_migrations"
          SET finished_at = NOW(), applied_steps_count = 1
          WHERE migration_name = '20260101000000_init'
        `)
      }
    } else {
      console.log('[migrate-init] Migration tracking already initialized.')
    }
    await pool.end()
    process.exit(0)
  }

  // No migrations table at all — check for pre-existing tables (legacy db push)
  const { rows: aRows } = await pool.query(`
    SELECT EXISTS(
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'Asset'
    ) AS exists
  `)
  const hasData = aRows[0].exists === true || aRows[0].exists === 'true'

  if (hasData) {
    console.log('[migrate-init] Legacy database detected (db-push era). Will mark baseline as applied.')
    await pool.end()
    process.exit(2)
  }

  console.log('[migrate-init] Fresh database. Migrations will build all tables.')
  await pool.end()
  process.exit(0)
} catch (err) {
  console.error('[migrate-init] Error:', err.message)
  await pool.end()
  process.exit(1)
}
