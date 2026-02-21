"use client";

import { FormEvent, useMemo, useState } from "react";

type Project = {
  id: string;
  tenant_id: string;
  name: string;
  created_at: string;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

export default function DashboardPage() {
  const [tenantPreset, setTenantPreset] = useState("11111111-1111-1111-1111-111111111111");
  const [tenantId, setTenantId] = useState("11111111-1111-1111-1111-111111111111");
  const [projectName, setProjectName] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [status, setStatus] = useState("Ready.");
  const [loading, setLoading] = useState(false);
  const [showTips, setShowTips] = useState(true);

  const lifecycleState = useMemo(() => {
    if (projects.length === 0) return 2;
    if (projects.length === 1) return 3;
    if (projects.length === 2) return 4;
    return 5;
  }, [projects.length]);

  const stages = [
    "Onboarding",
    "Draft",
    "Brand Setup",
    "Content Ready",
    "Domain Live",
    "Traffic Growth",
    "Optimization",
    "Monetization",
  ];

  const headers = {
    "x-tenant-id": tenantId,
    "Content-Type": "application/json",
  };

  async function fetchProjects() {
    if (!tenantId) {
      setStatus("Tenant ID is required.");
      return;
    }

    try {
      setLoading(true);
      setStatus("Fetching projects...");
      const response = await fetch(`${API_BASE_URL}/projects`, { headers });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}. Is the backend running on ${API_BASE_URL}?`);
      }
      
      const payload = await response.json();
      setProjects(payload);
      setStatus(`✓ Loaded ${payload.length} project(s) for tenant ${tenantId}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Fetch failed.";
      setStatus(`✗ ${message}`);
    } finally {
      setLoading(false);
    }
  }

  async function createProject(event: FormEvent) {
    event.preventDefault();
    if (!projectName.trim()) {
      setStatus("Project name is required.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/projects`, {
        method: "POST",
        headers,
        body: JSON.stringify({ name: projectName.trim() }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Failed to create project.");
      setProjectName("");
      setStatus(`✓ Project "${payload.name}" created.`);
      await fetchProjects();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Create failed.");
      setLoading(false);
    }
  }

  async function healthCheck() {
    try {
      setStatus("Checking API health...");
      const response = await fetch(`${API_BASE_URL}/health`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}. Is the backend running on ${API_BASE_URL}?`);
      }
      
      const payload = await response.json();
      if (!payload.ok) throw new Error("API returned unhealthy status.");
      setStatus("✓ API is healthy and connected.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Health check failed.";
      setStatus(`✗ ${message}`);
    }
  }

  return (
    <div className="sp-grid">
      <section className="sp-card sp-col-12 sp-hero">
        <div>
          <span className="sp-eyebrow">SitePilot Workspace</span>
          <h2>Build, launch, and grow your website with AI-guided momentum.</h2>
          <p className="sp-muted">
            Manage tenants, create projects, and track lifecycle progress in one place with enterprise-ready
            isolation and explainable AI workflows.
          </p>
          <div className="sp-actions-row">
            <button className="sp-btn sp-primary" onClick={fetchProjects} disabled={loading}>
              Sync Tenant Data
            </button>
            <button className="sp-btn sp-ghost" onClick={healthCheck}>
              Check API Status
            </button>
          </div>
        </div>
        <div className="sp-hero-stats">
          <article>
            <strong>{projects.length}</strong>
            <span>Projects</span>
          </article>
          <article>
            <strong>{stages.length}</strong>
            <span>Lifecycle Stages</span>
          </article>
          <article>
            <strong>{tenantId ? "Active" : "Missing"}</strong>
            <span>Tenant Context</span>
          </article>
        </div>
      </section>

      <section className="sp-card sp-col-6">
        <h2>Tenant Context</h2>
        <p className="sp-muted">Switch tenant and verify strict RLS behavior with project visibility.</p>

        <div className="sp-field-grid">
          <label>
            <span>Tenant</span>
            <select
              value={tenantPreset}
              onChange={(e) => {
                const value = e.target.value;
                setTenantPreset(value);
                if (value !== "custom") setTenantId(value);
                if (value === "custom") setTenantId("");
              }}
            >
              <option value="11111111-1111-1111-1111-111111111111">Alpha Studio</option>
              <option value="22222222-2222-2222-2222-222222222222">Beta Ventures</option>
              <option value="custom">Custom</option>
            </select>
          </label>

          <label>
            <span>Tenant ID</span>
            <input value={tenantId} onChange={(e) => setTenantId(e.target.value)} />
          </label>
        </div>

        <div className="sp-actions-row">
          <button className="sp-btn sp-secondary" onClick={fetchProjects} disabled={loading}>
            Refresh Projects
          </button>
          <button className="sp-btn sp-ghost" onClick={healthCheck}>
            Health Check
          </button>
        </div>

        <div className="sp-status">{status}</div>
      </section>

      <section className="sp-card sp-col-6">
        <h2>Create Project</h2>
        <p className="sp-muted">Create project rows under current tenant context.</p>
        <form onSubmit={createProject} className="sp-form">
          <label>
            <span>Project Name</span>
            <input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g. AI Landing Revamp"
            />
          </label>
          <div className="sp-form-actions">
            <button className="sp-btn sp-primary" type="submit" disabled={loading}>
              Create Project
            </button>
            <button
              className="sp-btn sp-ghost sp-btn-sm"
              type="button"
              onClick={() => setProjectName("")}
              disabled={loading || !projectName.trim()}
            >
              Clear
            </button>
          </div>
        </form>
      </section>

      <section className="sp-card sp-col-12">
        <div className="sp-panel-head">
          <h2>Assistant Guidance</h2>
          <button className="sp-btn sp-ghost" onClick={() => setShowTips((prev) => !prev)}>
            {showTips ? "Hide Tips" : "Show Tips"}
          </button>
        </div>
        {showTips ? (
          <div className="sp-kpi-grid">
            <article className="sp-kpi">
              <h3>Next Best Action</h3>
              <p>After project creation, connect your domain to unlock the Domain Live stage.</p>
            </article>
            <article className="sp-kpi">
              <h3>Conversion Tip</h3>
              <p>Keep hero CTA and pricing CTA message consistent to reduce user drop-off.</p>
            </article>
            <article className="sp-kpi">
              <h3>Operational Tip</h3>
              <p>Use tenant presets while demoing to prove isolation in under 20 seconds.</p>
            </article>
          </div>
        ) : (
          <p className="sp-muted">Tips are hidden. Toggle them back on for guided actions.</p>
        )}
      </section>

      <section className="sp-card sp-col-12">
        <div className="sp-panel-head">
          <h2>Projects</h2>
          <span className="sp-pill">{projects.length} item(s)</span>
        </div>

        <div className="sp-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Tenant ID</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {projects.length === 0 ? (
                <tr>
                  <td colSpan={3}>No projects yet for this tenant.</td>
                </tr>
              ) : (
                projects.map((project) => (
                  <tr key={project.id}>
                    <td>{project.name}</td>
                    <td>{project.tenant_id}</td>
                    <td>{new Date(project.created_at).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="sp-card sp-col-12">
        <div className="sp-panel-head">
          <h2>Lifecycle Preview</h2>
          <span className="sp-pill">Phase 3 Teaser</span>
        </div>

        <ol className="sp-lifecycle">
          {stages.map((stage, index) => (
            <li
              key={stage}
              className={index < lifecycleState ? "complete" : index === lifecycleState ? "active" : ""}
            >
              {stage}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
