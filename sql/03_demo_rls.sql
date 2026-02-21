-- Run as sitepilot_app user to prove no data leakage.
-- Tenant ALPHA session
SELECT set_config('app.tenant_id', '11111111-1111-1111-1111-111111111111', true);
INSERT INTO projects (tenant_id, name) VALUES ('11111111-1111-1111-1111-111111111111', 'Alpha Landing Page');
SELECT tenant_id, name FROM projects ORDER BY created_at DESC;

-- Tenant BETA session
SELECT set_config('app.tenant_id', '22222222-2222-2222-2222-222222222222', true);
INSERT INTO projects (tenant_id, name) VALUES ('22222222-2222-2222-2222-222222222222', 'Beta Pricing Refresh');
SELECT tenant_id, name FROM projects ORDER BY created_at DESC;

-- Switch back to ALPHA: should not see Beta row
SELECT set_config('app.tenant_id', '11111111-1111-1111-1111-111111111111', true);
SELECT tenant_id, name FROM projects ORDER BY created_at DESC;
