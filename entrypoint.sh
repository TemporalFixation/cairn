#!/bin/sh
set -e

PRISMA="node node_modules/prisma/build/index.js"
BASELINE="20260101000000_init"

# ── 1. Detect migration state ─────────────────────────────────
echo "[startup] Checking database migration state..."
node scripts/migrate-init.mjs
INIT_EXIT=$?

if [ $INIT_EXIT -eq 2 ]; then
  echo "[startup] Marking baseline migration as applied (existing deployment)..."
  $PRISMA migrate resolve --applied "$BASELINE"
elif [ $INIT_EXIT -ne 0 ]; then
  echo "[startup] Migration state detection failed. Aborting."
  exit 1
fi

# ── 2. Apply any pending migrations (safe — never drops data) ─
echo "[startup] Applying pending migrations..."
$PRISMA migrate deploy

# ── 3. Seed lookup values (idempotent) ────────────────────────
echo "[startup] Seeding lookup values..."
node scripts/seed-lookups.mjs

# ── 4. First-run admin password setup ─────────────────────────
node scripts/setup-admin.mjs

# ── 5. Start the application ──────────────────────────────────
echo "[startup] Starting K-12 Inventory..."
exec node_modules/.bin/next start
