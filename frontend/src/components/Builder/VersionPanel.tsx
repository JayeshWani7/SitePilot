"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useEditorStore } from "@/stores/useEditorStore";
import type { BuilderVersion } from "@/lib/builder/types";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

export default function VersionPanel({ onClose }: { onClose: () => void }) {
    const { token } = useAuth();
    const { pageId, loadPage } = useEditorStore();
    const [versions, setVersions] = useState<BuilderVersion[]>([]);
    const [loading, setLoading] = useState(true);
    const [restoring, setRestoring] = useState<string | null>(null);

    useEffect(() => {
        if (!pageId || !token) return;
        setLoading(true);
        fetch(`${API}/builder/pages/${pageId}/versions`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => r.json())
            .then((data) => setVersions(Array.isArray(data) ? data : []))
            .finally(() => setLoading(false));
    }, [pageId, token]);

    async function handleRestore(versionId: string) {
        if (!pageId || !token) return;
        setRestoring(versionId);
        try {
            await fetch(`${API}/builder/pages/${pageId}/restore/${versionId}`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
            // Reload the page into store
            await loadPage(token, pageId);
            onClose();
        } catch (err) {
            console.error("Restore failed:", err);
        } finally {
            setRestoring(null);
        }
    }

    return (
        <div style={{
            position: "fixed", top: 0, right: 0, bottom: 0, width: 340,
            background: "var(--surface)", borderLeft: "1px solid var(--border)",
            zIndex: 1000, display: "flex", flexDirection: "column",
            boxShadow: "-8px 0 32px rgba(0,0,0,0.3)",
        }}>
            {/* Header */}
            <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <p style={{ margin: 0, fontWeight: 700 }}>Version History</p>
                    <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {versions.length} saved version{versions.length !== 1 ? "s" : ""}
                    </p>
                </div>
                <button className="sp-btn sp-ghost" onClick={onClose} style={{ padding: "4px 8px" }}>✕</button>
            </div>

            {/* Version list */}
            <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
                {loading ? (
                    <p style={{ color: "var(--text-muted)", textAlign: "center", padding: 24, fontSize: "0.85rem" }}>Loading versions…</p>
                ) : versions.length === 0 ? (
                    <p style={{ color: "var(--text-muted)", textAlign: "center", padding: 24, fontSize: "0.85rem" }}>No versions yet. Save the page to create one.</p>
                ) : (
                    versions.map((v, i) => (
                        <div key={v.id} style={{
                            padding: "12px 14px", borderRadius: 10, marginBottom: 8,
                            background: i === 0 ? "color-mix(in srgb, var(--primary) 10%, var(--surface))" : "var(--bg-elevated)",
                            border: "1px solid",
                            borderColor: i === 0 ? "color-mix(in srgb, var(--primary) 40%, var(--border))" : "var(--border)",
                        }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                                        <span style={{ fontSize: "0.78rem", fontWeight: 700, color: i === 0 ? "var(--primary)" : "var(--text)" }}>
                                            v{v.version_number}
                                        </span>
                                        {i === 0 && (
                                            <span style={{ fontSize: "0.65rem", background: "var(--primary)", color: "#fff", borderRadius: 999, padding: "1px 7px", fontWeight: 700 }}>
                                                CURRENT
                                            </span>
                                        )}
                                    </div>
                                    <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text)", fontWeight: 500 }}>{v.message || "—"}</p>
                                    <p style={{ margin: "4px 0 0", fontSize: "0.72rem", color: "var(--text-muted)" }}>
                                        {new Date(v.created_at).toLocaleString()}
                                    </p>
                                </div>
                                {i !== 0 && (
                                    <button
                                        className="sp-btn sp-ghost"
                                        style={{ padding: "4px 10px", fontSize: "0.75rem", whiteSpace: "nowrap" }}
                                        disabled={restoring === v.id}
                                        onClick={() => handleRestore(v.id)}
                                    >
                                        {restoring === v.id ? "…" : "↩ Restore"}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
