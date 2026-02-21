import type { Block } from "@/lib/builder/types";

function makeId() {
    return Math.random().toString(36).slice(2, 9);
}

export const BLOCKS: Block[] = [
    // ── LAYOUT ────────────────────────────────────────────────────────────
    {
        id: "section",
        label: "Section",
        icon: "⬜",
        category: "layout",
        defaultNode: {
            type: "section",
            tag: "section",
            styles: {
                padding: "60px 20px",
                maxWidth: "100%",
                background: "#ffffff",
            },
            children: [],
        },
    },
    {
        id: "2col",
        label: "2 Columns",
        icon: "⬛⬜",
        category: "layout",
        defaultNode: {
            type: "columns",
            tag: "div",
            styles: {
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "24px",
                padding: "40px 20px",
                maxWidth: "1200px",
                margin: "0 auto",
            },
            children: [
                {
                    id: makeId(),
                    type: "column",
                    tag: "div",
                    styles: { padding: "16px", background: "#f9fafb", borderRadius: "8px" },
                    content: "Column 1",
                    children: [],
                },
                {
                    id: makeId(),
                    type: "column",
                    tag: "div",
                    styles: { padding: "16px", background: "#f9fafb", borderRadius: "8px" },
                    content: "Column 2",
                    children: [],
                },
            ],
        },
    },
    {
        id: "3col",
        label: "3 Columns",
        icon: "▪▪▪",
        category: "layout",
        defaultNode: {
            type: "columns",
            tag: "div",
            styles: {
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "24px",
                padding: "40px 20px",
                maxWidth: "1200px",
                margin: "0 auto",
            },
            children: [
                {
                    id: makeId(),
                    type: "column",
                    tag: "div",
                    styles: { padding: "16px", background: "#f9fafb", borderRadius: "8px" },
                    content: "Column 1",
                    children: [],
                },
                {
                    id: makeId(),
                    type: "column",
                    tag: "div",
                    styles: { padding: "16px", background: "#f9fafb", borderRadius: "8px" },
                    content: "Column 2",
                    children: [],
                },
                {
                    id: makeId(),
                    type: "column",
                    tag: "div",
                    styles: { padding: "16px", background: "#f9fafb", borderRadius: "8px" },
                    content: "Column 3",
                    children: [],
                },
            ],
        },
    },
    {
        id: "divider",
        label: "Divider",
        icon: "─",
        category: "layout",
        defaultNode: {
            type: "divider",
            tag: "hr",
            styles: { border: "none", borderTop: "1px solid #e5e7eb", margin: "24px 0" },
            children: [],
        },
    },

    // ── CONTENT ───────────────────────────────────────────────────────────
    {
        id: "hero",
        label: "Hero",
        icon: "🦸",
        category: "content",
        defaultNode: {
            type: "hero",
            tag: "section",
            styles: {
                background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
                color: "#ffffff",
                padding: "100px 24px",
                textAlign: "center",
            },
            children: [
                {
                    id: makeId(),
                    type: "text",
                    tag: "h1",
                    content: "Your Amazing Headline",
                    styles: { fontSize: "3rem", fontWeight: "800", margin: "0 0 16px", lineHeight: "1.1" },
                    children: [],
                },
                {
                    id: makeId(),
                    type: "text",
                    tag: "p",
                    content: "A compelling subheadline that explains your value proposition and draws visitors in.",
                    styles: { fontSize: "1.2rem", opacity: "0.8", maxWidth: "560px", margin: "0 auto 32px" },
                    children: [],
                },
                {
                    id: makeId(),
                    type: "button",
                    tag: "button",
                    content: "Get Started →",
                    styles: {
                        background: "#6366f1",
                        color: "#fff",
                        padding: "14px 32px",
                        borderRadius: "999px",
                        border: "none",
                        fontSize: "1rem",
                        fontWeight: "700",
                        cursor: "pointer",
                    },
                    children: [],
                },
            ],
        },
    },
    {
        id: "heading",
        label: "Heading",
        icon: "H",
        category: "content",
        defaultNode: {
            type: "text",
            tag: "h2",
            content: "Section Heading",
            styles: { fontSize: "2rem", fontWeight: "700", margin: "0 0 12px", color: "#111827" },
            children: [],
        },
    },
    {
        id: "paragraph",
        label: "Paragraph",
        icon: "¶",
        category: "content",
        defaultNode: {
            type: "text",
            tag: "p",
            content: "Write your content here. This is a paragraph block you can edit in the style panel.",
            styles: { fontSize: "1rem", lineHeight: "1.7", color: "#374151", margin: "0 0 16px" },
            children: [],
        },
    },
    {
        id: "button",
        label: "Button",
        icon: "⬤",
        category: "content",
        defaultNode: {
            type: "button",
            tag: "button",
            content: "Click Me",
            styles: {
                background: "#6366f1",
                color: "#ffffff",
                padding: "12px 28px",
                borderRadius: "8px",
                border: "none",
                fontSize: "1rem",
                fontWeight: "600",
                cursor: "pointer",
                display: "inline-block",
            },
            children: [],
        },
    },
    {
        id: "card",
        label: "Card",
        icon: "🃏",
        category: "content",
        defaultNode: {
            type: "card",
            tag: "div",
            styles: {
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                padding: "28px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                maxWidth: "360px",
            },
            children: [
                {
                    id: makeId(),
                    type: "text",
                    tag: "h3",
                    content: "Card Title",
                    styles: { fontSize: "1.25rem", fontWeight: "700", margin: "0 0 8px", color: "#111827" },
                    children: [],
                },
                {
                    id: makeId(),
                    type: "text",
                    tag: "p",
                    content: "Card description text goes here. Keep it short and focused.",
                    styles: { fontSize: "0.95rem", color: "#6b7280", margin: "0" },
                    children: [],
                },
            ],
        },
    },

    // ── MEDIA ─────────────────────────────────────────────────────────────
    {
        id: "image",
        label: "Image",
        icon: "🖼",
        category: "media",
        defaultNode: {
            type: "image",
            tag: "img",
            attrs: {
                src: "https://placehold.co/800x400/e5e7eb/9ca3af?text=Your+Image",
                alt: "Placeholder image",
            },
            styles: { width: "100%", borderRadius: "8px", display: "block" },
            children: [],
        },
    },
    {
        id: "video",
        label: "Video",
        icon: "▶",
        category: "media",
        defaultNode: {
            type: "video",
            tag: "div",
            styles: {
                position: "relative",
                paddingTop: "56.25%",
                background: "#000",
                borderRadius: "12px",
                overflow: "hidden",
            },
            children: [
                {
                    id: makeId(),
                    type: "iframe",
                    tag: "iframe",
                    attrs: {
                        src: "https://www.youtube.com/embed/dQw4w9WgXcQ",
                        frameborder: "0",
                        allowfullscreen: "true",
                        style: "position:absolute;top:0;left:0;width:100%;height:100%",
                    },
                    styles: {},
                    children: [],
                },
            ],
        },
    },

    // ── NAVIGATION ────────────────────────────────────────────────────────
    {
        id: "navbar",
        label: "Navbar",
        icon: "☰",
        category: "navigation",
        defaultNode: {
            type: "navbar",
            tag: "nav",
            styles: {
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 32px",
                background: "#ffffff",
                borderBottom: "1px solid #e5e7eb",
                position: "sticky",
                top: "0",
                zIndex: "100",
            },
            children: [
                {
                    id: makeId(),
                    type: "text",
                    tag: "span",
                    content: "🚀 MyBrand",
                    styles: { fontWeight: "800", fontSize: "1.2rem", color: "#111827" },
                    children: [],
                },
                {
                    id: makeId(),
                    type: "text",
                    tag: "div",
                    content: "Home &nbsp; About &nbsp; Services &nbsp; Contact",
                    styles: { fontSize: "0.95rem", color: "#374151", display: "flex", gap: "24px" },
                    children: [],
                },
            ],
        },
    },
    {
        id: "footer",
        label: "Footer",
        icon: "🔲",
        category: "navigation",
        defaultNode: {
            type: "footer",
            tag: "footer",
            styles: {
                background: "#111827",
                color: "#9ca3af",
                padding: "48px 32px",
                textAlign: "center",
                fontSize: "0.9rem",
            },
            children: [
                {
                    id: makeId(),
                    type: "text",
                    tag: "p",
                    content: "© 2025 MyBrand. All rights reserved.",
                    styles: { margin: "0" },
                    children: [],
                },
            ],
        },
    },
];

export const BLOCK_CATEGORIES = ["layout", "content", "media", "navigation"] as const;
