"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import TenantUsersTable from "@/components/TenantUsersTable";
import UsageDashboard from "@/components/UsageDashboard";
import UsageAnalytics from "@/components/UsageAnalytics";
import UsageAlerts from "@/components/UsageAlerts";
import FeatureFlags from "@/components/FeatureFlags";
import SubscriptionPanel from "@/components/SubscriptionPanel";
import AdminTenantsTable from "@/components/AdminTenantsTable";

type Tab =
  | "overview"
  | "tenants"
  | "team"
  | "usage"
  | "analytics"
  | "alerts"
  | "flags"
  | "subscription";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "overview", label: "Overview", icon: "⌂" },
  { id: "tenants", label: "Tenants", icon: "🏢" },
  { id: "team", label: "Team", icon: "👥" },
  { id: "usage", label: "Usage", icon: "📊" },
  { id: "analytics", label: "Analytics", icon: "📈" },
  { id: "alerts", label: "Alerts", icon: "🔔" },
  { id: "flags", label: "Feature Flags", icon: "🚩" },
  { id: "subscription", label: "Subscription", icon: "💎" },
];

export default function DashboardPage() {
  const { user, currentTenant, logout, selectTenant, tenants } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <ProtectedRoute>
      <div style={{ minHeight: "100vh" }}>
        {/* Top Bar */}
        <div
          style={{
            borderBottom: "1px solid var(--border)",
            background: "color-mix(in srgb, var(--bg-elevated) 90%, transparent)",
            backdropFilter: "blur(10px)",
            position: "sticky",
            top: 0,
            zIndex: 50,
            padding: "0 24px",
          }}
        >
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            {/* Brand + user row */}
            <div
              className="sp-topbar"
              style={{ paddingTop: 14, paddingBottom: tenants.length > 1 ? 0 : 14 }}
            >
              <div className="sp-brand-wrap">
                <div className="sp-brand-dot" />
                <div>
                  <h1>SitePilot</h1>
                  {currentTenant && (
                    <p>
                      {currentTenant.display_name}
                      <span style={{ opacity: 0.5, margin: "0 6px" }}>·</span>
                      <span style={{ textTransform: "capitalize" }}>
                        {currentTenant.role}
                      </span>
                    </p>
                  )}
                </div>
              </div>
              <div className="sp-actions">
                {user && (
                  <div style={{ textAlign: "right", fontSize: "0.85rem" }}>
                    <p style={{ margin: 0, fontWeight: 600, color: "var(--text)" }}>
                      {user.firstName
                        ? `${user.firstName} ${user.lastName || ""}`
                        : user.email}
                    </p>
                    <p style={{ margin: 0, color: "var(--text-muted)" }}>{user.email}</p>
                  </div>
                )}
                <button className="sp-btn sp-ghost" style={{ fontSize: "0.85rem" }} onClick={handleLogout}>
                  Sign out
                </button>
              </div>
            </div>

            {/* Tenant picker */}
            {tenants.length > 1 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  paddingBottom: 12,
                  marginTop: -4,
                }}
              >
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  Switch:
                </span>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {tenants.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => selectTenant(t.id)}
                      style={{
                        padding: "3px 12px",
                        borderRadius: 999,
                        border: "1px solid",
                        fontSize: "0.8rem",
                        cursor: "pointer",
                        background:
                          currentTenant?.id === t.id
                            ? "color-mix(in srgb, var(--primary) 20%, transparent)"
                            : "transparent",
                        borderColor:
                          currentTenant?.id === t.id
                            ? "var(--primary)"
                            : "var(--border)",
                        color:
                          currentTenant?.id === t.id
                            ? "var(--text)"
                            : "var(--text-muted)",
                      }}
                    >
                      {t.display_name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Nav tabs — floating pill style */}
            <nav
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
                padding: "10px 0 12px",
                borderTop: "1px solid var(--border)",
              }}
            >
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: "6px 16px",
                    borderRadius: 999,
                    border: "1px solid",
                    fontSize: "0.84rem",
                    cursor: "pointer",
                    gap: 6,
                    display: "inline-flex",
                    alignItems: "center",
                    background:
                      activeTab === tab.id
                        ? "color-mix(in srgb, var(--primary) 22%, var(--surface))"
                        : "color-mix(in srgb, var(--surface) 60%, transparent)",
                    borderColor:
                      activeTab === tab.id ? "var(--primary)" : "var(--border)",
                    color:
                      activeTab === tab.id ? "var(--text)" : "var(--text-muted)",
                    fontWeight: activeTab === tab.id ? 600 : 400,
                    boxShadow:
                      activeTab === tab.id
                        ? "0 0 0 2px color-mix(in srgb, var(--primary) 20%, transparent)"
                        : "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main content */}
        <main style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 24px" }}>
          {/* ── OVERVIEW ─────────────────────────────────── */}
          {activeTab === "overview" && (
            <div style={{ display: "grid", gap: 20 }}>
              {/* Hero stats */}
              <div className="sp-card sp-hero">
                <div>
                  <span className="sp-eyebrow">SitePilot Dashboard</span>
                  <h2>
                    Welcome back
                    {user?.firstName ? `, ${user.firstName}` : ""}!
                  </h2>
                  <p className="sp-muted">
                    Manage your tenants, team members, subscriptions, and monitor
                    usage — all in one place.
                  </p>
                  <div className="sp-actions-row">
                    <button
                      className="sp-btn sp-primary"
                      onClick={() => setActiveTab("team")}
                    >
                      Manage Team
                    </button>
                    <button
                      className="sp-btn sp-ghost"
                      onClick={() => setActiveTab("usage")}
                    >
                      View Usage
                    </button>
                  </div>
                </div>
                <div className="sp-hero-stats">
                  <article>
                    <strong>{tenants.length}</strong>
                    <span>Tenants</span>
                  </article>
                  <article>
                    <strong style={{ textTransform: "capitalize" }}>
                      {currentTenant?.role || "—"}
                    </strong>
                    <span>Your Role</span>
                  </article>
                  <article>
                    <strong>
                      {currentTenant?.subscription_plan || "Free"}
                    </strong>
                    <span>Plan</span>
                  </article>
                </div>
              </div>

              {/* Quick actions */}
              <div className="sp-kpi-grid">
                {[
                  { icon: "🏢", label: "Tenants", desc: "View all your tenant memberships", tab: "tenants" as Tab },
                  { icon: "👥", label: "Team", desc: "Invite members and manage roles", tab: "team" as Tab },
                  { icon: "📊", label: "Live Usage", desc: "Real-time usage metrics", tab: "usage" as Tab },
                  { icon: "📈", label: "Analytics", desc: "Historical breakdown & charts", tab: "analytics" as Tab },
                  { icon: "🔔", label: "Alerts", desc: "Active and resolved alerts", tab: "alerts" as Tab },
                  { icon: "🚩", label: "Feature Flags", desc: "Enabled features for this tenant", tab: "flags" as Tab },
                  { icon: "💎", label: "Subscription", desc: "Current plan & upgrade options", tab: "subscription" as Tab },
                ].map((item) => (
                  <article
                    key={item.tab}
                    className="sp-kpi"
                    style={{ cursor: "pointer" }}
                    onClick={() => setActiveTab(item.tab)}
                  >
                    <span style={{ fontSize: "1.5rem" }}>{item.icon}</span>
                    <h3 style={{ margin: "8px 0 4px" }}>{item.label}</h3>
                    <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-muted)" }}>
                      {item.desc}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          )}

          {/* ── TENANTS ───────────────────────────────────── */}
          {activeTab === "tenants" && <AdminTenantsTable />}

          {/* ── TEAM ──────────────────────────────────────── */}
          {activeTab === "team" && <TenantUsersTable />}

          {/* ── USAGE ─────────────────────────────────────── */}
          {activeTab === "usage" && <UsageDashboard />}

          {/* ── ANALYTICS ─────────────────────────────────── */}
          {activeTab === "analytics" && <UsageAnalytics />}

          {/* ── ALERTS ────────────────────────────────────── */}
          {activeTab === "alerts" && <UsageAlerts />}

          {/* ── FEATURE FLAGS ─────────────────────────────── */}
          {activeTab === "flags" && <FeatureFlags />}

          {/* ── SUBSCRIPTION ──────────────────────────────── */}
          {activeTab === "subscription" && <SubscriptionPanel />}
        </main>
      </div>
    </ProtectedRoute>
  );
}
