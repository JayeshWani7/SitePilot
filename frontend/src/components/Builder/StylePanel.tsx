"use client";

import { useEditorStore } from "@/stores/useEditorStore";
import type { ElementNode } from "@/lib/builder/types";

function findNode(els: ElementNode[], id: string): ElementNode | null {
    for (const el of els) {
        if (el.id === id) return el;
        const f = findNode(el.children, id);
        if (f) return f;
    }
    return null;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="style-row">
            <span className="style-label">{label}</span>
            {children}
        </div>
    );
}

export default function BuilderStylePanel() {
    const { selectedId, elements, updateStyle, updateElement, deleteElement } = useEditorStore();
    const node = selectedId ? findNode(elements, selectedId) : null;

    if (!node) {
        return (
            <div className="builder-right" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", padding: 24, textAlign: "center" }}>
                <div style={{ fontSize: "2rem", marginBottom: 12 }}>🎨</div>
                <p style={{ margin: 0, fontSize: "0.88rem" }}>Select an element<br />to edit its styles</p>
            </div>
        );
    }

    const s = node.styles;
    const set = (prop: string, val: string) => updateStyle(node.id, { [prop]: val });

    return (
        <div className="builder-right" style={{ fontSize: "0.85rem" }}>
            <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
                <div>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: "0.88rem" }}>&lt;{node.tag}&gt; <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>{node.type}</span></p>
                    <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--text-muted)" }}>{node.id}</p>
                </div>
                <button className="sp-btn" onClick={() => deleteElement(node.id)} style={{ padding: "4px 8px", fontSize: "0.75rem", color: "var(--danger)", border: "1px solid color-mix(in srgb, var(--danger) 40%, var(--border))", background: "transparent" }}>🗑</button>
            </div>

            {node.content !== undefined && (
                <Row label="Content">
                    <textarea rows={3} value={node.content} onChange={e => updateElement(node.id, { content: e.target.value })} style={{ resize: "vertical", fontSize: "0.82rem" }} />
                </Row>
            )}
            {node.tag === "img" && (
                <Row label="Image URL">
                    <input value={node.attrs?.src ?? ""} onChange={e => updateElement(node.id, { attrs: { ...node.attrs, src: e.target.value } })} placeholder="https://..." />
                </Row>
            )}

            {[{ label: "Layout", props: [] }, { label: "", props: [] }].map(() => null)}

            <div style={{ padding: "8px 12px 2px", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.07em", color: "var(--primary)", opacity: 0.8 }}>Layout</div>
            <Row label="Display"><select value={s.display ?? ""} onChange={e => set("display", e.target.value)}><option value="">—</option><option>block</option><option>flex</option><option>grid</option><option>inline-block</option><option>none</option></select></Row>
            <Row label="Width"><input value={s.width ?? ""} onChange={e => set("width", e.target.value)} placeholder="100%, 400px…" /></Row>
            <Row label="Max-Width"><input value={s.maxWidth ?? ""} onChange={e => set("maxWidth", e.target.value)} placeholder="1200px…" /></Row>
            <Row label="Height"><input value={s.height ?? ""} onChange={e => set("height", e.target.value)} placeholder="auto, 400px…" /></Row>
            <Row label="Padding"><input value={s.padding ?? ""} onChange={e => set("padding", e.target.value)} placeholder="16px 24px…" /></Row>
            <Row label="Margin"><input value={s.margin ?? ""} onChange={e => set("margin", e.target.value)} placeholder="0 auto…" /></Row>

            <div style={{ padding: "8px 12px 2px", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.07em", color: "var(--primary)", opacity: 0.8 }}>Typography</div>
            <Row label="Font Size"><input value={s.fontSize ?? ""} onChange={e => set("fontSize", e.target.value)} placeholder="1rem…" /></Row>
            <Row label="Font Weight"><select value={s.fontWeight ?? ""} onChange={e => set("fontWeight", e.target.value)}><option value="">—</option><option value="400">Regular</option><option value="600">Semi-bold</option><option value="700">Bold</option><option value="800">Extra-bold</option></select></Row>
            <Row label="Text Align"><select value={s.textAlign ?? ""} onChange={e => set("textAlign", e.target.value)}><option value="">—</option><option>left</option><option>center</option><option>right</option><option>justify</option></select></Row>
            <Row label="Color">
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <input type="color" value={s.color ?? "#000000"} onChange={e => set("color", e.target.value)} style={{ width: 36, height: 32, padding: 2, borderRadius: 6, flex: "none" }} />
                    <input value={s.color ?? ""} onChange={e => set("color", e.target.value)} placeholder="#fff…" />
                </div>
            </Row>

            <div style={{ padding: "8px 12px 2px", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.07em", color: "var(--primary)", opacity: 0.8 }}>Decoration</div>
            <Row label="Background">
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <input type="color" value={(s.background ?? "#ffffff").slice(0, 7) || "#ffffff"} onChange={e => set("background", e.target.value)} style={{ width: 36, height: 32, padding: 2, borderRadius: 6, flex: "none" }} />
                    <input value={s.background ?? ""} onChange={e => set("background", e.target.value)} placeholder="#fff, linear-gradient…" />
                </div>
            </Row>
            <Row label="Border"><input value={s.border ?? ""} onChange={e => set("border", e.target.value)} placeholder="1px solid #ccc…" /></Row>
            <Row label="Border Radius"><input value={s.borderRadius ?? ""} onChange={e => set("borderRadius", e.target.value)} placeholder="8px, 999px…" /></Row>
            <Row label="Box Shadow"><input value={s.boxShadow ?? ""} onChange={e => set("boxShadow", e.target.value)} placeholder="0 4px 12px rgba(0,0,0,0.1)…" /></Row>

            <div style={{ padding: 12 }}>
                <button className="sp-btn sp-danger" style={{ width: "100%" }} onClick={() => deleteElement(node.id)}>Delete Element</button>
            </div>
        </div>
    );
}
