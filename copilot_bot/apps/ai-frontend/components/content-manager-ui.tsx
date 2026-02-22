"use client";

import { useState } from "react";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4001";

interface ComponentDefinition {
  type: string;
  props?: Record<string, any>;
}

interface PageDefinition {
  path: string;
  title: string;
  components: ComponentDefinition[];
}

interface NavigationLink {
  label: string;
  path: string;
}

interface GeneratedSite {
  navigation: NavigationLink[];
  pages: PageDefinition[];
  theme?: {
    primaryColor?: string;
    fontFamily?: string;
  };
}

export default function ContentManagerUi() {
  const [tenantContext, setTenantContext] = useState("We are a local bakery that sells handmade artisan bread and pastries.");
  const [requirements, setRequirements] = useState("I need a simple 3-page website. A Home page, an About Us page, and a Contact page with a gallery of our pastries.");
  const [maxPages, setMaxPages] = useState(3);
  const [isGenerating, setIsGenerating] = useState(false);
  const [siteData, setSiteData] = useState<GeneratedSite | null>(null);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError("");
    setSiteData(null);

    try {
      const response = await fetch(`${apiBaseUrl}/content-manager/generate-site`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          tenantContext,
          requirements,
          planLimits: {
            maxPages,
            allowedComponents: ["header", "text", "image", "gallery", "form", "footer", "hero", "features"]
          }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate site structure");
      }

      setSiteData(data);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="content-manager-ui">
      <header className="cm-header">
        <h1>SitePilot Content Manager</h1>
        <p>Generate structured website layouts dynamically based on user context and requirements.</p>
      </header>

      <div className="cm-layout">
        <aside className="cm-controls">
          <div className="cm-form-group">
            <label htmlFor="tenantContext">Tenant Context (Business Profile)</label>
            <textarea
              id="tenantContext"
              value={tenantContext}
              onChange={(e) => setTenantContext(e.target.value)}
              rows={4}
              placeholder="Describe the business..."
            />
          </div>

          <div className="cm-form-group">
            <label htmlFor="requirements">Website Requirements</label>
            <textarea
              id="requirements"
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              rows={4}
              placeholder="What pages and features are needed?"
            />
          </div>

          <div className="cm-form-group">
            <label htmlFor="maxPages">Plan Limit: Max Pages</label>
            <input
              type="number"
              id="maxPages"
              value={maxPages}
              onChange={(e) => setMaxPages(parseInt(e.target.value))}
              min={1}
              max={20}
            />
          </div>

          <button
            className="cm-btn-generate"
            onClick={handleGenerate}
            disabled={isGenerating || !requirements.trim()}
          >
            {isGenerating ? "Generating Site..." : "Generate Site Structure"}
          </button>

          {error && <div className="cm-error">{error}</div>}
        </aside>

        <main className="cm-preview">
          {!siteData && !isGenerating && (
            <div className="cm-empty-state">
              <p>Fill out the requirements and click generate to see the site structure.</p>
            </div>
          )}

          {isGenerating && (
            <div className="cm-loading-state">
              <div className="cm-spinner"></div>
              <p>AI is assembling your structured site...</p>
            </div>
          )}

          {siteData && (
            <div className="cm-results">
              <div className="cm-result-card theme-card">
                <h3>Global Theme</h3>
                <div className="cm-theme-info">
                  <div className="cm-color-swatch-container">
                    <span>Primary Color: </span>
                    <div 
                      className="cm-color-swatch" 
                      style={{ backgroundColor: siteData.theme?.primaryColor || '#cccccc' }}
                      title={siteData.theme?.primaryColor || 'Not specified'}
                    ></div>
                    <span className="cm-color-hex">{siteData.theme?.primaryColor || 'Not specified'}</span>
                  </div>
                  <div>Font Family: {siteData.theme?.fontFamily || 'Not specified'}</div>
                </div>
              </div>

              <div className="cm-result-card nav-card">
                <h3>Navigation structure</h3>
                <ul>
                  {siteData.navigation.map((nav, i) => (
                    <li key={i}>
                      <span className="nav-label">{nav.label}</span>
                      <span className="nav-path">{nav.path}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="cm-pages-list">
                <h3>Generated Pages ({siteData.pages.length})</h3>
                {siteData.pages.map((page, i) => (
                  <div key={i} className="cm-page-card">
                    <header className="cm-page-header">
                      <h4>{page.title}</h4>
                      <code className="cm-page-path">{page.path}</code>
                    </header>
                    <div className="cm-components-list">
                      <p className="cm-components-label">Components:</p>
                      <div className="cm-components-tags">
                        {page.components.map((comp, j) => (
                          <div key={j} className="cm-component-tag">
                            <span className="cm-comp-type">{comp.type}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="cm-result-card json-card">
                <h3>Raw JSON Structure</h3>
                <pre>{JSON.stringify(siteData, null, 2)}</pre>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
