"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

import ProtectedRoute from "@/components/ProtectedRoute";
import TenantUsersTable from "@/components/TenantUsersTable";
import UsageDashboard from "@/components/UsageDashboard";
import UsageAnalytics from "@/components/UsageAnalytics";
import UsageAlerts from "@/components/UsageAlerts";
import FeatureFlags from "@/components/FeatureFlags";
import SubscriptionPanel from "@/components/SubscriptionPanel";
import AdminTenantsTable from "@/components/AdminTenantsTable";

type Role = "owner" | "administrator" | "editor" | "developer" | "viewer";
type Tab =
  | "overview"
  | "tenants"
  | "team"
  | "usage"
  | "analytics"
  | "alerts"
  | "flags"
  | "subscription";

// Role hierarchy — higher index = more permissions
const ROLE_LEVEL: Record<string, number> = {
  viewer: 1,
  developer: 2,
  editor: 3,
  administrator: 4,
  owner: 5,
};

function hasLevel(role: string | undefined, min: number) {
  return (ROLE_LEVEL[role ?? ""] ?? 0) >= min;
}

interface TabDef {
  id: Tab;
  label: string;
  icon: string;
  minLevel: number; // minimum role level required to see this tab
  desc: string;
}

const ALL_TABS: TabDef[] = [
  { id: "overview", label: "Overview", icon: "⌂", minLevel: 1, desc: "Your workspace at a glance" },
  { id: "tenants", label: "Tenants", icon: "🏢", minLevel: 4, desc: "Manage all tenant memberships" },
  { id: "team", label: "Team", icon: "👥", minLevel: 1, desc: "View team members and roles" },
  { id: "usage", label: "Usage", icon: "📊", minLevel: 2, desc: "Real-time resource metrics" },
  { id: "analytics", label: "Analytics", icon: "📈", minLevel: 2, desc: "Historical analytics charts" },
  { id: "alerts", label: "Alerts", icon: "🔔", minLevel: 3, desc: "Usage alerts and warnings" },
  { id: "flags", label: "Feature Flags", icon: "🚩", minLevel: 4, desc: "Enable / disable features" },
  { id: "subscription", label: "Subscription", icon: "💎", minLevel: 5, desc: "Plan and billing (owner only)" },
];

export default function DashboardPage() {
  const { user, currentTenant, selectTenant, tenants } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const myLevel = ROLE_LEVEL[currentTenant?.role ?? ""] ?? 0;
  const visibleTabs = ALL_TABS.filter((t) => myLevel >= t.minLevel);
  const safeTab = visibleTabs.find((t) => t.id === activeTab) ? activeTab : "overview";


  return (
    <ProtectedRoute>
      <div style={{ minHeight: "100vh" }}>

        {/* ── Workspace sticky sub-header ────────────────────────────── */}
        <div style={{
          borderBottom: "1px solid var(--border)",
          background: "color-mix(in srgb, var(--bg-elevated) 90%, transparent)",
          backdropFilter: "blur(10px)",
          position: "sticky", top: 96, zIndex: 40, padding: "0 24px",
        }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>

            {/* Workspace context row */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0 6px", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {currentTenant && (
                  <>
                    <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>Workspace:</span>
                    <span style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--text)" }}>{currentTenant.display_name}</span>
                    <RoleBadge role={currentTenant.role as Role} />
                  </>
                )}
              </div>
              {/* Tenant switcher inline */}
              {tenants.length > 1 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Switch:</span>
                  {tenants.map((t) => (
                    <button key={t.id} onClick={() => selectTenant(t.id)} style={{
                      padding: "2px 10px", borderRadius: 999, border: "1px solid", fontSize: "0.78rem", cursor: "pointer",
                      background: currentTenant?.id === t.id ? "color-mix(in srgb, var(--primary) 20%, transparent)" : "transparent",
                      borderColor: currentTenant?.id === t.id ? "var(--primary)" : "var(--border)",
                      color: currentTenant?.id === t.id ? "var(--text)" : "var(--text-muted)",
                    }}>{t.display_name}</button>
                  ))}
                </div>
              )}
            </div>

            {/* Tab nav — role-filtered */}
            <nav style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "6px 0 10px", borderTop: "1px solid var(--border)" }}>
              {visibleTabs.map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                  padding: "6px 16px", borderRadius: 999, border: "1px solid", fontSize: "0.84rem",
                  cursor: "pointer", gap: 6, display: "inline-flex", alignItems: "center",
                  background: safeTab === tab.id ? "color-mix(in srgb, var(--primary) 22%, var(--surface))" : "color-mix(in srgb, var(--surface) 60%, transparent)",
                  borderColor: safeTab === tab.id ? "var(--primary)" : "var(--border)",
                  color: safeTab === tab.id ? "var(--text)" : "var(--text-muted)",
                  fontWeight: safeTab === tab.id ? 600 : 400,
                  boxShadow: safeTab === tab.id ? "0 0 0 2px color-mix(in srgb, var(--primary) 20%, transparent)" : "none",
                  transition: "all 0.15s ease",
                }}>
                  <span>{tab.icon}</span>{tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main content */}
        <main style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 24px" }}>
          {safeTab === "overview" && (
            <div style={{ display: "grid", gap: 20 }}>
              {/* Role-aware hero */}
              <div className="sp-card sp-hero">
                <div>
                  <span className="sp-eyebrow">SitePilot Dashboard</span>
                  <h2>Welcome back{user?.firstName ? `, ${user.firstName}` : ""}!</h2>
                  <p className="sp-muted">
                    {myLevel >= 5
                      ? "You have full admin access — manage billing, users, tenants, and settings."
                      : myLevel >= 4
                        ? "You can manage users, roles, and feature flags for this workspace."
                        : myLevel >= 3
                          ? "You can create content, manage projects, and view alerts."
                          : myLevel >= 2
                            ? "You can view usage metrics and analytics."
                            : "You have read-only access to team and projects."}
                  </p>
                  <div className="sp-actions-row">
                    {myLevel >= 4 && (
                      <button className="sp-btn sp-primary" onClick={() => setActiveTab("team")}>Manage Team</button>
                    )}
                    {myLevel >= 2 && (
                      <button className="sp-btn sp-ghost" onClick={() => setActiveTab("usage")}>View Usage</button>
                    )}
                    {myLevel === 1 && (
                      <button className="sp-btn sp-ghost" onClick={() => setActiveTab("team")}>View Team</button>
                    )}
                  </div>
                </div>
                <div className="sp-hero-stats">
                  <article>
                    <strong>{tenants.length}</strong>
                    <span>Tenants</span>
                  </article>
                  <article>
                    <strong style={{ textTransform: "capitalize" }}>{currentTenant?.role || "—"}</strong>
                    <span>Your Role</span>
                  </article>
                  <article>
                    <strong>L{myLevel}</strong>
                    <span>Access Level</span>
                  </article>
                </div>
              </div>

              {/* Quick links — filtered by level */}
              <div className="sp-kpi-grid">
                {visibleTabs.filter((t) => t.id !== "overview").map((item) => (
                  <article key={item.id} className="sp-kpi" style={{ cursor: "pointer" }} onClick={() => setActiveTab(item.id)}>
                    <span style={{ fontSize: "1.5rem" }}>{item.icon}</span>
                    <h3 style={{ margin: "8px 0 4px" }}>{item.label}</h3>
                    <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-muted)" }}>{item.desc}</p>
                  </article>
                ))}
              </div>
            </div>
          )}

          {safeTab === "tenants" && myLevel >= 4 && <AdminTenantsTable />}
          {safeTab === "team" && <TenantUsersTable />}
          {safeTab === "usage" && myLevel >= 2 && <UsageDashboard />}
          {safeTab === "analytics" && myLevel >= 2 && <UsageAnalytics />}
          {safeTab === "alerts" && myLevel >= 3 && <UsageAlerts />}
          {safeTab === "flags" && myLevel >= 4 && <FeatureFlags />}
          {safeTab === "subscription" && myLevel >= 5 && <SubscriptionPanel />}
        </main>
      </div>
    </ProtectedRoute>
  );
}

// ── Role badge component ────────────────────────────────────────────────
const ROLE_COLORS: Record<string, string> = {
  owner: "#f4b942",
  administrator: "var(--primary)",
  editor: "var(--accent)",
  developer: "#a78bfa",
  viewer: "var(--text-muted)",
};

function RoleBadge({ role }: { role: Role }) {
  const color = ROLE_COLORS[role] ?? "var(--text-muted)";
  return (
    <span style={{
      display: "inline-block",
      padding: "1px 8px",
      borderRadius: 999,
      fontSize: "0.75rem",
      fontWeight: 700,
      textTransform: "capitalize",
      color,
      border: `1px solid ${color}`,
      background: `color-mix(in srgb, ${color} 15%, transparent)`,
      marginLeft: 2,
    }}>
      {role}
    </span>
  );
}
