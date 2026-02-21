const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const path = require('path');
const { withTenantClient } = require('./db');

const app = express();
app.use(express.json());

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, x-tenant-id');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.static(path.join(__dirname, '..', 'public')));

function tenantContext(req, res, next) {
  const tenantId = req.header('x-tenant-id');
  if (!tenantId) {
    return res.status(400).json({
      error: 'Missing x-tenant-id header',
    });
  }
  req.tenantId = tenantId;
  next();
}

app.get('/health', async (req, res) => {
  res.json({ ok: true });
});

app.post('/projects', tenantContext, async (req, res) => {
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

app.get('/projects', tenantContext, async (req, res) => {
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
