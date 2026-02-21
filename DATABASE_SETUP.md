# Database Setup Utilities

This document explains the database verification and setup scripts created for SitePilot Phase 1.

## Quick Start

```powershell
# 1. Make sure your DATABASE_URL is set in .env
# 2. Setup database schema and seed data
npm run setup:db

# 3. Verify everything is configured correctly
npm run check:db

# 4. Start the development servers
npm run dev:all
```

## Available Commands

### `npm run check:db`

**Purpose:** Verify the database is properly configured

**What it checks:**
1. Database connection and accessibility
2. All required tables exist (tenants, projects)
3. Tables have correct columns
4. Row Level Security (RLS) is enabled
5. RLS policies are in place
6. Test data (tenants) have been seeded
7. Backend API is responding

**Output:**
```
SitePilot Database Verification

1. Database Connection
✓ Connected to database: 2026-02-21T10:30:45.123Z

2. Schema Tables
✓ Table "tenants" exists
✓ Table "projects" exists

3. Table Columns
✓ Table "tenants" columns are correct
✓ Table "projects" columns are correct

4. Row Level Security (RLS)
✓ RLS enabled on "tenants"
✓ RLS enabled on "projects"

5. RLS Policies
✓ 1 policy/ies on "tenants": tenants_isolation
✓ 1 policy/ies on "projects": projects_isolation

6. Seed Data
✓ 2 tenant(s) in database
  - Alpha Studio (11111111-1111-1111-1111-111111111111)
  - Beta Ventures (22222222-2222-2222-2222-222222222222)
✓ 0 project(s) in database (this is ok, create them first)

7. API Connectivity
✓ API /health endpoint responding

Summary
✓ Connection
✓ Tables
✓ Columns
✓ RLS
✓ Policies
✓ Seed Data

✓ Database is fully configured and ready!
```

### `npm run setup:db`

**Purpose:** Initialize database schema and seed test data

**What it does:**
1. Executes `sql/01_init.sql` - Creates tables and RLS policies
2. Executes `sql/02_seed.sql` - Creates test tenants (Alpha, Beta)
3. Executes `sql/03_demo_rls.sql` - Applies verification scenarios

**When to use:**
- Initial database setup
- Resetting to a clean state with test data
- Rebuilding after schema changes

**Example:**
```powershell
$ npm run setup:db

SitePilot Database Setup

Applying SQL Files
✓ Executed: 01_init.sql
✓ Executed: 02_seed.sql
✓ Executed: 03_demo_rls.sql

Summary
✓ Database setup completed successfully!
Run: npm run check:db
```

## Database Configuration

### Environment Variables

The scripts read from `.env`:

```dotenv
PORT=3000
DATABASE_URL="postgresql://postgres:Colders%232026@db.gkdotivesljxsjzpbyai.supabase.co:5432/postgres"
```

**Important:** 
- Special characters in passwords must be URL-encoded (e.g., `#` → `%23`)
- Wrap the full URL in quotes to prevent issues with special characters
- Both scripts automatically handle SSL connections for cloud databases (Supabase, Railway, Heroku)

### Connection Pooling

Both scripts use PostgreSQL connection pooling via the `pg` library:
- Automatic SSL support for cloud databases
- Configurable pool size
- Connection reuse for better performance

## Implementation Details

### `src/check-db.js`

A comprehensive verification utility with:
- Color-coded output (✓ green for pass, ✗ red for fail)
- Parallel verification of all database components
- Detailed error messages
- Exit code 0 on success, 1 on failure (useful for CI/CD)

### `src/setup-db.js`

A safe database initialization tool with:
- SQL file validation before execution
- Transaction support
- Clear progress reporting
- Automatic SSL handling

### `src/db.js` (Updated)

Backend database connection now includes:
- SSL configuration for cloud databases
- Tenant context injection via `app.tenant_id`
- Transaction support with RLS enforcement

## Troubleshooting

### "Invalid URL" error

**Cause:** DATABASE_URL contains special characters that aren't properly quoted or encoded

**Solution:** 
1. Check that DATABASE_URL is wrapped in quotes
2. URL-encode special characters: `#` → `%23`, `@` → `%40`, etc.

```dotenv
# ❌ Wrong
DATABASE_URL=postgresql://user:pass#word@host/db

# ✓ Correct
DATABASE_URL="postgresql://user:pass%23word@host/db"
```

### "ENOTFOUND" error

**Cause:** Database server is unreachable (network issue or wrong host)

**Solutions:**
1. Verify DATABASE_URL is correct
2. Check network connectivity
3. Confirm database server is running
4. For cloud databases, check firewall rules and IP allowlists

### "getaddrinfo" error

**Cause:** DNS resolution failed for the database host

**Solutions:**
1. Verify the hostname in DATABASE_URL
2. Check internet connectivity
3. For cloud databases (Supabase), verify the region is set correctly

### Tables don't exist after setup:db

**Cause:** 
1. SQL files weren't executed
2. Wrong database user/permissions
3. Setup failed silently

**Solution:**
1. Run `npm run check:db` to see detailed errors
2. Review `.env` and DATABASE_URL
3. Verify the database user has CREATE TABLE permissions
4. Check database server logs for constraint violations

## Integration with Backend

The backend API uses these components:

```javascript
// src/db.js - Connection with tenant context
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // For cloud databases
});

async function withTenantClient(tenantId, callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `SELECT set_config('app.tenant_id', $1, true)`,
      [tenantId]
    );
    return await callback(client);
  } finally {
    await client.query('ROLLBACK');
    client.release();
  }
}
```

This ensures:
1. Every database operation runs in a transaction
2. `app.tenant_id` is set before each query
3. RLS policies automatically filter results
4. Transaction rolls back if an error occurs

## Next Steps

1. **Setup:** `npm run setup:db` - Initialize database
2. **Verify:** `npm run check:db` - Confirm everything works
3. **Develop:** `npm run dev:all` - Start API + Frontend
4. **Test:** Use the web dashboard to create projects
5. **Isolate:** Switch tenants to verify RLS isolation

## Scripts Location

- `src/check-db.js` - Database verification utility
- `src/setup-db.js` - Database initialization utility
- `src/db.js` - Backend database connection (updated with SSL)
- `src/server.js` - Express API server
- `sql/01_init.sql` - Schema and RLS policies
- `sql/02_seed.sql` - Test data
- `sql/03_demo_rls.sql` - RLS verification scenarios
