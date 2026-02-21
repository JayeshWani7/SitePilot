export default function ProjectsPage() {
  const rows = [
    {
      label: "Schema & RLS",
      detail: "Pool model tables and strict row-level policies are active to isolate tenant data.",
    },
    {
      label: "Tenant Context",
      detail: "Every request carries x-tenant-id, then app.tenant_id is injected before queries.",
    },
    {
      label: "Project CRUD",
      detail: "Teams can create and list projects safely with no cross-tenant leakage.",
    },
  ];

  return (
    <div className="sp-grid">
      <section className="sp-card sp-col-12 sp-banner">
        <h2>Projects Center</h2>
        <p className="sp-muted">
          This module keeps your project operations simple: select tenant, create assets, and verify isolation.
        </p>
      </section>

      <section className="sp-card sp-col-12">
        <div className="sp-panel-head">
          <h2>Implementation Status</h2>
          <span className="sp-pill">Phase 1</span>
        </div>
        <div className="sp-kpi-grid">
          {rows.map((row) => (
            <article key={row.label} className="sp-kpi">
              <h3>{row.label}</h3>
              <p>{row.detail}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
