# Cairn

K-12 IT asset inventory and device management system. Track devices, manage repair tickets, run kiosk check-out/check-in, generate reports, and manage district users — all self-hosted with Docker.

---

## Features

- **Asset inventory** — track devices by asset tag, serial number, condition, building, and room
- **Repair tickets** — log issues, attach photos, track parts used and time spent
- **Kiosk mode** — barcode-scanner-friendly Check Out, Check In, and Rapid Enrollment flows
- **Reports** — 9 report types with PDF export (assets by model, person, building, repair history, reconciliation, and more)
- **User management** — local Staff/Student roster with CSV import; no Google account required
- **Parts inventory** — track on-hand parts with low-stock alerts; compatible part filtering by manufacturer/model
- **District theming** — customizable app name and color scheme per district
- **Safe updates** — Prisma Migrate ensures schema changes never destroy existing data

---

## Requirements

- Docker + Docker Compose (Linux recommended for production)
- A server or VM with a public or LAN IP

---

## Installation

```bash
git clone https://github.com/TemporalFixation/cairn.git
cd cairn
cp .env.example .env
```

Edit `.env` and fill in:

```env
DB_PASSWORD=        # strong random string: openssl rand -base64 24
NEXTAUTH_URL=       # full URL to this server, e.g. http://192.168.1.50:411
NEXTAUTH_SECRET=    # strong random string: openssl rand -base64 32
GITHUB_REPO=TemporalFixation/cairn   # enables in-app update checker
```

Then start:

```bash
docker compose up -d
docker compose logs -f app
```

On first run the terminal prints a generated admin password:

```
╔════════════════════════════════════════════════════════╗
║  ⚠  CAIRN — FIRST RUN ADMIN PASSWORD                  ║
╠════════════════════════════════════════════════════════╣
║  Password: xK9!mPqR3nLw7vBt                            ║
║                                                        ║
║  You will be asked to change this on first login.      ║
╚════════════════════════════════════════════════════════╝
```

The app is available at `http://your-server-ip:411`.

---

## Updating

```bash
./update.sh
```

This backs up the database, pulls the latest code, rebuilds the image, and restarts. Your data is never touched — only application code changes. New schema columns are applied automatically via Prisma Migrate.

To create a manual database backup at any time:

```bash
docker exec cairn-db-1 pg_dump -U k12user k12inventory > backup.sql
```

---

## Adding a New Schema Field

When adding a column to `prisma/schema.prisma`, generate a migration on your dev machine (with the DB running):

```bash
npx prisma migrate dev --name describe_your_change
```

Commit the generated file in `prisma/migrations/`. On the next `./update.sh`, it applies automatically.

> New columns must be nullable or have a default — this guarantees zero data loss.

---

## Tech Stack

- [Next.js 14](https://nextjs.org) (App Router)
- [Prisma 7](https://www.prisma.io) with PostgreSQL
- [Auth.js / next-auth v5](https://authjs.dev) — credentials-based login, no OAuth required
- [shadcn/ui](https://ui.shadcn.com) + Tailwind CSS
- Docker + nginx reverse proxy

---

## License

MIT
