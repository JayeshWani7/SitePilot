"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

interface UsageStats {
  total_users: number;
  total_projects: number;
  total_requests: number;
  api_calls: number;
  storage_used_mb: number;
  bandwidth_used_gb: number;
  active_domains: number;
  page_views: number;
  unique_visitors: number;
}

interface Limits {
  max_users: number;
  max_projects: number;
  max_domains: number;
  max_traffic_gb: number;
  features: Record<string, boolean>;
}

interface Alert {
  id: string;
  alert_type: string;
  metric_name: string;
  current_value: number;
  limit_value: number;
  percentage: number;
  is_resolved: boolean;
  created_at: string;
}

interface Suggestion {
  type: string;
  severity: string;
  message: string;
  metric?: string;
  current?: number;
  limit?: number;
}

export default function UsageDashboard() {
  const { currentTenant, token } = useAuth();
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [limits, setLimits] = useState<Limits | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

  useEffect(() => {
    if (!currentTenant || !token) return;
    fetchUsageData();
  }, [currentTenant, token]);

  const fetchUsageData = async () => {
    try {
      setLoading(true);
      setError(null);

      const headers = {
        Authorization: `Bearer ${token}`,
        "x-tenant-id": currentTenant!.id,
      };

      const usageRes = await fetch(
        `${API_BASE_URL}/usage/tenants/${currentTenant!.id}/usage/current`,
        { headers }
      );

      if (!usageRes.ok) throw new Error("Failed to fetch usage data");
      const usageData = await usageRes.json();
      setUsage(usageData.usage);
      setLimits(usageData.limits);
      setAlerts(usageData.alerts || []);

      const suggestionsRes = await fetch(
        `${API_BASE_URL}/usage/tenants/${currentTenant!.id}/usage-suggestions`,
        { headers }
      );
      if (suggestionsRes.ok) setSuggestions(await suggestionsRes.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load usage data");
    } finally {
      setLoading(false);
    }
  };

  const pct = (current: number, limit: number) =>
    limit > 0 ? Math.round((current / limit) * 100) : 0;

  const progressColor = (p: number) => {
    if (p >= 90) return "var(--danger)";
    if (p >= 70) return "#f4b942";
    return "var(--accent)";
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted)" }}>
        Loading usage data...
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="sp-card"
        style={{
          borderColor: "var(--danger)",
          background: "color-mix(in srgb, var(--danger) 10%, transparent)",
        }}
      >
        <p style={{ color: "var(--danger)", margin: 0 }}>{error}</p>
      </div>
    );
  }

  if (!usage || !limits) {
    return (
      <div className="sp-card" style={{ textAlign: "center", padding: 40 }}>
        <p style={{ color: "var(--text-muted)", margin: 0 }}>No usage data available yet.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 24 }}>
      {/* Active Alerts */}
      {alerts.filter((a) => !a.is_resolved).length > 0 && (
        <div>
          <h3 style={{ marginBottom: 12 }}>⚠ Active Alerts</h3>
          <div style={{ display: "grid", gap: 10 }}>
            {alerts
              .filter((a) => !a.is_resolved)
              .map((alert) => (
                <div
                  key={alert.id}
                  className="sp-card"
                  style={{
                    borderColor: "var(--danger)",
                    background: "color-mix(in srgb, var(--danger) 10%, transparent)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 600, color: "var(--danger)" }}>
                      {alert.alert_type.replace(/_/g, " ").toUpperCase()}
                    </span>
                    <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: "0.88rem" }}>
                      {alert.metric_name}: {alert.current_value} / {alert.limit_value}
                    </p>
                  </div>
                  <span
                    className="sp-pill"
                    style={{ borderColor: "var(--danger)", color: "var(--danger)" }}
                  >
                    {Math.round(alert.percentage)}%
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div>
          <h3 style={{ marginBottom: 12 }}>💡 Suggestions</h3>
          <div style={{ display: "grid", gap: 10 }}>
            {suggestions.map((s, i) => {
              const color =
                s.severity === "high"
                  ? "var(--danger)"
                  : s.severity === "medium"
                    ? "#f4b942"
                    : "var(--primary)";
              return (
                <div
                  key={i}
                  className="sp-card"
                  style={{
                    borderColor: `color-mix(in srgb, ${color} 50%, var(--border))`,
                    background: `color-mix(in srgb, ${color} 8%, transparent)`,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 12,
                  }}
                >
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, color }}>
                      {s.message}
                    </p>
                    {s.current != null && s.limit != null && (
                      <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: "var(--text-muted)" }}>
                        Current: {s.current} / Limit: {s.limit}
                      </p>
                    )}
                  </div>
                  <span
                    className="sp-pill"
                    style={{ borderColor: color, color, flexShrink: 0, textTransform: "capitalize" }}
                  >
                    {s.severity}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quota bars */}
      <div>
        <h3 style={{ marginBottom: 14 }}>Quota Usage</h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 14,
          }}
        >
          {[
            { label: "Team Members", current: usage.total_users, limit: limits.max_users },
            { label: "Projects", current: usage.total_projects, limit: limits.max_projects },
            { label: "Domains", current: usage.active_domains, limit: limits.max_domains },
            ...(limits.max_traffic_gb
              ? [{ label: "Bandwidth", current: usage.bandwidth_used_gb, limit: limits.max_traffic_gb, suffix: " GB" }]
              : []),
          ].map(({ label, current, limit, suffix }) => {
            const p = pct(current, limit);
            return (
              <div key={label} className="sp-metric">
                <div className="sp-metric-head">
                  <h3 style={{ fontSize: "0.88rem" }}>{label}</h3>
                  <span style={{ color: progressColor(p), fontWeight: 700, fontSize: "0.88rem" }}>
                    {p}%
                  </span>
                </div>
                <div className="sp-progress">
                  <span
                    style={{
                      width: `${Math.min(100, p)}%`,
                      background: `linear-gradient(90deg, ${progressColor(p)}, color-mix(in srgb, ${progressColor(p)} 70%, var(--accent)))`,
                    }}
                  />
                </div>
                <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  {typeof current === "number" ? current.toFixed(current % 1 === 0 ? 0 : 2) : current}
                  {suffix ?? ""} / {limit ?? "∞"}{suffix ?? ""}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Engagement KPIs */}
      <div>
        <h3 style={{ marginBottom: 14 }}>Today&apos;s Engagement</h3>
        <div className="sp-metric-grid">
          {[
            { label: "Page Views", value: usage.page_views.toLocaleString() },
            { label: "Unique Visitors", value: usage.unique_visitors.toLocaleString() },
            { label: "API Calls", value: usage.api_calls.toLocaleString() },
            { label: "Total Requests", value: usage.total_requests.toLocaleString() },
            { label: "Storage", value: `${usage.storage_used_mb.toFixed(1)} MB` },
          ].map((item) => (
            <article key={item.label} className="sp-metric">
              <h3 style={{ fontSize: "0.82rem" }}>{item.label}</h3>
              <p
                style={{
                  fontSize: "1.6rem",
                  fontWeight: 800,
                  color: "var(--text)",
                  margin: "4px 0 0",
                }}
              >
                {item.value}
              </p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
