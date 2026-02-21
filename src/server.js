const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const path = require('path');
const { withTenantClient } = require('./db');
const authRoutes = require('./routes');
const usageRoutes = require('./usage-routes');
const { authenticate, withTenantContext, requirePermission } = require('./middleware');

const app = express();
app.use(express.json());

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, x-tenant-id, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.static(path.join(__dirname, '..', 'public')));

// Auth routes (no authentication required)
app.use('/auth', authRoutes);

// Usage routes (authentication required)
app.use('/usage', usageRoutes);

app.get('/health', async (req, res) => {
  res.json({ ok: true });
});

// Protected routes - require authentication and tenant access
app.post('/projects', authenticate, withTenantContext, requirePermission('create_project'), async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'name is required' });
  }

  try {
    const project = await withTenantClient(req.tenantId, async (client) => {
      const result = await client.query(
        'INSERT INTO projects (tenant_id, name) VALUES ($1, $2) RETURNING id, tenant_id, name, created_at',
        [req.tenantId, name]
      );
      return result.rows[0];
    });
    res.status(201).json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/projects', authenticate, withTenantContext, async (req, res) => {
  try {
    const projects = await withTenantClient(req.tenantId, async (client) => {
      const result = await client.query(
        'SELECT id, tenant_id, name, created_at FROM projects ORDER BY created_at DESC'
      );
      return result.rows;
    });
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error.message);
    res.status(500).json({ error: error.message });
  }
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  console.log(`Database: ${process.env.DATABASE_URL ? 'Configured' : 'Not configured'}`);
});
