"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function FeatureFlags() {
    const { currentTenant, token } = useAuth();
    const [flags, setFlags] = useState<Record<string, boolean>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

    useEffect(() => {
        if (!currentTenant || !token) return;
        fetch(`${API_BASE_URL}/usage/tenants/${currentTenant.id}/feature-flags`, {
            headers: {
                Authorization: `Bearer ${token}`,
                "x-tenant-id": currentTenant.id,
            },
        })
            .then((r) => {
                if (!r.ok) throw new Error("Failed to load feature flags");
                return r.json();
            })
            .then(setFlags)
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, [currentTenant, token]);

    const entries = Object.entries(flags);

    return (
        <div style={{ display: "grid", gap: 20 }}>
            <div className="sp-panel-head">
                <h2 style={{ margin: 0 }}>Feature Flags</h2>
                <span className="sp-pill">{entries.length} features</span>
            </div>

            {error && (
                <div
                    className="sp-card"
                    style={{ borderColor: "var(--danger)", background: "color-mix(in srgb, var(--danger) 10%, transparent)" }}
                >
                    <p style={{ color: "var(--danger)", margin: 0 }}>{error}</p>
                </div>
            )}

            {loading ? (
                <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
                    Loading feature flags...
                </div>
            ) : entries.length === 0 ? (
                <div className="sp-card" style={{ textAlign: "center", padding: 40 }}>
                    <p style={{ color: "var(--text-muted)", margin: 0 }}>
                        No feature flags configured for this tenant.
                    </p>
                </div>
            ) : (
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                        gap: 12,
                    }}
                >
                    {entries.map(([name, enabled]) => (
                        <div
                            key={name}
                            className="sp-card"
                            style={{
                                borderColor: enabled
                                    ? "color-mix(in srgb, var(--accent) 60%, var(--border))"
                                    : "var(--border)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 12,
                                padding: "14px 16px",
                            }}
                        >
                            <div>
                                <p
                                    style={{
                                        margin: 0,
                                        fontWeight: 600,
                                        fontSize: "0.9rem",
                                        color: "var(--text)",
                                        textTransform: "capitalize",
                                    }}
                                >
                                    {name.replace(/_/g, " ")}
                                </p>
                                <p
                                    style={{
                                        margin: "2px 0 0",
                                        fontSize: "0.75rem",
                                        color: "var(--text-muted)",
                                        fontFamily: "monospace",
                                    }}
                                >
                                    {name}
                                </p>
                            </div>
                            <span
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 5,
                                    padding: "4px 10px",
                                    borderRadius: 999,
                                    fontSize: "0.78rem",
                                    fontWeight: 700,
                                    border: "1px solid",
                                    flexShrink: 0,
                                    borderColor: enabled ? "var(--accent)" : "var(--border)",
                                    color: enabled ? "var(--accent)" : "var(--text-muted)",
                                    background: enabled
                                        ? "color-mix(in srgb, var(--accent) 15%, transparent)"
                                        : "transparent",
                                }}
                            >
                                <span
                                    style={{
                                        width: 7,
                                        height: 7,
                                        borderRadius: "50%",
                                        background: enabled ? "var(--accent)" : "var(--border)",
                                        display: "inline-block",
                                    }}
                                />
                                {enabled ? "Enabled" : "Disabled"}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
