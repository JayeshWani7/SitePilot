const stages = [
  { name: "Onboarding", status: "complete", hint: "Business brief captured" },
  { name: "Draft", status: "complete", hint: "Initial site generated" },
  { name: "Brand Setup", status: "active", hint: "Add logo, colors, voice" },
  { name: "Content Ready", status: "pending", hint: "Connect product and proof points" },
  { name: "Domain Live", status: "pending", hint: "Map DNS and SSL" },
  { name: "Traffic Growth", status: "pending", hint: "SEO baseline and content engine" },
  { name: "Optimization", status: "pending", hint: "A/B tests and conversion loops" },
  { name: "Monetization", status: "pending", hint: "Checkout and funnels" },
];

export default function LifecyclePage() {
  return (
    <div className="sp-grid">
      <section className="sp-card sp-col-12 sp-banner">
        <h2>Business Lifecycle Intelligence</h2>
        <p className="sp-muted">
          Track each tenant from onboarding to monetization with event-driven state transitions.
        </p>
      </section>

      <section className="sp-card sp-col-12">
        <div className="sp-panel-head">
          <h2>Lifecycle Timeline</h2>
          <span className="sp-pill">Centerpiece</span>
        </div>
        <div className="sp-stage-grid">
          {stages.map((stage) => (
            <article key={stage.name} className={`sp-stage ${stage.status}`}>
              <h3>{stage.name}</h3>
              <p>{stage.hint}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
