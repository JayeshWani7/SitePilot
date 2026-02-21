"use client";

import { useState } from "react";
import { BLOCKS, BLOCK_CATEGORIES } from "@/lib/builder/blocks";
import { useEditorStore, nextBuilderId } from "@/stores/useEditorStore";
import type { ElementNode } from "@/lib/builder/types";

export default function BuilderSidebar() {
    const { addElement, elements, selectedId, selectElement, deleteElement, moveElement } = useEditorStore();
    const [tab, setTab] = useState<"blocks" | "layers">("blocks");
    const [cat, setCat] = useState<string>("all");

    function addBlock(blockId: string) {
        const block = BLOCKS.find((b) => b.id === blockId);
        if (!block) return;
        addElement({ ...JSON.parse(JSON.stringify(block.defaultNode)), id: nextBuilderId() } as ElementNode);
    }

    const filtered = cat === "all" ? BLOCKS : BLOCKS.filter((b) => b.category === cat);

    function renderLayer(el: ElementNode, depth = 0): React.ReactNode {
        return (
            <div key={el.id}>
                <div
                    className={`layer-item ${selectedId === el.id ? "selected" : ""}`}
                    style={{ paddingLeft: 12 + depth * 14 }}
                    onClick={() => selectElement(selectedId === el.id ? null : el.id)}
                >
                    <span style={{ fontSize: "0.72rem", opacity: 0.5 }}>{el.tag}</span>
                    <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{el.type}</span>
                    {selectedId === el.id && (
                        <span style={{ display: "flex", gap: 2 }}>
                            {(["up", "down"] as const).map((d) => (
                                <button key={d} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "0.7rem", padding: "0 2px" }}
                                    onClick={(e) => { e.stopPropagation(); moveElement(el.id, d); }}>{d === "up" ? "↑" : "↓"}</button>
                            ))}
                            <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--danger)", fontSize: "0.7rem", padding: "0 2px" }}
                                onClick={(e) => { e.stopPropagation(); deleteElement(el.id); }}>✕</button>
                        </span>
                    )}
                </div>
                {el.children.map((c) => renderLayer(c, depth + 1))}
            </div>
        );
    }

    return (
        <div className="builder-sidebar">
            <div style={{ display: "flex", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
                {(["blocks", "layers"] as const).map((t) => (
                    <button key={t} onClick={() => setTab(t)} style={{
                        flex: 1, padding: "10px", border: "none", cursor: "pointer",
                        background: tab === t ? "color-mix(in srgb, var(--primary) 12%, transparent)" : "transparent",
                        color: tab === t ? "var(--text)" : "var(--text-muted)",
                        fontWeight: tab === t ? 700 : 400, fontSize: "0.82rem",
                        borderBottom: tab === t ? "2px solid var(--primary)" : "2px solid transparent",
                        transition: "all 0.15s",
                    }}>{t === "blocks" ? "🧱 Blocks" : "📚 Layers"}</button>
                ))}
            </div>

            {tab === "blocks" ? (
                <>
                    <div style={{ padding: "8px 10px", display: "flex", flexWrap: "wrap", gap: 4, borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
                        {["all", ...BLOCK_CATEGORIES].map((c) => (
                            <button key={c} onClick={() => setCat(c)} style={{
                                padding: "3px 10px", borderRadius: 999, border: "1px solid",
                                fontSize: "0.72rem", fontWeight: 600, cursor: "pointer", textTransform: "capitalize",
                                background: cat === c ? "color-mix(in srgb, var(--primary) 18%, transparent)" : "transparent",
                                borderColor: cat === c ? "var(--primary)" : "var(--border)",
                                color: cat === c ? "var(--text)" : "var(--text-muted)",
                            }}>{c}</button>
                        ))}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, padding: 10, overflowY: "auto" }}>
                        {filtered.map((block) => (
                            <div key={block.id} className="block-item" draggable
                                onDragStart={(e) => e.dataTransfer.setData("blockId", block.id)}
                                onClick={() => addBlock(block.id)} title={`Add ${block.label}`}>
                                <span className="block-icon">{block.icon}</span>
                                <span>{block.label}</span>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <div style={{ overflowY: "auto", flex: 1, paddingTop: 4 }}>
                    {elements.length === 0
                        ? <p style={{ padding: "20px 12px", color: "var(--text-muted)", fontSize: "0.82rem", textAlign: "center" }}>No blocks yet.</p>
                        : elements.map((el) => renderLayer(el))}
                </div>
            )}
        </div>
    );
}
