# SitePilot - Phase 1 (Core Backbone)

This repo implements the **Phase 1 hackathon backbone**:

- Multi-tenant **pool model** (shared DB, shared tables)
- PostgreSQL **RLS** for hard tenant isolation
- Per-request **tenant context injection** (`app.tenant_id`)
- Single application DB role (`sitepilot_app`)
- Interactive **web dashboard** with tenant switching and project actions
- **Multi-theme support** (3 dark themes + 1 light theme)

## 1) Prerequisites

- Node.js 18+
- PostgreSQL 14+

## 2) Install and configure

1. Install dependencies:

```powershell
npm install
```

2. Copy env file:

```powershell
Copy-Item .env.example .env
```

3. Create database (example):

```sql
CREATE DATABASE sitepilot;
```

## 3) Apply DB setup

Run SQL scripts in order:

1. `sql/01_init.sql`
2. `sql/02_seed.sql`

These scripts create:

- `tenants` table
- `projects` table
- RLS policies based on `current_setting('app.tenant_id', true)`
- app role `sitepilot_app`

### Using the setup and check scripts

**Option A: Automatic setup (recommended)**

Initialize the entire database schema and seed data in one command:

```powershell
npm run setup:db
```

This runs all SQL files in order:
1. `sql/01_init.sql` - Creates schema, RLS policies, roles
2. `sql/02_seed.sql` - Seeds test tenants (Alpha, Beta)
3. `sql/03_demo_rls.sql` - Applies additional verification

**Option B: Manual SQL execution**

Run each SQL file manually using your PostgreSQL client:

```sql
psql -U postgres -f sql/01_init.sql
psql -U postgres -f sql/02_seed.sql
psql -U postgres -f sql/03_demo_rls.sql
```

### Verify database setup

After setup, check if everything is configured correctly:

```powershell
npm run check:db
```

This validates:
- ✓ Database connection
- ✓ Required tables exist
- ✓ Correct columns in each table
- ✓ RLS is enabled
- ✓ RLS policies are in place
- ✓ Seed data exists
- ✓ API connectivity

## 4) Start the API

```powershell
npm run dev
```

Then open:

- `http://localhost:3000`

The backend now serves the full interactive frontend from `public/`.

API endpoints:

- `GET /health`
- `POST /projects` (requires header `x-tenant-id`)
- `GET /projects` (requires header `x-tenant-id`)

## Frontend highlights

- Tenant selector + custom tenant input
- Create project and live project listing
- Health check action
- Lifecycle preview panel
- Theme switcher with persisted preference (`localStorage`)

## Next.js TypeScript Frontend (new)

A dedicated Next.js + TypeScript app is scaffolded at `frontend/` using `npx create-next-app`.

Run it locally:

```powershell
cd frontend
Copy-Item .env.example .env.local
npm run dev:3001
```

Open:

- `http://localhost:3001`

The frontend calls the backend API using:

- `NEXT_PUBLIC_API_BASE_URL=http://localhost:3000`

Useful scripts:

- `npm run dev`
- `npm run dev:3001`
- `npm run build`
- `npm run start`
- `npm run start:3001`
- `npm run lint`

## Run both apps correctly

From repo root:

- **Both API + Web together**: `npm run dev:all` (recommended for development)
- API only (Express): `npm run dev:api`
- Web only (Next): `npm run dev:web`

This uses `concurrently` to launch both servers at the same time:
- API will be on `http://localhost:3000`
- Web will be on `http://localhost:3001`

Important:

- Do **not** run `node db.js` or `node server.js` inside `frontend/`.
- Backend files are in `src/`, so root command is `node src/server.js` (or `npm run dev:api`).
- If you are inside `frontend/`, go back to root first: `cd ..`
## 5) Isolation demo (two tenants)

Seeded tenants:

- Alpha: `11111111-1111-1111-1111-111111111111`
- Beta: `22222222-2222-2222-2222-222222222222`

### Create data as Alpha

```powershell
curl -Method POST http://localhost:3000/projects `
  -Headers @{"x-tenant-id"="11111111-1111-1111-1111-111111111111";"Content-Type"="application/json"} `
  -Body '{"name":"Alpha Homepage"}'
```

### Create data as Beta

```powershell
curl -Method POST http://localhost:3000/projects `
  -Headers @{"x-tenant-id"="22222222-2222-2222-2222-222222222222";"Content-Type"="application/json"} `
  -Body '{"name":"Beta Launch Site"}'
```

### Query each tenant separately

```powershell
curl -Method GET http://localhost:3000/projects -Headers @{"x-tenant-id"="11111111-1111-1111-1111-111111111111"}
curl -Method GET http://localhost:3000/projects -Headers @{"x-tenant-id"="22222222-2222-2222-2222-222222222222"}
```

Each tenant only sees its own rows, enforced by DB-level RLS.

## 6) Optional direct SQL verification

Run `sql/03_demo_rls.sql` as `sitepilot_app` to verify isolation directly in PostgreSQL sessions.
