// ── Builder types (duplicated into frontend for isolation) ────────────

export type Device = "desktop" | "tablet" | "mobile";

export interface StyleMap {
    [property: string]: string;
}

export interface ElementNode {
    id: string;
    type: string;
    tag: string;
    content?: string;
    styles: StyleMap;
    attrs?: Record<string, string>;
    children: ElementNode[];
}

export interface Block {
    id: string;
    label: string;
    icon: string;
    category: "layout" | "content" | "media" | "navigation";
    defaultNode: Omit<ElementNode, "id">;
}

export interface Template {
    id: string;
    name: string;
    description: string;
    thumbnail: string;
    category: "landing" | "portfolio" | "blog" | "saas" | "ecommerce" | "blank";
    elements: ElementNode[];
}

export interface HistoryEntry {
    elements: ElementNode[];
}

export interface BuilderPage {
    id: string;
    name: string;
    elements: ElementNode[];
    current_version: number;
    created_at: string;
    updated_at: string;
}

export interface BuilderVersion {
    id: string;
    version_number: number;
    message: string;
    created_at: string;
}

export interface EditorState {
    // Canvas state
    elements: ElementNode[];
    selectedId: string | null;
    device: Device;
    previewMode: boolean;
    past: HistoryEntry[];
    future: HistoryEntry[];

    // Page persistence state
    pageId: string | null;
    pageName: string;
    pageRoute: string;
    pageMinRole: string;
    activeProjectId: string | null;
    isSaving: boolean;
    saveError: string | null;
    lastSaved: string | null;

    // Actions
    setElements: (els: ElementNode[]) => void;
    insertElement: (node: ElementNode, index: number) => void;
    addElement: (node: ElementNode) => void;
    updateElement: (id: string, patch: Partial<ElementNode>) => void;
    updateStyle: (id: string, styles: StyleMap) => void;
    deleteElement: (id: string) => void;
    moveElement: (id: string, direction: "up" | "down") => void;
    selectElement: (id: string | null) => void;
    setDevice: (d: Device) => void;
    togglePreview: () => void;
    undo: () => void;
    redo: () => void;
    loadTemplate: (t: Template) => void;
    clear: () => void;
    setPageId: (id: string | null) => void;
    setPageName: (name: string) => void;
    setPageRoute: (route: string) => void;
    setActiveProjectId: (id: string | null) => void;

    // API actions
    savePage: (token: string, message?: string, tenantId?: string) => Promise<void>;
    loadPage: (token: string, pageId: string, tenantId?: string) => Promise<void>;
    createPage: (token: string, name?: string) => Promise<void>;
    createPageInProject: (token: string, projectId: string, name: string, route: string, minRole: string) => Promise<BuilderPage | null>;
}

