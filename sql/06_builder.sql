-- Builder Pages & Version Control
-- Run after the existing migrations

CREATE TABLE IF NOT EXISTS builder_pages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id   UUID REFERENCES tenants(id) ON DELETE SET NULL,
  name        TEXT NOT NULL DEFAULT 'Untitled Page',
  elements    JSONB NOT NULL DEFAULT '[]',
  current_version INTEGER NOT NULL DEFAULT 1,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS builder_page_versions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id        UUID NOT NULL REFERENCES builder_pages(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  elements       JSONB NOT NULL,
  message        TEXT DEFAULT '',
  created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_builder_pages_user    ON builder_pages(user_id);
CREATE INDEX IF NOT EXISTS idx_builder_pages_tenant  ON builder_pages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_builder_versions_page ON builder_page_versions(page_id, version_number DESC);
