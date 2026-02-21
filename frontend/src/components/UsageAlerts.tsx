"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

interface Alert {
    id: string;
    alert_type: string;
    metric_name: string;
    current_value: number;
    limit_value: number;
    percentage: number;
    is_resolved: boolean;
    created_at: string;
    resolved_at?: string;
}

export default function UsageAlerts() {
    const { currentTenant, token } = useAuth();
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [showResolved, setShowResolved] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [resolving, setResolving] = useState<string | null>(null);

    const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

    useEffect(() => {
        if (!currentTenant || !token) return;
        fetchAlerts();
    }, [currentTenant, token, showResolved]);

    const fetchAlerts = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(
                `${API_BASE_URL}/usage/tenants/${currentTenant!.id}/usage/alerts?includeResolved=${showResolved}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "x-tenant-id": currentTenant!.id,
                    },
                }
            );
            if (!res.ok) throw new Error("Failed to fetch alerts");
            setAlerts(await res.json());
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load alerts");
        } finally {
            setLoading(false);
        }
    };

    const handleResolve = async (alertId: string) => {
        setResolving(alertId);
        try {
            const res = await fetch(
                `${API_BASE_URL}/usage/tenants/${currentTenant!.id}/usage/alerts/${alertId}/resolve`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "x-tenant-id": currentTenant!.id,
                    },
                }
            );
            if (!res.ok) throw new Error("Failed to resolve alert");
            await fetchAlerts();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to resolve");
        } finally {
            setResolving(null);
        }
    };

    const getSeverityStyle = (percentage: number) => {
        if (percentage >= 90) return { borderColor: "var(--danger)", bg: "color-mix(in srgb, var(--danger) 10%, transparent)", color: "var(--danger)" };
        if (percentage >= 70) return { borderColor: "#f4b942", bg: "color-mix(in srgb, #f4b942 10%, transparent)", color: "#f4b942" };
        return { borderColor: "var(--primary)", bg: "color-mix(in srgb, var(--primary) 10%, transparent)", color: "var(--primary)" };
    };

    return (
        <div style={{ display: "grid", gap: 20 }}>
            <div className="sp-panel-head">
                <h2 style={{ margin: 0 }}>Usage Alerts</h2>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Show resolved</span>
                    <button
                        className={`sp-btn ${showResolved ? "sp-secondary" : "sp-ghost"}`}
                        style={{ padding: "6px 14px", fontSize: "0.85rem" }}
                        onClick={() => setShowResolved((v) => !v)}
                    >
                        {showResolved ? "On" : "Off"}
                    </button>
                </div>
            </div>

            {error && (
                <div className="sp-card" style={{ borderColor: "var(--danger)", background: "color-mix(in srgb, var(--danger) 10%, transparent)" }}>
                    <p style={{ color: "var(--danger)", margin: 0 }}>{error}</p>
                </div>
            )}

            {loading ? (
                <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
                    Loading alerts...
                </div>
            ) : alerts.length === 0 ? (
                <div className="sp-card" style={{ textAlign: "center", padding: 40 }}>
                    <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "1.1rem" }}>
                        🎉 No {showResolved ? "" : "active "}alerts
                    </p>
                </div>
            ) : (
                <div style={{ display: "grid", gap: 12 }}>
                    {alerts.map((alert) => {
                        const sev = getSeverityStyle(alert.percentage);
                        return (
                            <div
                                key={alert.id}
                                className="sp-card"
                                style={{
                                    borderColor: alert.is_resolved ? "var(--border)" : sev.borderColor,
                                    background: alert.is_resolved ? undefined : sev.bg,
                                    opacity: alert.is_resolved ? 0.65 : 1,
                                    display: "flex",
                                    gap: 16,
                                    alignItems: "flex-start",
                                    justifyContent: "space-between",
                                }}
                            >
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                                        <span style={{ fontWeight: 700, color: alert.is_resolved ? "var(--text-muted)" : sev.color }}>
                                            {alert.alert_type.replace(/_/g, " ").toUpperCase()}
                                        </span>
                                        <span className="sp-pill" style={{ fontSize: "0.75rem" }}>
                                            {Math.round(alert.percentage)}%
                                        </span>
                                        {alert.is_resolved && (
                                            <span className="sp-pill" style={{ fontSize: "0.75rem", borderColor: "var(--accent)", color: "var(--accent)" }}>
                                                Resolved
                                            </span>
                                        )}
                                    </div>
                                    <p style={{ color: "var(--text-muted)", margin: "0 0 4px", fontSize: "0.9rem" }}>
                                        <strong style={{ color: "var(--text)" }}>{alert.metric_name}</strong>:{" "}
                                        {alert.current_value} / {alert.limit_value}
                                    </p>
                                    <div className="sp-progress" style={{ margin: "8px 0" }}>
                                        <span
                                            style={{
                                                width: `${Math.min(100, alert.percentage)}%`,
                                                background: alert.is_resolved
                                                    ? "var(--border)"
                                                    : `linear-gradient(90deg, ${sev.color}, ${sev.borderColor})`,
                                            }}
                                        />
                                    </div>
                                    <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", margin: 0 }}>
                                        {new Date(alert.created_at).toLocaleString()}
                                        {alert.resolved_at && ` · Resolved ${new Date(alert.resolved_at).toLocaleString()}`}
                                    </p>
                                </div>
                                {!alert.is_resolved && (
                                    <button
                                        className="sp-btn sp-secondary"
                                        style={{ fontSize: "0.85rem", padding: "6px 14px", flexShrink: 0 }}
                                        onClick={() => handleResolve(alert.id)}
                                        disabled={resolving === alert.id}
                                    >
                                        {resolving === alert.id ? "..." : "Resolve"}
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
