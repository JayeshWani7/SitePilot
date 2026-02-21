-- Seed default roles and permissions

-- Insert subscription plans
INSERT INTO subscription_plans (name, description, max_users, max_projects, max_domains, max_traffic_gb, features, price_monthly, price_annual, is_active)
VALUES
  ('Free', 'Free plan for getting started', 1, 3, 1, 5, '{"analytics": false, "team_collaboration": false, "api_access": false, "custom_domain": false}'::jsonb, 0, 0, TRUE),
  ('Starter', 'Starter plan for growing websites', 3, 10, 1, 50, '{"analytics": true, "team_collaboration": false, "api_access": false, "custom_domain": false}'::jsonb, 29.99, 299.99, TRUE),
  ('Pro', 'Professional plan with team features', 10, 50, 5, 500, '{"analytics": true, "team_collaboration": true, "api_access": true, "custom_domain": true}'::jsonb, 99.99, 999.99, TRUE),
  ('Enterprise', 'Enterprise plan with unlimited resources', 999, 999, 999, 9999, '{"analytics": true, "team_collaboration": true, "api_access": true, "custom_domain": true, "priority_support": true, "sso": true}'::jsonb, NULL, NULL, TRUE)
ON CONFLICT (name) DO NOTHING;

-- Insert default role permissions
INSERT INTO role_permissions (role, permission) VALUES
-- Owner - full access
('owner', 'create_project'),
('owner', 'edit_project'),
('owner', 'delete_project'),
('owner', 'manage_users'),
('owner', 'manage_roles'),
('owner', 'manage_domains'),
('owner', 'view_analytics'),
('owner', 'view_billing'),
('owner', 'manage_billing'),
('owner', 'invite_users'),
('owner', 'view_usage'),
('owner', 'edit_content'),
('owner', 'publish_content'),
('owner', 'manage_settings'),

-- Administrator - most access except billing
('administrator', 'create_project'),
('administrator', 'edit_project'),
('administrator', 'delete_project'),
('administrator', 'manage_users'),
('administrator', 'manage_roles'),
('administrator', 'manage_domains'),
('administrator', 'view_analytics'),
('administrator', 'view_billing'),
('administrator', 'invite_users'),
('administrator', 'view_usage'),
('administrator', 'edit_content'),
('administrator', 'publish_content'),
('administrator', 'manage_settings'),

-- Editor - content and project management
('editor', 'create_project'),
('editor', 'edit_project'),
('editor', 'view_analytics'),
('editor', 'edit_content'),
('editor', 'publish_content'),
('editor', 'view_usage'),

-- Developer - development and API access
('developer', 'create_project'),
('developer', 'edit_project'),
('developer', 'view_analytics'),
('developer', 'view_usage'),
('developer', 'edit_content'),

-- Viewer - read-only access
('viewer', 'view_analytics'),
('viewer', 'view_usage'),

-- Super admin - full system access
('super_admin', 'create_project'),
('super_admin', 'edit_project'),
('super_admin', 'delete_project'),
('super_admin', 'manage_users'),
('super_admin', 'manage_roles'),
('super_admin', 'manage_domains'),
('super_admin', 'view_analytics'),
('super_admin', 'view_billing'),
('super_admin', 'manage_billing'),
('super_admin', 'invite_users'),
('super_admin', 'view_usage'),
('super_admin', 'edit_content'),
('super_admin', 'publish_content'),
('super_admin', 'manage_settings')
ON CONFLICT (role, permission) DO NOTHING;
