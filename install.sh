#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  Cairn — Install Script
#  Run once on a fresh Linux server to set everything up.
#  Requires: git, docker, docker compose, python3
# ═══════════════════════════════════════════════════════════════
set -e

INSTALL_DIR="/opt/cairn"
SERVICE_NAME="cairn-update"
WEBHOOK_PORT="${WEBHOOK_PORT:-9191}"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
info()    { echo -e "${BLUE}→${NC} $*"; }
success() { echo -e "${GREEN}✓${NC} $*"; }
warn()    { echo -e "${YELLOW}!${NC} $*"; }
error()   { echo -e "${RED}✗${NC} $*"; exit 1; }

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  Cairn — K-12 IT Asset Inventory"
echo "  Install Script"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# ── Prerequisite checks ─────────────────────────────────────────
info "Checking prerequisites..."
command -v git    >/dev/null 2>&1 || error "git is required. Install with: apt install git"
command -v docker >/dev/null 2>&1 || error "Docker is required. See: https://docs.docker.com/engine/install/"
command -v python3 >/dev/null 2>&1 || error "python3 is required. Install with: apt install python3"
docker compose version >/dev/null 2>&1 || error "Docker Compose v2 is required. See: https://docs.docker.com/compose/install/"
success "Prerequisites OK"

# ── Install location ────────────────────────────────────────────
echo ""
if [ -d "$INSTALL_DIR/.git" ]; then
  warn "Cairn already installed at $INSTALL_DIR. This will overwrite configuration!"
  read -p "  Continue? [y/N] " -n 1 -r; echo
  [[ $REPLY =~ ^[Yy]$ ]] || { echo "Aborted."; exit 0; }
else
  info "Installing Cairn to $INSTALL_DIR..."
  if [ "$(pwd)" = "$INSTALL_DIR" ]; then
    success "Already in $INSTALL_DIR"
  else
    mkdir -p "$INSTALL_DIR"
    # If running from a cloned repo, copy in place; otherwise clone
    if [ -f "$(pwd)/docker-compose.yml" ] && [ -f "$(pwd)/install.sh" ]; then
      info "Copying files to $INSTALL_DIR..."
      cp -r "$(pwd)/." "$INSTALL_DIR/"
    else
      info "Cloning from GitHub..."
      git clone https://github.com/TemporalFixation/cairn "$INSTALL_DIR"
    fi
    cd "$INSTALL_DIR"
  fi
fi

# ── Generate .env ───────────────────────────────────────────────
echo ""
info "Configuring environment..."

if [ ! -f ".env" ]; then
  cp .env.example .env

  # Generate secrets
  DB_PASS=$(openssl rand -base64 24 | tr -dc 'A-Za-z0-9' | head -c 32)
  AUTH_SECRET=$(openssl rand -base64 32)
  WEBHOOK_SECRET=$(openssl rand -base64 32)

  sed -i "s|change_me_strong_password|$DB_PASS|g" .env
  sed -i "s|change_me_strong_secret|$AUTH_SECRET|g" .env
  sed -i "s|change_me_webhook_secret|$WEBHOOK_SECRET|g" .env

  # Ask for server IP/URL
  echo ""
  echo "  What is the public IP or hostname of this server?"
  echo "  Example: 192.168.1.50  or  cairn.school.edu"
  read -p "  Server address: " SERVER_ADDR
  SERVER_ADDR="${SERVER_ADDR:-localhost}"
  PORT_NUM="${PORT:-411}"
  sed -i "s|http://your-server-ip:411|http://${SERVER_ADDR}:${PORT_NUM}|g" .env

  success ".env created with auto-generated secrets"
else
  warn ".env already exists — skipping generation"
  WEBHOOK_SECRET=$(grep '^WEBHOOK_SECRET=' .env | cut -d= -f2)
fi

# ── Start Docker services ───────────────────────────────────────
echo ""
info "Building and starting Cairn (this takes a few minutes the first time)..."
docker compose up --build -d
success "Cairn containers started"

# ── Install update webhook service ─────────────────────────────
echo ""
info "Installing Cairn update webhook service..."

# Write the systemd unit file with the correct path
cat > "/etc/systemd/system/${SERVICE_NAME}.service" <<EOF
[Unit]
Description=Cairn Update Webhook Server
After=network.target docker.service
Requires=docker.service

[Service]
Type=simple
User=root
WorkingDirectory=${INSTALL_DIR}
Environment="WEBHOOK_SECRET=${WEBHOOK_SECRET}"
Environment="WEBHOOK_PORT=${WEBHOOK_PORT}"
ExecStart=/usr/bin/python3 ${INSTALL_DIR}/webhook/cairn-update-server.py
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=cairn-webhook

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable "${SERVICE_NAME}"
systemctl restart "${SERVICE_NAME}"

sleep 2
if systemctl is-active --quiet "${SERVICE_NAME}"; then
  success "Update webhook service is running (port ${WEBHOOK_PORT})"
else
  warn "Update webhook service failed to start. Check: journalctl -u ${SERVICE_NAME}"
fi

# ── Wait for app ────────────────────────────────────────────────
echo ""
info "Waiting for Cairn to start..."
for i in {1..30}; do
  if docker compose exec -T app wget -qO- http://localhost:3000/api/version >/dev/null 2>&1; then
    break
  fi
  sleep 2
done
success "Cairn is running"

# ── Done ────────────────────────────────────────────────────────
PORT_NUM="${PORT:-411}"
SERVER_ADDR=$(grep '^NEXTAUTH_URL=' .env | sed 's|.*://||' | cut -d: -f1)

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""
success "Cairn is installed and running!"
echo ""
echo "  Open in browser:  http://${SERVER_ADDR}:${PORT_NUM}"
echo "  App logs:         docker compose logs -f app"
echo "  Update service:   systemctl status ${SERVICE_NAME}"
echo "  Manual update:    cd ${INSTALL_DIR} && ./update.sh"
echo ""
echo "  Your .env is at: ${INSTALL_DIR}/.env"
echo "  Keep it safe — it contains your database password and secrets."
echo ""
echo "═══════════════════════════════════════════════════════════════"
