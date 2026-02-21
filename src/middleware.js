const { pool } = require('./db');
const { extractTokenFromHeader, verifyToken } = require('./auth');

/**
 * Authentication middleware - Verifies JWT token and loads user context
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return res.status(401).json({ error: 'Missing authorization token' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Load user from database
    const { rows } = await pool.query(
      'SELECT id, email, first_name, last_name, is_super_admin, last_login_at FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = rows[0];
    
    // Update last login
    await pool.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      isSuperAdmin: user.is_super_admin,
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

/**
 * Tenant context middleware - Ensures user has access to the tenant
 */
async function withTenantContext(req, res, next) {
  try {
    const tenantId = req.headers['x-tenant-id'] || req.body?.tenantId || req.query?.tenantId;

    if (!tenantId) {
      return res.status(400).json({ error: 'Missing tenant ID' });
    }

    // Super admin bypass
    if (req.user?.isSuperAdmin) {
      req.tenantId = tenantId;
      return next();
    }

    // Check if user is a member of this tenant
    const { rows } = await pool.query(
      'SELECT role FROM tenant_members WHERE user_id = $1 AND tenant_id = $2 AND removed_at IS NULL',
      [req.user.id, tenantId]
    );

    if (rows.length === 0) {
      return res.status(403).json({ error: 'Access denied to this tenant' });
    }

    req.tenantId = tenantId;
    req.userRole = rows[0].role;
    next();
  } catch (error) {
    console.error('Tenant context error:', error);
    res.status(500).json({ error: 'Tenant access check failed' });
  }
}

/**
 * Check if user has required role in tenant
 */
function requireRole(allowedRoles) {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.tenantId) {
        return res.status(401).json({ error: 'Authentication and tenant context required' });
      }

      // Super admin bypass
      if (req.user.isSuperAdmin) {
        return next();
      }

      // Get user role for this tenant
      const { rows } = await pool.query(
        'SELECT role FROM tenant_members WHERE user_id = $1 AND tenant_id = $2 AND removed_at IS NULL',
        [req.user.id, req.tenantId]
      );

      if (rows.length === 0) {
        return res.status(403).json({ error: 'User not a member of this tenant' });
      }

      const userRole = rows[0].role;
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({ error: `Requires one of these roles: ${allowedRoles.join(', ')}` });
      }

      req.userRole = userRole;
      next();
    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({ error: 'Role check failed' });
    }
  };
}

/**
 * Check if user has required permission in tenant
 */
function requirePermission(requiredPermission) {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.tenantId) {
        return res.status(401).json({ error: 'Authentication and tenant context required' });
      }

      // Super admin bypass
      if (req.user.isSuperAdmin) {
        return next();
      }

      // Get user role
      const { rows: userRows } = await pool.query(
        'SELECT role FROM tenant_members WHERE user_id = $1 AND tenant_id = $2 AND removed_at IS NULL',
        [req.user.id, req.tenantId]
      );

      if (userRows.length === 0) {
        return res.status(403).json({ error: 'User not a member of this tenant' });
      }

      const userRole = userRows[0].role;

      // Check if role has this permission
      const { rows: permRows } = await pool.query(
        'SELECT permission FROM role_permissions WHERE role = $1 AND permission = $2',
        [userRole, requiredPermission]
      );

      if (permRows.length === 0) {
        return res.status(403).json({ error: `Permission denied: ${requiredPermission}` });
      }

      req.userRole = userRole;
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ error: 'Permission check failed' });
    }
  };
}

module.exports = {
  authenticate,
  withTenantContext,
  requireRole,
  requirePermission,
};
