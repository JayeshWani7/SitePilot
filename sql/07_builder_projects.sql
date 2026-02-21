-- Project-Based Builder Pages
-- Run after 06_builder.sql

-- Projects table (one project = one website)
CREATE TABLE IF NOT EXISTS builder_projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT DEFAULT '',
  min_role    TEXT NOT NULL DEFAULT 'viewer',
  created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Add project FK, page route, and min_role to existing pages table
ALTER TABLE builder_pages
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES builder_projects(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS route      TEXT NOT NULL DEFAULT '/',
  ADD COLUMN IF NOT EXISTS min_role   TEXT NOT NULL DEFAULT 'viewer';

CREATE INDEX IF NOT EXISTS idx_builder_projects_tenant ON builder_projects(tenant_id);
CREATE INDEX IF NOT EXISTS idx_builder_pages_project   ON builder_pages(project_id);
