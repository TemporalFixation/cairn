#!/bin/bash
set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Cairn — Update Script"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Backup database before update
echo ""
echo "→ Creating database backup..."
BACKUP_FILE="backup-$(date +%Y%m%d-%H%M%S).sql"
docker compose exec -T db pg_dump -U k12user k12inventory > "$BACKUP_FILE" 2>/dev/null \
  && echo "  Backup saved to $BACKUP_FILE" \
  || echo "  Warning: backup failed (continuing anyway)"

# Pull latest code
echo ""
echo "→ Pulling latest changes from GitHub..."
git pull origin main

# Rebuild and restart
echo ""
echo "→ Rebuilding Docker image..."
docker compose up --build -d

echo ""
echo "→ Waiting for app to start..."
sleep 5

echo ""
echo "✓ Update complete! App is running on port ${PORT:-411}"
echo ""
echo "  View logs:  docker compose logs -f app"
echo "  Rollback:   psql \$DATABASE_URL < $BACKUP_FILE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
