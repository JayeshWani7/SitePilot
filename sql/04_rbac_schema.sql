-- Enhanced Authentication & RBAC Schema for Multi-Tenant System

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- User roles enum
CREATE TYPE user_role_type AS ENUM ('owner', 'administrator', 'editor', 'developer', 'viewer', 'super_admin');

-- Permission set enum
CREATE TYPE permission_action AS ENUM (
  'create_project',
  'edit_project',
  'delete_project',
  'manage_users',
  'manage_roles',
  'manage_domains',
  'view_analytics',
  'view_billing',
  'manage_billing',
  'invite_users',
  'view_usage',
  'edit_content',
  'publish_content',
  'manage_settings'
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  avatar_url TEXT,
  is_super_admin BOOLEAN DEFAULT FALSE,
  email_verified BOOLEAN DEFAULT FALSE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_super_admin ON users(is_super_admin);

-- Subscription plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  max_users INTEGER NOT NULL,
  max_projects INTEGER NOT NULL,
  max_domains INTEGER NOT NULL,
  max_traffic_gb INTEGER,
  features JSONB DEFAULT '{}',
  price_monthly DECIMAL(10, 2),
  price_annual DECIMAL(10, 2),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tenant subscriptions
CREATE TABLE IF NOT EXISTS tenant_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  status VARCHAR(50) DEFAULT 'active',
  current_period_start DATE NOT NULL,
  current_period_end DATE NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_tenant_id ON tenant_subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_status ON tenant_subscriptions(status);

-- Tenant members (users in tenants)
CREATE TABLE IF NOT EXISTS tenant_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role user_role_type NOT NULL DEFAULT 'viewer',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  removed_at TIMESTAMPTZ,
  UNIQUE(tenant_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_tenant_members_tenant_id ON tenant_members(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_members_user_id ON tenant_members(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_members_role ON tenant_members(role);

-- Role-based permissions mapping
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role user_role_type NOT NULL,
  permission permission_action NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(role, permission)
);

-- Usage metrics per tenant
CREATE TABLE IF NOT EXISTS usage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  metric_name VARCHAR(100) NOT NULL,
  metric_value INTEGER NOT NULL DEFAULT 0,
  metric_date DATE NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, metric_name, metric_date)
);

CREATE INDEX IF NOT EXISTS idx_usage_metrics_tenant_date ON usage_metrics(tenant_id, metric_date);
CREATE INDEX IF NOT EXISTS idx_usage_metrics_metric_name ON usage_metrics(metric_name);

-- Usage aggregate (daily summary)
CREATE TABLE IF NOT EXISTS usage_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  summary_date DATE NOT NULL,
  total_users INTEGER DEFAULT 0,
  total_projects INTEGER DEFAULT 0,
  total_requests INTEGER DEFAULT 0,
  api_calls INTEGER DEFAULT 0,
  storage_used_mb DECIMAL(10, 2) DEFAULT 0,
  bandwidth_used_gb DECIMAL(10, 2) DEFAULT 0,
  active_domains INTEGER DEFAULT 0,
  page_views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, summary_date)
);

CREATE INDEX IF NOT EXISTS idx_usage_summary_tenant ON usage_summary(tenant_id);
CREATE INDEX IF NOT EXISTS idx_usage_summary_date ON usage_summary(summary_date);

-- Usage alerts and warnings
CREATE TABLE IF NOT EXISTS usage_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  alert_type VARCHAR(50) NOT NULL,
  metric_name VARCHAR(100),
  current_value INTEGER,
  limit_value INTEGER,
  percentage DECIMAL(5, 2),
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usage_alerts_tenant ON usage_alerts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_usage_alerts_resolved ON usage_alerts(is_resolved);

-- Feature flags per tenant
CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  feature_name VARCHAR(100) NOT NULL,
  is_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, feature_name)
);

CREATE INDEX IF NOT EXISTS idx_feature_flags_tenant ON feature_flags(tenant_id);

-- Enable RLS on new tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
DROP POLICY IF EXISTS users_self_read ON users;
CREATE POLICY users_self_read ON users
FOR SELECT
USING (id = NULLIF(current_setting('app.user_id', true), '')::uuid 
  OR current_setting('app.is_super_admin', true) = 'true');

-- RLS Policies for tenant_subscriptions
DROP POLICY IF EXISTS tenant_subscriptions_isolation ON tenant_subscriptions;
CREATE POLICY tenant_subscriptions_isolation ON tenant_subscriptions
USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

-- RLS Policies for tenant_members
DROP POLICY IF EXISTS tenant_members_isolation ON tenant_members;
CREATE POLICY tenant_members_isolation ON tenant_members
USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

-- RLS Policies for usage metrics
DROP POLICY IF EXISTS usage_metrics_isolation ON usage_metrics;
CREATE POLICY usage_metrics_isolation ON usage_metrics
USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

-- RLS Policies for usage summary
DROP POLICY IF EXISTS usage_summary_isolation ON usage_summary;
CREATE POLICY usage_summary_isolation ON usage_summary
USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

-- RLS Policies for usage alerts
DROP POLICY IF EXISTS usage_alerts_isolation ON usage_alerts;
CREATE POLICY usage_alerts_isolation ON usage_alerts
USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

-- RLS Policies for feature flags
DROP POLICY IF EXISTS feature_flags_isolation ON feature_flags;
CREATE POLICY feature_flags_isolation ON feature_flags
USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

-- Role permissions for roles
DROP POLICY IF EXISTS role_permissions_read ON role_permissions;
CREATE POLICY role_permissions_read ON role_permissions
FOR SELECT
USING (true);

-- Grant permissions to app role
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO sitepilot_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON tenant_subscriptions TO sitepilot_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON tenant_members TO sitepilot_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON usage_metrics TO sitepilot_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON usage_summary TO sitepilot_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON usage_alerts TO sitepilot_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON feature_flags TO sitepilot_app;
GRANT SELECT ON role_permissions TO sitepilot_app;
GRANT SELECT ON subscription_plans TO sitepilot_app;
