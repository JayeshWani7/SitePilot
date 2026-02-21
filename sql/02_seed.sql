INSERT INTO tenants (id, slug, display_name)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'alpha', 'Alpha Studio'),
  ('22222222-2222-2222-2222-222222222222', 'beta', 'Beta Ventures')
ON CONFLICT (slug) DO NOTHING;
