"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

interface SummaryRow {
    summary_date: string;
    total_users: number;
    total_projects: number;
    total_requests: number;
    api_calls: number;
    storage_used_mb: number;
    bandwidth_used_gb: number;
    page_views: number;
    unique_visitors: number;
}

interface BreakdownData {
    [metric: string]: { date: string; value: number }[];
}

const METRIC_LABELS: Record<string, string> = {
    api_calls: "API Calls",
    page_views: "Page Views",
    unique_visitors: "Unique Visitors",
    storage_used_mb: "Storage (MB)",
    bandwidth_used_gb: "Bandwidth (GB)",
    total_requests: "Total Requests",
};

function MiniBarChart({ data }: { data: { date: string; value: number }[] }) {
    if (!data || data.length === 0) return <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No data</p>;
    const maxVal = Math.max(...data.map((d) => d.value), 1);
    const recent = data.slice(0, 14).reverse(); // last 14 days

    return (
        <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 48, marginTop: 8 }}>
            {recent.map((d, i) => {
                const pct = (d.value / maxVal) * 100;
                return (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div
                            title={`${new Date(d.date).toLocaleDateString()}: ${d.value}`}
                            style={{
                                width: "100%",
                                height: `${Math.max(4, pct)}%`,
                                background: `linear-gradient(180deg, var(--primary), var(--accent))`,
                                borderRadius: "3px 3px 0 0",
                                minHeight: 4,
                                cursor: "pointer",
                                transition: "opacity 0.2s",
                            }}
                        />
                    </div>
                );
            })}
        </div>
    );
}

export default function UsageAnalytics() {
    const { currentTenant, token } = useAuth();
    const [summary, setSummary] = useState<SummaryRow[]>([]);
    const [breakdown, setBreakdown] = useState<BreakdownData>({});
    const [period, setPeriod] = useState<"last_7_days" | "last_30_days">("last_30_days");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

    useEffect(() => {
        if (!currentTenant || !token) return;
        fetchData();
    }, [currentTenant, token, period]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        const headers = {
            Authorization: `Bearer ${token}`,
            "x-tenant-id": currentTenant!.id,
        };
        const days = period === "last_7_days" ? 7 : 30;
        try {
            const [summRes, breakRes] = await Promise.all([
                fetch(`${API_BASE_URL}/usage/tenants/${currentTenant!.id}/usage/summary?period=${period}`, { headers }),
                fetch(`${API_BASE_URL}/usage/tenants/${currentTenant!.id}/usage/breakdown?days=${days}`, { headers }),
            ]);

            if (summRes.ok) setSummary(await summRes.json());
            if (breakRes.ok) setBreakdown(await breakRes.json());
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load analytics");
        } finally {
            setLoading(false);
        }
    };

    // Aggregate totals from summary
    const totals = summary.reduce(
        (acc, row) => ({
            total_requests: acc.total_requests + (row.total_requests || 0),
            api_calls: acc.api_calls + (row.api_calls || 0),
            page_views: acc.page_views + (row.page_views || 0),
            unique_visitors: acc.unique_visitors + (row.unique_visitors || 0),
            storage_used_mb: Math.max(acc.storage_used_mb, row.storage_used_mb || 0),
            bandwidth_used_gb: acc.bandwidth_used_gb + (row.bandwidth_used_gb || 0),
        }),
        { total_requests: 0, api_calls: 0, page_views: 0, unique_visitors: 0, storage_used_mb: 0, bandwidth_used_gb: 0 }
    );

    return (
        <div style={{ display: "grid", gap: 24 }}>
            {/* Header */}
            <div className="sp-panel-head">
                <h2 style={{ margin: 0 }}>Usage Analytics</h2>
                <div style={{ display: "flex", gap: 8 }}>
                    {(["last_7_days", "last_30_days"] as const).map((p) => (
                        <button
                            key={p}
                            className={`sp-btn ${period === p ? "sp-secondary" : "sp-ghost"}`}
                            style={{ fontSize: "0.82rem", padding: "6px 14px" }}
                            onClick={() => setPeriod(p)}
                        >
                            {p === "last_7_days" ? "7 Days" : "30 Days"}
                        </button>
                    ))}
                </div>
            </div>

            {error && (
                <div className="sp-card" style={{ borderColor: "var(--danger)", background: "color-mix(in srgb, var(--danger) 10%, transparent)" }}>
                    <p style={{ color: "var(--danger)", margin: 0 }}>{error}</p>
                </div>
            )}

            {loading ? (
                <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
                    Loading analytics...
                </div>
            ) : (
                <>
                    {/* KPI Totals */}
                    <div className="sp-kpi-grid">
                        {[
                            { label: "Total Requests", value: totals.total_requests.toLocaleString() },
                            { label: "API Calls", value: totals.api_calls.toLocaleString() },
                            { label: "Page Views", value: totals.page_views.toLocaleString() },
                            { label: "Unique Visitors", value: totals.unique_visitors.toLocaleString() },
                            { label: "Storage Used", value: `${totals.storage_used_mb.toFixed(1)} MB` },
                            { label: "Bandwidth Used", value: `${totals.bandwidth_used_gb.toFixed(2)} GB` },
                        ].map((stat) => (
                            <article key={stat.label} className="sp-kpi">
                                <h3>{stat.label}</h3>
                                <p style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text)", margin: "4px 0 0" }}>
                                    {stat.value}
                                </p>
                            </article>
                        ))}
                    </div>

                    {/* Breakdown Charts */}
                    {Object.keys(breakdown).length > 0 && (
                        <div>
                            <h3 style={{ marginBottom: 12 }}>Metric Breakdown</h3>
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                                    gap: 14,
                                }}
                            >
                                {Object.entries(breakdown).map(([metric, data]) => (
                                    <div key={metric} className="sp-card">
                                        <div className="sp-metric-head">
                                            <h3 style={{ margin: 0, fontSize: "0.85rem" }}>
                                                {METRIC_LABELS[metric] || metric.replace(/_/g, " ")}
                                            </h3>
                                            <span style={{ color: "var(--accent)", fontSize: "0.9rem", fontWeight: 700 }}>
                                                {data[0]?.value ?? 0}
                                            </span>
                                        </div>
                                        <MiniBarChart data={data} />
                                        <p style={{ margin: "6px 0 0", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                            Last {data.length} data point{data.length !== 1 ? "s" : ""}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Summary Table */}
                    {summary.length > 0 && (
                        <div className="sp-card" style={{ padding: 0, overflow: "hidden" }}>
                            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
                                <h3 style={{ margin: 0 }}>Daily Summary</h3>
                            </div>
                            <div className="sp-table-wrap">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Requests</th>
                                            <th>API Calls</th>
                                            <th>Page Views</th>
                                            <th>Visitors</th>
                                            <th>Bandwidth</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {summary.slice(0, 10).map((row, i) => (
                                            <tr key={i}>
                                                <td>{new Date(row.summary_date).toLocaleDateString()}</td>
                                                <td>{(row.total_requests || 0).toLocaleString()}</td>
                                                <td>{(row.api_calls || 0).toLocaleString()}</td>
                                                <td>{(row.page_views || 0).toLocaleString()}</td>
                                                <td>{(row.unique_visitors || 0).toLocaleString()}</td>
                                                <td>{(row.bandwidth_used_gb || 0).toFixed(2)} GB</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
