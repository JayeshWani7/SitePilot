-- Builder Project Deployments
-- Run after 07_builder_projects.sql

CREATE TABLE IF NOT EXISTS builder_deployments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID NOT NULL REFERENCES builder_projects(id) ON DELETE CASCADE,
  tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  subdomain      TEXT NOT NULL,           -- e.g. "myportfolio" → served at /sites/myportfolio/
  version_number INTEGER NOT NULL DEFAULT 1,
  is_live        BOOLEAN NOT NULL DEFAULT false,
  pages          JSONB NOT NULL DEFAULT '[]',   -- [{route, name, html}] snapshot at deploy time
  deployed_by    UUID REFERENCES users(id) ON DELETE SET NULL,
  deployed_at    TIMESTAMPTZ DEFAULT now()
);

-- Only one live version per project
CREATE UNIQUE INDEX IF NOT EXISTS idx_deployments_project_version
  ON builder_deployments(project_id, version_number);

-- Fast lookup for public serving
CREATE INDEX IF NOT EXISTS idx_deployments_subdomain_live
  ON builder_deployments(subdomain) WHERE is_live = true;
