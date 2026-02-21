const decisions = [
  {
    action: "Homepage Hero Rewrite",
    reason: "Conversion intent low on first scroll",
    status: "Approved",
  },
  {
    action: "Pricing Block Reorder",
    reason: "High exits before FAQ section",
    status: "Pending",
  },
  {
    action: "Structured Data Injection",
    reason: "Competitor schema coverage higher",
    status: "Rejected",
  },
];

export default function GovernancePage() {
  return (
    <div className="sp-grid">
      <section className="sp-card sp-col-12 sp-banner">
        <h2>AI Governance & Explainability</h2>
        <p className="sp-muted">
          Keep every autonomous suggestion auditable with rationale, approval history, and transparent outcomes.
        </p>
      </section>

      <section className="sp-card sp-col-12">
        <div className="sp-panel-head">
          <h2>Decision Log</h2>
          <span className="sp-pill">Enterprise Signal</span>
        </div>

        <div className="sp-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Decision</th>
                <th>Reason</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {decisions.map((item) => (
                <tr key={item.action}>
                  <td>{item.action}</td>
                  <td>{item.reason}</td>
                  <td>{item.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
