const metrics = [
  { name: "Launch Readiness", value: 63, note: "Connect domain to unlock +12%" },
  { name: "Brand Consistency", value: 74, note: "Align CTA tone across pages" },
  { name: "SEO Readiness", value: 58, note: "Add metadata + FAQ schema" },
  { name: "Conversion Readiness", value: 49, note: "Improve hero CTA and social proof" },
];

export default function AnalyticsPage() {
  return (
    <div className="sp-grid">
      <section className="sp-card sp-col-12 sp-banner">
        <h2>Tenant Progress Analytics</h2>
        <p className="sp-muted">Business maturity scores with action-oriented recommendations.</p>
      </section>

      <section className="sp-card sp-col-12">
        <div className="sp-panel-head">
          <h2>Readiness Breakdown</h2>
          <span className="sp-pill">Business Track</span>
        </div>
        <div className="sp-metric-grid">
          {metrics.map((metric) => (
            <article key={metric.name} className="sp-metric">
              <div className="sp-metric-head">
                <h3>{metric.name}</h3>
                <strong>{metric.value}%</strong>
              </div>
              <div className="sp-progress">
                <span style={{ width: `${metric.value}%` }} />
              </div>
              <p>{metric.note}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
