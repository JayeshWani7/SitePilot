#!/usr/bin/env node

/**
 * Database Setup Script
 * Executes SQL files to initialize schema and seed data
 */

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(status, message) {
  const symbol = status === '✓' ? colors.green + '✓' : status === '✗' ? colors.red + '✗' : colors.blue + 'ℹ';
  console.log(`${symbol}${colors.reset} ${message}`);
}

function header(text) {
  console.log(`\n${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.blue}${text}${colors.reset}`);
  console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
}

async function executeSQLFile(filePath) {
  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    await pool.query(sql);
    return true;
  } catch (error) {
    console.error(`Error executing ${filePath}:`, error.message);
    return false;
  }
}

async function main() {
  header('SitePilot Database Setup');

  try {
    // Test connection
    await pool.connect();
    log('✓', 'Connected to database');

    header('Applying SQL Files');

    const sqlDir = path.join(__dirname, '..', 'sql');
    const sqlFiles = [
      '01_init.sql',
      '02_seed.sql',
      '03_demo_rls.sql',
      '04_rbac_schema.sql',
      '05_rbac_seed.sql',
    ];

    for (const file of sqlFiles) {
      const filePath = path.join(sqlDir, file);
      if (fs.existsSync(filePath)) {
        const success = await executeSQLFile(filePath);
        if (success) {
          log('✓', `Executed: ${file}`);
        } else {
          log('✗', `Failed: ${file}`);
        }
      } else {
        log('⊘', `Skipped: ${file} (not found)`);
      }
    }

    header('Setup Complete!');
    log('✓', 'Database schema and seed data have been applied');
  } catch (error) {
    log('✗', `Setup failed: ${error.message}`);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
