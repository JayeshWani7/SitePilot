"use client";

import { useEditorStore } from "@/stores/useEditorStore";
import { useAuth } from "@/context/AuthContext";
import { exportToHtml } from "@/lib/builder/exportHtml";
import Link from "next/link";
import { useState } from "react";

const DEVICES = [
    { id: "desktop" as const, icon: "🖥", label: "Desktop" },
    { id: "tablet" as const, icon: "📱", label: "Tablet" },
    { id: "mobile" as const, icon: "📲", label: "Mobile" },
];

export default function BuilderToolbar({ onOpenVersions }: { onOpenVersions: () => void }) {
    const { device, setDevice, undo, redo, clear, togglePreview, previewMode,
        past, future, elements, pageName, setPageName, isSaving, lastSaved, saveError, savePage, pageId } = useEditorStore();
    const { token } = useAuth();
    const [editingName, setEditingName] = useState(false);

    function handleExport() {
        const html = exportToHtml(elements);
        const blob = new Blob([html], { type: "text/html" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `${pageName.replace(/[^a-z0-9]/gi, "-").toLowerCase() || "page"}.html`;
        a.click();
    }

    async function handleSave() {
        if (!token) return;
        await savePage(token, "");
    }

    return (
        <div className="builder-toolbar" style={{ gap: 6 }}>
            {/* Back to dashboard */}
            <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 6, textDecoration: "none", color: "var(--text-muted)", fontSize: "0.82rem", marginRight: 4 }}>
                ← Dashboard
            </Link>

            <div style={{ width: 1, height: 24, background: "var(--border)" }} />

            {/* Page name */}
            {editingName ? (
                <input
                    autoFocus
                    value={pageName}
                    onChange={(e) => setPageName(e.target.value)}
                    onBlur={() => setEditingName(false)}
                    onKeyDown={(e) => e.key === "Enter" && setEditingName(false)}
                    style={{ fontSize: "0.85rem", fontWeight: 700, width: 160, padding: "4px 8px", borderRadius: 6 }}
                />
            ) : (
                <span
                    onClick={() => setEditingName(true)}
                    style={{ fontSize: "0.85rem", fontWeight: 700, cursor: "text", padding: "4px 8px", borderRadius: 6, border: "1px solid transparent", transition: "border-color 0.15s" }}
                    title="Click to rename"
                >
                    {pageName}
                </span>
            )}

            {/* Save status */}
            <span style={{ fontSize: "0.72rem", color: saveError ? "var(--danger)" : "var(--text-muted)" }}>
                {isSaving ? "Saving…" : saveError ? `⚠ ${saveError}` : lastSaved ? `Saved ${new Date(lastSaved).toLocaleTimeString()}` : ""}
            </span>

            {/* Undo / Redo */}
            <button className="sp-btn sp-ghost" onClick={undo} disabled={!past.length} title="Undo" style={{ padding: "5px 9px" }}>↩</button>
            <button className="sp-btn sp-ghost" onClick={redo} disabled={!future.length} title="Redo" style={{ padding: "5px 9px" }}>↪</button>

            <div style={{ width: 1, height: 24, background: "var(--border)" }} />

            {/* Device */}
            {DEVICES.map((d) => (
                <button key={d.id} title={d.label}
                    className={`sp-btn ${device === d.id ? "sp-secondary" : "sp-ghost"}`}
                    style={{ padding: "4px 9px" }}
                    onClick={() => setDevice(d.id)}>
                    {d.icon}
                </button>
            ))}

            <div style={{ flex: 1 }} />

            {/* Version history */}
            {pageId && (
                <button className="sp-btn sp-ghost" onClick={onOpenVersions} style={{ padding: "5px 12px", fontSize: "0.8rem" }}>
                    🕐 History
                </button>
            )}

            {/* Preview */}
            <button className={`sp-btn ${previewMode ? "sp-secondary" : "sp-ghost"}`} onClick={togglePreview} style={{ padding: "5px 12px" }}>
                {previewMode ? "✏ Edit" : "👁 Preview"}
            </button>

            {/* Clear */}
            <button className="sp-btn sp-ghost" onClick={clear} title="Clear canvas"
                style={{ padding: "5px 9px", color: "var(--danger)" }}>
                🗑
            </button>

            {/* Save */}
            <button className="sp-btn sp-secondary" onClick={handleSave} disabled={isSaving || !token}
                style={{ padding: "5px 14px" }}>
                {isSaving ? "…" : pageId ? "💾 Save" : "💾 Save"}
            </button>

            {/* Export */}
            <button className="sp-btn sp-primary" onClick={handleExport} style={{ padding: "5px 14px" }}>
                ⬇ Export HTML
            </button>
        </div>
    );
}
