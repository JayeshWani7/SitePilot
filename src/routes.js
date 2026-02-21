const express = require('express');
const { pool } = require('./db');
const { hashPassword, comparePassword, createToken } = require('./auth');
const { authenticate, withTenantContext, requireRole, requirePermission } = require('./middleware');

const router = express.Router();

/**
 * POST /auth/signup
 * Create new user account
 */
router.post('/signup', async (req, res) => {
  try {
    const { email, password, firstName, lastName, tenantName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const { rows: existingUsers } = await pool.query('SELECT id FROM users WHERE email = $1', [email]);

    if (existingUsers.length > 0) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const { rows: users } = await pool.query(
      'INSERT INTO users (email, password_hash, first_name, last_name) VALUES ($1, $2, $3, $4) RETURNING id, email, first_name, last_name',
      [email, passwordHash, firstName || null, lastName || null]
    );

    const user = users[0];

    // If tenant name provided, create new tenant and add user as owner
    let tenantId = null;
    if (tenantName) {
      const slug = tenantName.toLowerCase().replace(/\s+/g, '-');
      const { rows: tenants } = await pool.query(
        'INSERT INTO tenants (slug, display_name) VALUES ($1, $2) RETURNING id',
        [slug, tenantName]
      );
      tenantId = tenants[0].id;

      // Add user as tenant member with owner role
      await pool.query('INSERT INTO tenant_members (tenant_id, user_id, role) VALUES ($1, $2, $3)', [
        tenantId,
        user.id,
        'owner',
      ]);

      // Create subscription for tenant (free plan by default)
      const { rows: plans } = await pool.query("SELECT id FROM subscription_plans WHERE name = 'Free'");
      if (plans.length > 0) {
        await pool.query(
          'INSERT INTO tenant_subscriptions (tenant_id, plan_id, current_period_start, current_period_end) VALUES ($1, $2, CURRENT_DATE, CURRENT_DATE + INTERVAL \'30 days\')',
          [tenantId, plans[0].id]
        );
      }
    }

    // Create JWT token
    const token = createToken({ userId: user.id, email: user.email });

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
      },
      token,
      tenantId,
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /auth/login
 * Authenticate user and return JWT token
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user by email
    const { rows: users } = await pool.query(
      'SELECT id, email, password_hash, first_name, last_name, is_super_admin FROM users WHERE email = $1',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = users[0];

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Get user's tenants with subscription info
    const { rows: tenants } = await pool.query(
      `SELECT t.id, t.slug, t.display_name, tm.role,
              sp.name as subscription_plan, ts.status as subscription_status
       FROM tenant_members tm
       JOIN tenants t ON tm.tenant_id = t.id
       LEFT JOIN tenant_subscriptions ts ON t.id = ts.tenant_id
       LEFT JOIN subscription_plans sp ON ts.plan_id = sp.id
       WHERE tm.user_id = $1 AND tm.removed_at IS NULL`,
      [user.id]
    );

    // Create JWT token
    const token = createToken({
      userId: user.id,
      email: user.email,
      isSuperAdmin: user.is_super_admin,
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        isSuperAdmin: user.is_super_admin,
      },
      tenants,
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /auth/me
 * Get current user profile
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    const { rows: tenants } = await pool.query(
      `SELECT t.id, t.slug, t.display_name, tm.role,
              sp.name as subscription_plan, ts.status as subscription_status
       FROM tenant_members tm
       JOIN tenants t ON tm.tenant_id = t.id
       LEFT JOIN tenant_subscriptions ts ON t.id = ts.tenant_id
       LEFT JOIN subscription_plans sp ON ts.plan_id = sp.id
       WHERE tm.user_id = $1 AND tm.removed_at IS NULL`,
      [req.user.id]
    );

    res.json({
      user: req.user,
      tenants,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /tenants/:tenantId/members
 * Get tenant members with their roles
 */
router.get('/tenants/:tenantId/members', authenticate, withTenantContext, requireRole(['owner', 'administrator', 'editor', 'developer', 'viewer']), async (req, res) => {
  try {
    const { rows: members } = await pool.query(
      `SELECT tm.id, tm.user_id, u.email, u.first_name, u.last_name, 
              tm.role, tm.joined_at
       FROM tenant_members tm
       JOIN users u ON tm.user_id = u.id
       WHERE tm.tenant_id = $1 AND tm.removed_at IS NULL
       ORDER BY tm.joined_at DESC`,
      [req.tenantId]
    );

    res.json(members);
  } catch (error) {
    console.error('Get members error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /tenants/:tenantId/members
 * Add user to tenant
 */
router.post('/tenants/:tenantId/members', authenticate, withTenantContext, requireRole(['owner', 'administrator']), async (req, res) => {
  try {
    const { email, role } = req.body;

    if (!email || !role) {
      return res.status(400).json({ error: 'Email and role are required' });
    }

    // Validate role
    const validRoles = ['owner', 'administrator', 'editor', 'developer', 'viewer'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
    }

    // Find or create user
    let userId;
    const { rows: existingUsers } = await pool.query('SELECT id FROM users WHERE email = $1', [email]);

    if (existingUsers.length === 0) {
      // Create user with temporary password (user will reset on first login)
      const tempPassword = Math.random().toString(36).slice(-12);
      const passwordHash = await hashPassword(tempPassword);
      const { rows: newUsers } = await pool.query(
        'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
        [email, passwordHash]
      );
      userId = newUsers[0].id;
    } else {
      userId = existingUsers[0].id;
    }

    // Add or update user to tenant
    await pool.query(
      'INSERT INTO tenant_members (tenant_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT (tenant_id, user_id) DO UPDATE SET role = $3, removed_at = NULL',
      [req.tenantId, userId, role]
    );

    res.status(201).json({ message: 'User added to tenant successfully', userId });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /tenants/:tenantId/members/:memberId/role
 * Update user role in tenant
 */
router.put('/tenants/:tenantId/members/:memberId/role', authenticate, withTenantContext, requireRole(['owner', 'administrator']), async (req, res) => {
  try {
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({ error: 'Role is required' });
    }

    const validRoles = ['owner', 'administrator', 'editor', 'developer', 'viewer'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
    }

    await pool.query('UPDATE tenant_members SET role = $1 WHERE user_id = $2 AND tenant_id = $3 AND removed_at IS NULL', [
      role,
      req.params.memberId,
      req.tenantId,
    ]);

    res.json({ message: 'User role updated successfully' });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /tenants/:tenantId/members/:memberId
 * Remove user from tenant
 */
router.delete('/tenants/:tenantId/members/:memberId', authenticate, withTenantContext, requireRole(['owner', 'administrator']), async (req, res) => {
  try {
    await pool.query('UPDATE tenant_members SET removed_at = NOW() WHERE user_id = $1 AND tenant_id = $2', [
      req.params.memberId,
      req.tenantId,
    ]);

    res.json({ message: 'User removed from tenant' });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /tenants/:tenantId/subscription
 * Get tenant subscription details
 */
router.get('/tenants/:tenantId/subscription', authenticate, withTenantContext, async (req, res) => {
  try {
    const { rows: subscriptions } = await pool.query(
      `SELECT ts.*, sp.name, sp.description, sp.max_users, sp.max_projects, sp.max_domains, sp.max_traffic_gb, sp.features, sp.price_monthly
       FROM tenant_subscriptions ts
       JOIN subscription_plans sp ON ts.plan_id = sp.id
       WHERE ts.tenant_id = $1`,
      [req.tenantId]
    );

    if (subscriptions.length === 0) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    res.json(subscriptions[0]);
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /subscription-plans
 * Get available subscription plans
 */
router.get('/subscription-plans', authenticate, async (req, res) => {
  try {
    const { rows: plans } = await pool.query(
      'SELECT id, name, description, max_users, max_projects, max_domains, max_traffic_gb, features, price_monthly, price_annual FROM subscription_plans WHERE is_active = true ORDER BY price_monthly ASC NULLS LAST'
    );

    res.json(plans);
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
