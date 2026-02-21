#!/usr/bin/env node

/**
 * Database Setup Verification Script
 * Checks connection, schema, RLS policies, and seed data
 */

require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
};

function log(status, message) {
  const symbol = status === "✓" ? colors.green + "✓" : status === "✗" ? colors.red + "✗" : colors.blue + "ℹ";
  console.log(`${symbol}${colors.reset} ${message}`);
}

function header(text) {
  console.log(`\n${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.blue}${text}${colors.reset}`);
  console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
}

async function checkConnection() {
  header("1. Database Connection");
  try {
    const client = await pool.connect();
    const result = await client.query("SELECT NOW()");
    client.release();
    log("✓", `Connected to database: ${result.rows[0]}`);
    return true;
  } catch (error) {
    log("✗", `Connection failed: ${error.message}`);
    return false;
  }
}

async function checkTables() {
  header("2. Schema Tables");
  const tables = ["tenants", "projects"];
  let allExists = true;

  try {
    for (const table of tables) {
      const result = await pool.query(
        `SELECT to_regclass('public.${table}')::oid`
      );
      if (result.rows[0].to_regclass) {
        log("✓", `Table "${table}" exists`);
      } else {
        log("✗", `Table "${table}" does not exist`);
        allExists = false;
      }
    }
  } catch (error) {
    log("✗", `Error checking tables: ${error.message}`);
    allExists = false;
  }

  return allExists;
}

async function checkColumns() {
  header("3. Table Columns");
  const schema = {
    tenants: ["id", "slug", "display_name", "created_at"],
    projects: ["id", "tenant_id", "name", "created_at"],
  };

  let allCorrect = true;

  try {
    for (const [table, expectedCols] of Object.entries(schema)) {
      const result = await pool.query(
        `SELECT column_name FROM information_schema.columns 
         WHERE table_name = $1 AND table_schema = 'public'
         ORDER BY ordinal_position`,
        [table]
      );

      const actualCols = result.rows.map((r) => r.column_name);
      const missing = expectedCols.filter((col) => !actualCols.includes(col));
      const extra = actualCols.filter((col) => !expectedCols.includes(col));

      if (missing.length === 0 && extra.length === 0) {
        log("✓", `Table "${table}" columns are correct`);
      } else {
        if (missing.length > 0) {
          log("✗", `Table "${table}" missing: ${missing.join(", ")}`);
        }
        if (extra.length > 0) {
          log("ℹ", `Table "${table}" has extra: ${extra.join(", ")}`);
        }
        allCorrect = false;
      }
    }
  } catch (error) {
    log("✗", `Error checking columns: ${error.message}`);
    allCorrect = false;
  }

  return allCorrect;
}

async function checkRLS() {
  header("4. Row Level Security (RLS)");
  const tables = ["tenants", "projects"];
  let allEnabled = true;

  try {
    for (const table of tables) {
      const result = await pool.query(
        `SELECT relrowsecurity FROM pg_class 
         WHERE relname = $1 AND relkind = 'r'`,
        [table]
      );

      if (result.rows.length > 0 && result.rows[0].relrowsecurity) {
        log("✓", `RLS enabled on "${table}"`);
      } else {
        log("✗", `RLS disabled on "${table}"`);
        allEnabled = false;
      }
    }
  } catch (error) {
    log("✗", `Error checking RLS: ${error.message}`);
    allEnabled = false;
  }

  return allEnabled;
}

async function checkPolicies() {
  header("5. RLS Policies");
  const tables = ["tenants", "projects"];
  let allHavePolicies = true;

  try {
    for (const table of tables) {
      const result = await pool.query(
        `SELECT policyname FROM pg_policies 
         WHERE tablename = $1 AND schemaname = 'public'`,
        [table]
      );

      if (result.rows.length > 0) {
        const policies = result.rows.map((p) => p.policyname);
        log("✓", `${policies.length} policy/ies on "${table}": ${policies.join(", ")}`);
      } else {
        log("✗", `No policies on "${table}"`);
        allHavePolicies = false;
      }
    }
  } catch (error) {
    log("✗", `Error checking policies: ${error.message}`);
    allHavePolicies = false;
  }

  return allHavePolicies;
}

async function checkData() {
  header("6. Seed Data");
  let allDataExists = true;

  try {
    const tenantResult = await pool.query("SELECT COUNT(*) as count FROM tenants");
    const projectResult = await pool.query(
      "SELECT COUNT(*) as count FROM projects"
    );

    const tenantCount = parseInt(tenantResult.rows[0].count);
    const projectCount = parseInt(projectResult.rows[0].count);

    if (tenantCount > 0) {
      log("✓", `${tenantCount} tenant(s) in database`);
      // Show tenant details
      const details = await pool.query(
        "SELECT id, display_name FROM tenants ORDER BY created_at"
      );
      details.rows.forEach((t) => {
        log("ℹ", `  - ${t.display_name} (${t.id})`);
      });
    } else {
      log("✗", "No tenants found");
      allDataExists = false;
    }

    if (projectCount > 0) {
      log("✓", `${projectCount} project(s) in database`);
    } else {
      log("ℹ", "No projects yet (this is ok, create them first)");
    }
  } catch (error) {
    log("✗", `Error checking data: ${error.message}`);
    allDataExists = false;
  }

  return allDataExists;
}

async function checkApiEndpoints() {
  header("7. API Connectivity");

  try {
    const response = await fetch("http://localhost:3000/health");
    if (response.ok) {
      const data = await response.json();
      if (data.ok) {
        log("✓", "API /health endpoint responding");
      } else {
        log("✗", "API /health returned unhealthy status");
      }
    } else {
      log("ℹ", `API responded with status ${response.status} (backend might not be running)`);
    }
  } catch (error) {
    log("ℹ", `API not reachable: ${error.message}`);
  }
}

async function main() {
  console.log(`\n${colors.blue}${colors.blue}SitePilot Database Verification${colors.reset}\n`);

  const checks = [
    { name: "Connection", fn: checkConnection },
    { name: "Tables", fn: checkTables },
    { name: "Columns", fn: checkColumns },
    { name: "RLS", fn: checkRLS },
    { name: "Policies", fn: checkPolicies },
    { name: "Seed Data", fn: checkData },
  ];

  const results = {};
  for (const check of checks) {
    results[check.name] = await check.fn();
  }

  await checkApiEndpoints();

  header("Summary");
  let allPassed = true;
  for (const [name, passed] of Object.entries(results)) {
    const status = passed ? "✓" : "✗";
    const color = passed ? colors.green : colors.red;
    console.log(`${color}${status}${colors.reset} ${name}`);
    if (!passed) allPassed = false;
  }

  console.log();

  if (allPassed) {
    console.log(
      `${colors.green}✓ Database is fully configured and ready!${colors.reset}\n`
    );
    process.exit(0);
  } else {
    console.log(
      `${colors.yellow}⚠ Some checks failed. Review errors above.${colors.reset}`
    );
    console.log(`${colors.yellow}To fix: Run 'npm run setup:db' to initialize schema and seed data.${colors.reset}\n`);
    process.exit(1);
  }
}

pool.on("error", (err) => {
  log("✗", `Pool error: ${err.message}`);
  process.exit(1);
});

main().catch((error) => {
  log("✗", `Fatal error: ${error.message}`);
  process.exit(1);
});
