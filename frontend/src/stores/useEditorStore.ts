import { create } from "zustand";
import type {
    EditorState, ElementNode, StyleMap, Device, Template, HistoryEntry
} from "@/lib/builder/types";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

let _nextId = 200;
export const nextBuilderId = () => `el-${_nextId++}`;

function deepClone<T>(v: T): T { return JSON.parse(JSON.stringify(v)); }

function appendChild(els: ElementNode[], node: ElementNode) { return [...els, node]; }

function updateInTree(
    els: ElementNode[], id: string, patch: (n: ElementNode) => ElementNode
): ElementNode[] {
    return els.map((el) => {
        if (el.id === id) return patch(el);
        return { ...el, children: updateInTree(el.children, id, patch) };
    });
}

function removeFromTree(els: ElementNode[], id: string): ElementNode[] {
    return els.filter((el) => el.id !== id)
        .map((el) => ({ ...el, children: removeFromTree(el.children, id) }));
}

const MAX_HISTORY = 50;
function pushHistory(past: HistoryEntry[], elements: ElementNode[]): HistoryEntry[] {
    const next = [...past, { elements: deepClone(elements) }];
    return next.length > MAX_HISTORY ? next.slice(next.length - MAX_HISTORY) : next;
}

export const useEditorStore = create<EditorState>((set, get) => ({
    elements: [],
    selectedId: null,
    device: "desktop",
    previewMode: false,
    past: [],
    future: [],
    pageId: null,
    pageName: "Untitled Page",
    pageRoute: "/",
    pageMinRole: "viewer",
    activeProjectId: null,
    isSaving: false,
    saveError: null,
    lastSaved: null,

    setElements: (elements) => set({ elements }),

    addElement: (node) => {
        const { elements, past } = get();
        const clone = { ...deepClone(node), id: nextBuilderId() };
        set({ elements: appendChild(elements, clone), past: pushHistory(past, elements), future: [], selectedId: clone.id });
    },

    insertElement: (node, index) => {
        const { elements, past } = get();
        const clone = { ...deepClone(node), id: nextBuilderId() };
        const next = [...elements];
        next.splice(index, 0, clone);
        set({ elements: next, past: pushHistory(past, elements), future: [], selectedId: clone.id });
    },

    updateElement: (id, patch) =>
        set((s) => ({ elements: updateInTree(s.elements, id, (el) => ({ ...el, ...patch })) })),

    updateStyle: (id, styles) =>
        set((s) => ({ elements: updateInTree(s.elements, id, (el) => ({ ...el, styles: { ...el.styles, ...styles } })) })),

    deleteElement: (id) => {
        const { elements, past } = get();
        set({ elements: removeFromTree(elements, id), selectedId: null, past: pushHistory(past, elements), future: [] });
    },

    moveElement: (id, direction) => {
        const { elements } = get();
        const idx = elements.findIndex((e) => e.id === id);
        if (idx === -1) return;
        const next = [...elements];
        if (direction === "up" && idx > 0) [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
        else if (direction === "down" && idx < next.length - 1) [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
        set({ elements: next });
    },

    selectElement: (id) => set({ selectedId: id }),
    setDevice: (device: Device) => set({ device }),
    togglePreview: () => set((s) => ({ previewMode: !s.previewMode, selectedId: null })),
    setPageId: (id) => set({ pageId: id }),
    setPageName: (name) => set({ pageName: name }),
    setPageRoute: (route: string) => set({ pageRoute: route }),
    setActiveProjectId: (id: string | null) => set({ activeProjectId: id }),

    undo: () => {
        const { past, elements, future } = get();
        if (!past.length) return;
        const prev = past[past.length - 1];
        set({ elements: deepClone(prev.elements), past: past.slice(0, -1), future: [{ elements: deepClone(elements) }, ...future], selectedId: null });
    },

    redo: () => {
        const { past, elements, future } = get();
        if (!future.length) return;
        const next = future[0];
        set({ elements: deepClone(next.elements), future: future.slice(1), past: pushHistory(past, elements), selectedId: null });
    },

    loadTemplate: (t: Template) => {
        set({ elements: deepClone(t.elements), selectedId: null, past: [], future: [], pageId: null, pageName: "Untitled Page", pageRoute: "/", lastSaved: null });
    },

    clear: () => {
        const { elements, past } = get();
        set({ elements: [], selectedId: null, past: pushHistory(past, elements), future: [] });
    },

    // ── API: save / create page ───────────────────────────────────────────
    savePage: async (token, message = "", tenantId?: string) => {
        const { pageId, pageName, elements } = get();
        set({ isSaving: true, saveError: null });
        const authHeaders = (json = false) => ({
            ...(json ? { "Content-Type": "application/json" } : {}),
            Authorization: `Bearer ${token}`,
            ...(tenantId ? { "X-Tenant-ID": tenantId } : {}),
        });
        try {
            if (pageId) {
                await fetch(`${API}/builder/pages/${pageId}`, {
                    method: "PUT",
                    headers: authHeaders(true),
                    body: JSON.stringify({ name: pageName, elements, message }),
                }).then((r) => { if (!r.ok) throw new Error("Save failed"); return r.json(); });
            } else {
                const data = await fetch(`${API}/builder/pages`, {
                    method: "POST",
                    headers: authHeaders(true),
                    body: JSON.stringify({
                        name: pageName,
                        elements,
                        project_id: get().activeProjectId,
                        route: get().pageRoute,
                        min_role: get().pageMinRole,
                    }),
                }).then((r) => { if (!r.ok) throw new Error("Create failed"); return r.json(); });
                set({ pageId: data.id });
            }
            set({ lastSaved: new Date().toISOString() });
        } catch (err) {
            set({ saveError: (err as Error).message });
        } finally {
            set({ isSaving: false });
        }
    },

    loadPage: async (token, pageId, tenantId?: string) => {
        try {
            const headers: HeadersInit = { Authorization: `Bearer ${token}` };
            if (tenantId) (headers as Record<string, string>)["X-Tenant-ID"] = tenantId;
            const data = await fetch(`${API}/builder/pages/${pageId}`, { headers })
                .then((r) => { if (!r.ok) throw new Error("Load failed"); return r.json(); });
            set({
                elements: data.elements ?? [],
                pageName: data.name,
                pageId: data.id,
                pageRoute: data.route ?? "/",
                pageMinRole: data.min_role ?? "viewer",
                activeProjectId: data.project_id ?? null,
                selectedId: null,
                past: [], future: [],
                lastSaved: data.updated_at,
            });
        } catch (err) {
            console.error("loadPage:", err);
        }
    },

    // Create a page inside a specific project
    createPageInProject: async (token: string, projectId: string, name: string, route: string, minRole: string) => {
        set({ isSaving: true, saveError: null });
        try {
            const data = await fetch(`${API}/builder/pages`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ name, elements: [], project_id: projectId, route, min_role: minRole }),
            }).then((r) => { if (!r.ok) throw new Error("Create failed"); return r.json(); });
            set({
                pageId: data.id, pageName: name, pageRoute: route, pageMinRole: minRole,
                activeProjectId: projectId, elements: [], past: [], future: [], lastSaved: data.created_at,
            });
            return data;
        } catch (err) {
            set({ saveError: (err as Error).message });
            return null;
        } finally {
            set({ isSaving: false });
        }
    },

    createPage: async (token, name = "Untitled Page") => {
        set({ isSaving: true, saveError: null });
        try {
            const data = await fetch(`${API}/builder/pages`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ name, elements: [] }),
            }).then((r) => { if (!r.ok) throw new Error("Create failed"); return r.json(); });
            set({ pageId: data.id, pageName: name, elements: [], past: [], future: [], lastSaved: data.created_at });
        } catch (err) {
            set({ saveError: (err as Error).message });
        } finally {
            set({ isSaving: false });
        }
    },
}));
