const express = require('express');
const { pool } = require('./db');
const { authenticate, withTenantContext, requirePermission } = require('./middleware');

const router = express.Router();

/**
 * POST /tenants/:tenantId/usage/track
 * Track a usage metric (called by background job or on event)
 */
router.post('/tenants/:tenantId/usage/track', authenticate, withTenantContext, async (req, res) => {
  try {
    const { metricName, value } = req.body;

    if (!metricName || value === undefined) {
      return res.status(400).json({ error: 'Metric name and value are required' });
    }

    // Insert or update usage metric for today
    await pool.query(
      `INSERT INTO usage_metrics (tenant_id, metric_name, metric_value, metric_date)
       VALUES ($1, $2, $3, CURRENT_DATE)
       ON CONFLICT (tenant_id, metric_name, metric_date)
       DO UPDATE SET metric_value = metric_value + $3`,
      [req.tenantId, metricName, value]
    );

    res.json({ message: 'Metric tracked' });
  } catch (error) {
    console.error('Track usage error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /tenants/:tenantId/usage/summary
 * Get usage summary for specified date range
 */
router.get('/tenants/:tenantId/usage/summary', authenticate, withTenantContext, requirePermission('view_usage'), async (req, res) => {
  try {
    const { startDate, endDate, period } = req.query;
    
    let query = 'SELECT * FROM usage_summary WHERE tenant_id = $1';
    const params = [req.tenantId];

    if (startDate && endDate) {
      query += ' AND summary_date BETWEEN $2 AND $3';
      params.push(startDate, endDate);
    } else if (period === 'last_7_days') {
      query += ' AND summary_date >= CURRENT_DATE - INTERVAL \'7 days\'';
    } else if (period === 'last_30_days') {
      query += ' AND summary_date >= CURRENT_DATE - INTERVAL \'30 days\'';
    } else {
      query += ' AND summary_date >= CURRENT_DATE - INTERVAL \'30 days\'';
    }

    query += ' ORDER BY summary_date DESC';

    const { rows: summary } = await pool.query(query, params);

    res.json(summary);
  } catch (error) {
    console.error('Get usage summary error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /tenants/:tenantId/usage/current
 * Get current usage statistics for today
 */
router.get('/tenants/:tenantId/usage/current', authenticate, withTenantContext, requirePermission('view_usage'), async (req, res) => {
  try {
    // Get today's usage summary
    const { rows: todaySummary } = await pool.query(
      'SELECT * FROM usage_summary WHERE tenant_id = $1 AND summary_date = CURRENT_DATE',
      [req.tenantId]
    );

    // Get subscription limits
    const { rows: subscription } = await pool.query(
      `SELECT sp.max_users, sp.max_projects, sp.max_domains, sp.max_traffic_gb, sp.features
       FROM tenant_subscriptions ts
       JOIN subscription_plans sp ON ts.plan_id = sp.id
       WHERE ts.tenant_id = $1 AND ts.status = 'active'`,
      [req.tenantId]
    );

    if (todaySummary.length === 0) {
      return res.json({
        usage: {
          total_users: 0,
          total_projects: 0,
          total_requests: 0,
          api_calls: 0,
          storage_used_mb: 0,
          bandwidth_used_gb: 0,
          active_domains: 0,
          page_views: 0,
          unique_visitors: 0,
        },
        limits: subscription.length > 0 ? subscription[0] : {},
        alerts: [],
      });
    }

    const usage = todaySummary[0];
    const limits = subscription[0] || {};

    // Get pending alerts
    const { rows: alerts } = await pool.query(
      'SELECT * FROM usage_alerts WHERE tenant_id = $1 AND is_resolved = false ORDER BY created_at DESC LIMIT 10',
      [req.tenantId]
    );

    res.json({
      usage: {
        total_users: usage.total_users,
        total_projects: usage.total_projects,
        total_requests: usage.total_requests,
        api_calls: usage.api_calls,
        storage_used_mb: usage.storage_used_mb,
        bandwidth_used_gb: usage.bandwidth_used_gb,
        active_domains: usage.active_domains,
        page_views: usage.page_views,
        unique_visitors: usage.unique_visitors,
      },
      limits,
      alerts,
    });
  } catch (error) {
    console.error('Get current usage error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /tenants/:tenantId/usage/breakdown
 * Get detailed usage breakdown by metric
 */
router.get('/tenants/:tenantId/usage/breakdown', authenticate, withTenantContext, requirePermission('view_usage'), async (req, res) => {
  try {
    const { metric, days = 30 } = req.query;

    let query = `SELECT metric_name, metric_date, metric_value
                 FROM usage_metrics
                 WHERE tenant_id = $1 AND metric_date >= CURRENT_DATE - INTERVAL '${parseInt(days)} days'`;
    const params = [req.tenantId];

    if (metric) {
      query += ' AND metric_name = $2';
      params.push(metric);
    }

    query += ' ORDER BY metric_date DESC, metric_name';

    const { rows: breakdown } = await pool.query(query, params);

    // Group by metric
    const grouped = {};
    breakdown.forEach((row) => {
      if (!grouped[row.metric_name]) {
        grouped[row.metric_name] = [];
      }
      grouped[row.metric_name].push({
        date: row.metric_date,
        value: row.metric_value,
      });
    });

    res.json(grouped);
  } catch (error) {
    console.error('Get usage breakdown error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /tenants/:tenantId/usage/alerts
 * Get usage alerts for tenant
 */
router.get('/tenants/:tenantId/usage/alerts', authenticate, withTenantContext, requirePermission('view_usage'), async (req, res) => {
  try {
    const { includeResolved = false } = req.query;

    let query = 'SELECT * FROM usage_alerts WHERE tenant_id = $1';
    const params = [req.tenantId];

    if (includeResolved === 'false') {
      query += ' AND is_resolved = false';
    }

    query += ' ORDER BY created_at DESC';

    const { rows: alerts } = await pool.query(query, params);

    res.json(alerts);
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /tenants/:tenantId/usage/alerts/:alertId/resolve
 * Mark alert as resolved
 */
router.put('/tenants/:tenantId/usage/alerts/:alertId/resolve', authenticate, withTenantContext, requirePermission('view_usage'), async (req, res) => {
  try {
    await pool.query(
      'UPDATE usage_alerts SET is_resolved = true, resolved_at = NOW() WHERE id = $1 AND tenant_id = $2',
      [req.params.alertId, req.tenantId]
    );

    res.json({ message: 'Alert resolved' });
  } catch (error) {
    console.error('Resolve alert error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /tenants/:tenantId/feature-flags
 * Get enabled features for tenant
 */
router.get('/tenants/:tenantId/feature-flags', authenticate, withTenantContext, async (req, res) => {
  try {
    const { rows: flags } = await pool.query(
      'SELECT feature_name, is_enabled FROM feature_flags WHERE tenant_id = $1 ORDER BY feature_name',
      [req.tenantId]
    );

    // Convert to object for easier client-side use
    const flagObj = {};
    flags.forEach((flag) => {
      flagObj[flag.feature_name] = flag.is_enabled;
    });

    res.json(flagObj);
  } catch (error) {
    console.error('Get feature flags error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /tenants/:tenantId/usage-suggestions
 * Get usage optimization suggestions based on usage patterns
 */
router.get('/tenants/:tenantId/usage-suggestions', authenticate, withTenantContext, requirePermission('view_usage'), async (req, res) => {
  try {
    const suggestions = [];

    // Get current usage and limits
    const { rows: usage } = await pool.query(
      `SELECT sp.max_users, sp.max_projects, sp.max_traffic_gb, ts.plan_id, sp.name as plan_name
       FROM tenant_subscriptions ts
       JOIN subscription_plans sp ON ts.plan_id = sp.id
       WHERE ts.tenant_id = $1 AND ts.status = 'active'`,
      [req.tenantId]
    );

    if (usage.length === 0) {
      return res.json(suggestions);
    }

    const plan = usage[0];
    const { rows: todayUsage } = await pool.query(
      'SELECT * FROM usage_summary WHERE tenant_id = $1 AND summary_date = CURRENT_DATE',
      [req.tenantId]
    );

    if (todayUsage.length === 0) {
      return res.json(suggestions);
    }

    const stats = todayUsage[0];

    // Check if approaching user limit
    if (plan.max_users && stats.total_users > plan.max_users * 0.8) {
      suggestions.push({
        type: 'upgrade',
        severity: 'high',
        message: `You're using ${Math.round((stats.total_users / plan.max_users) * 100)}% of your user limit. Consider upgrading.`,
        metric: 'users',
        current: stats.total_users,
        limit: plan.max_users,
      });
    }

    // Check if approaching project limit
    if (plan.max_projects && stats.total_projects > plan.max_projects * 0.8) {
      suggestions.push({
        type: 'upgrade',
        severity: 'high',
        message: `You're using ${Math.round((stats.total_projects / plan.max_projects) * 100)}% of your project limit. Consider upgrading.`,
        metric: 'projects',
        current: stats.total_projects,
        limit: plan.max_projects,
      });
    }

    // Check if approaching traffic limit
    if (plan.max_traffic_gb && stats.bandwidth_used_gb > plan.max_traffic_gb * 0.8) {
      suggestions.push({
        type: 'upgrade',
        severity: 'medium',
        message: `You're using ${Math.round((stats.bandwidth_used_gb / plan.max_traffic_gb) * 100)}% of your bandwidth limit.`,
        metric: 'bandwidth',
        current: stats.bandwidth_used_gb,
        limit: plan.max_traffic_gb,
      });
    }

    // Check for optimization opportunities
    if (stats.page_views > 0 && stats.unique_visitors > 0) {
      const bounceRate = 1 - stats.page_views / stats.unique_visitors;
      if (bounceRate > 0.8) {
        suggestions.push({
          type: 'optimization',
          severity: 'low',
          message: 'High bounce rate detected. Consider optimizing your landing pages.',
          metric: 'engagement',
        });
      }
    }

    res.json(suggestions);
  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
