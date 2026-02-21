"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useEditorStore, nextBuilderId } from "@/stores/useEditorStore";
import { BLOCKS } from "@/lib/builder/blocks";
import { CANVAS_BASE_CSS } from "@/lib/builder/defaultStyles";
import { serializeForCanvas } from "@/lib/builder/exportHtml";
import type { ElementNode } from "@/lib/builder/types";

const DEVICE_WIDTHS = { desktop: "100%", tablet: "768px", mobile: "375px" } as const;

function renderWithIds(elements: ElementNode[]): string {
    function rn(node: ElementNode): string {
        const s = Object.entries(node.styles).map(([k, v]) => `${k.replace(/([A-Z])/g, m => `-${m.toLowerCase()}`)}: ${v}`).join("; ");
        const a = node.attrs ? Object.entries(node.attrs).map(([k, v]) => `${k}="${v}"`).join(" ") : "";
        const sA = s ? ` style="${s}"` : "";
        const id = ` data-sp-id="${node.id}"`;
        if (["img", "hr", "br"].includes(node.tag)) return `<${node.tag}${id}${sA} ${a}/>`;
        if (node.tag === "iframe") return `<${node.tag}${id}${sA} ${a}></${node.tag}>`;
        const inner = node.children.length > 0 ? node.children.map(rn).join("") : (node.content ?? "");
        return `<${node.tag}${id}${sA} ${a}>${inner}</${node.tag}>`;
    }
    return elements.map(rn).join("\n");
}

interface ElementRect { id: string; top: number; bottom: number; }

export default function BuilderCanvas() {
    const { elements, selectedId, selectElement, addElement, insertElement, device, previewMode } = useEditorStore();
    const [isDragging, setIsDragging] = useState(false);
    const [insertIndex, setInsertIndex] = useState(0);
    const [lineY, setLineY] = useState<number | null>(null);
    const [elementRects, setElementRects] = useState<ElementRect[]>([]);
    const dragCounter = useRef(0);
    const iframeWrapRef = useRef<HTMLDivElement>(null);

    const buildLiveSrcdoc = useCallback(() => {
        const body = renderWithIds(elements);
        const sel = selectedId ? `[data-sp-id="${selectedId}"] { outline: 2px solid #7c8cff !important; outline-offset: 1px; }` : "";
        return `<!DOCTYPE html><html><head>
<meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet"/>
<style>${CANVAS_BASE_CSS}${sel}[data-sp-id]{cursor:pointer;}[data-sp-hovered]:not([data-sp-id="${selectedId}"]){outline:1px dashed #a5b4fc!important;}</style>
</head><body style="margin:0">${body}
<script>
function sendRects(){const els=Array.from(document.body.children).filter(e=>e.dataset&&e.dataset.spId);window.parent.postMessage({type:'sp-rects',rects:els.map(e=>{const r=e.getBoundingClientRect();return{id:e.dataset.spId,top:r.top,bottom:r.bottom};})}, '*');}
sendRects();new MutationObserver(sendRects).observe(document.body,{childList:true,subtree:false});
document.addEventListener('click',function(e){const t=e.target.closest('[data-sp-id]');window.parent.postMessage({type:'sp-select',id:t?t.dataset.spId:null},'*');e.stopPropagation();});
document.addEventListener('mouseover',function(e){const t=e.target.closest('[data-sp-id]');document.querySelectorAll('[data-sp-hovered]').forEach(el=>el.removeAttribute('data-sp-hovered'));if(t)t.setAttribute('data-sp-hovered','');});
<\/script></body></html>`;
    }, [elements, selectedId]);

    const buildPreviewSrcdoc = useCallback(() =>
        `<!DOCTYPE html><html><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet"/>
<style>${CANVAS_BASE_CSS}</style></head><body style="margin:0">${serializeForCanvas(elements)}</body></html>`,
        [elements]);

    useEffect(() => {
        const h = (e: MessageEvent) => {
            if (e.data?.type === "sp-select") selectElement(e.data.id ?? null);
            if (e.data?.type === "sp-rects") setElementRects(e.data.rects ?? []);
        };
        window.addEventListener("message", h);
        return () => window.removeEventListener("message", h);
    }, [selectElement]);

    useEffect(() => {
        const start = () => setIsDragging(true);
        const end = () => { setIsDragging(false); setLineY(null); dragCounter.current = 0; };
        window.addEventListener("dragstart", start);
        window.addEventListener("dragend", end);
        return () => { window.removeEventListener("dragstart", start); window.removeEventListener("dragend", end); };
    }, []);

    function computeInsert(clientY: number) {
        const wRect = iframeWrapRef.current?.getBoundingClientRect();
        if (!wRect) return;
        if (!elementRects.length) { setInsertIndex(0); setLineY(4); return; }
        let idx = elementRects.length, ly: number | null = null;
        for (let i = 0; i < elementRects.length; i++) {
            if (clientY < (elementRects[i].top + elementRects[i].bottom) / 2) {
                idx = i; ly = elementRects[i].top - wRect.top - 2; break;
            }
        }
        if (ly === null) ly = elementRects[elementRects.length - 1].bottom - wRect.top + 2;
        setInsertIndex(idx); setLineY(Math.max(2, ly));
    }

    function doAdd(blockId: string, atIndex: number) {
        const block = BLOCKS.find(b => b.id === blockId);
        if (!block) return;
        const node = { ...JSON.parse(JSON.stringify(block.defaultNode)), id: nextBuilderId() } as ElementNode;
        atIndex >= elements.length ? addElement(node) : insertElement(node, atIndex);
    }

    function onOverlayDragOver(e: React.DragEvent) { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; computeInsert(e.clientY); }
    function onOverlayDrop(e: React.DragEvent) {
        e.preventDefault(); e.stopPropagation();
        const id = e.dataTransfer.getData("blockId");
        setIsDragging(false); setLineY(null); dragCounter.current = 0;
        if (id) doAdd(id, insertIndex);
    }
    function onWrapDrop(e: React.DragEvent) {
        e.preventDefault(); e.stopPropagation();
        const id = e.dataTransfer.getData("blockId");
        if (!id) return;
        setIsDragging(false); setLineY(null);
        doAdd(id, insertIndex);
    }

    const srcdoc = previewMode ? buildPreviewSrcdoc() : buildLiveSrcdoc();
    const width = DEVICE_WIDTHS[device];

    return (
        <div className="builder-canvas-wrap" onDragOver={e => e.preventDefault()} onDrop={onWrapDrop}
            onClick={e => { if (e.currentTarget === e.target) selectElement(null); }}>
            {elements.length === 0 && !previewMode && (
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center", color: "var(--text-muted)", pointerEvents: "none", userSelect: "none", zIndex: 1 }}>
                    <div style={{ fontSize: "3rem", marginBottom: 12 }}>🖼</div>
                    <p style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>Drag blocks here</p>
                    <p style={{ margin: "6px 0 0", fontSize: "0.85rem" }}>Or click a block in the sidebar to add it</p>
                </div>
            )}
            <div ref={iframeWrapRef} style={{ position: "relative", width, flexShrink: 0 }}>
                <iframe srcDoc={srcdoc} className="canvas-iframe"
                    style={{ width: "100%", minHeight: "calc(100vh - 92px)", height: "auto", display: "block" }}
                    title="Canvas" sandbox="allow-scripts allow-same-origin" />
                {isDragging && !previewMode && (
                    <div
                        onDragEnter={e => { e.preventDefault(); dragCounter.current++; }}
                        onDragLeave={() => { if (--dragCounter.current <= 0) { dragCounter.current = 0; setLineY(null); } }}
                        onDragOver={onOverlayDragOver} onDrop={onOverlayDrop}
                        style={{ position: "absolute", inset: 0, zIndex: 10, cursor: "copy", background: lineY !== null ? "color-mix(in srgb, var(--primary) 4%, transparent)" : "transparent" }}
                    >
                        {lineY !== null && (
                            <>
                                <div style={{ position: "absolute", left: 0, right: 0, top: lineY, height: 3, background: "var(--primary)", borderRadius: 2, boxShadow: "0 0 8px var(--primary)", pointerEvents: "none", zIndex: 20 }} />
                                <div style={{ position: "absolute", left: 12, top: lineY - 11, background: "var(--primary)", color: "#fff", fontSize: "0.7rem", fontWeight: 700, padding: "2px 8px", borderRadius: 999, pointerEvents: "none", zIndex: 21 }}>
                                    Insert here #{insertIndex + 1}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
