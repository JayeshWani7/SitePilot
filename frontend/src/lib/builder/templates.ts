import type { Template } from "@/lib/builder/types";

let _id = 1;
const uid = () => `el-${_id++}`;

export const TEMPLATES: Template[] = [
    // ─── BLANK ────────────────────────────────────────────────────────────
    {
        id: "blank",
        name: "Blank Canvas",
        description: "Start from scratch with an empty page.",
        thumbnail: "⬜",
        category: "blank",
        elements: [],
    },

    // ─── LANDING PAGE ─────────────────────────────────────────────────────
    {
        id: "landing",
        name: "SaaS Landing",
        description: "Hero + features + CTA. Perfect for a product launch.",
        thumbnail: "🚀",
        category: "landing",
        elements: [
            {
                id: uid(), type: "navbar", tag: "nav",
                styles: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 48px", background: "#0f1115", borderBottom: "1px solid #2f3749", position: "sticky", top: "0", zIndex: "100" },
                children: [
                    { id: uid(), type: "text", tag: "span", content: "🚀 SaaSPro", styles: { fontWeight: "800", fontSize: "1.2rem", color: "#e5eaf5" }, children: [] },
                    { id: uid(), type: "button", tag: "button", content: "Get Started", styles: { background: "#7c8cff", color: "#fff", border: "none", padding: "10px 22px", borderRadius: "999px", fontWeight: "700", cursor: "pointer" }, children: [] },
                ],
            },
            {
                id: uid(), type: "hero", tag: "section",
                styles: { background: "linear-gradient(135deg, #0f1115 0%, #1d2130 100%)", color: "#e5eaf5", padding: "120px 24px", textAlign: "center" },
                children: [
                    { id: uid(), type: "text", tag: "h1", content: "The Smarter Way to Build Software", styles: { fontSize: "3.2rem", fontWeight: "800", margin: "0 0 20px", lineHeight: "1.1", color: "#e5eaf5" }, children: [] },
                    { id: uid(), type: "text", tag: "p", content: "Automate, deploy, and scale your apps with confidence. No DevOps headaches.", styles: { fontSize: "1.15rem", color: "#9ca7c0", maxWidth: "540px", margin: "0 auto 36px" }, children: [] },
                    { id: uid(), type: "button", tag: "button", content: "Start Free Trial →", styles: { background: "#7c8cff", color: "#fff", padding: "16px 40px", borderRadius: "999px", border: "none", fontSize: "1.05rem", fontWeight: "700", cursor: "pointer", marginRight: "12px" }, children: [] },
                    { id: uid(), type: "button", tag: "button", content: "See Demo", styles: { background: "transparent", color: "#e5eaf5", padding: "16px 40px", borderRadius: "999px", border: "1px solid #2f3749", fontSize: "1.05rem", cursor: "pointer" }, children: [] },
                ],
            },
            {
                id: uid(), type: "section", tag: "section",
                styles: { padding: "80px 24px", background: "#0f1115" },
                children: [
                    { id: uid(), type: "text", tag: "h2", content: "Why teams love SaaSPro", styles: { textAlign: "center", fontSize: "2rem", fontWeight: "700", margin: "0 0 48px", color: "#e5eaf5" }, children: [] },
                    {
                        id: uid(), type: "columns", tag: "div",
                        styles: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "24px", maxWidth: "1100px", margin: "0 auto" },
                        children: [
                            { id: uid(), type: "card", tag: "div", styles: { background: "#1d2130", border: "1px solid #2f3749", borderRadius: "12px", padding: "28px" }, children: [{ id: uid(), type: "text", tag: "h3", content: "⚡ Fast Deploys", styles: { color: "#e5eaf5", margin: "0 0 8px" }, children: [] }, { id: uid(), type: "text", tag: "p", content: "Ship in seconds with zero-downtime deployments.", styles: { color: "#9ca7c0", margin: "0" }, children: [] }] },
                            { id: uid(), type: "card", tag: "div", styles: { background: "#1d2130", border: "1px solid #2f3749", borderRadius: "12px", padding: "28px" }, children: [{ id: uid(), type: "text", tag: "h3", content: "🔐 Secure by Default", styles: { color: "#e5eaf5", margin: "0 0 8px" }, children: [] }, { id: uid(), type: "text", tag: "p", content: "End-to-end encryption and SOC2 compliant out of the box.", styles: { color: "#9ca7c0", margin: "0" }, children: [] }] },
                            { id: uid(), type: "card", tag: "div", styles: { background: "#1d2130", border: "1px solid #2f3749", borderRadius: "12px", padding: "28px" }, children: [{ id: uid(), type: "text", tag: "h3", content: "📊 Deep Analytics", styles: { color: "#e5eaf5", margin: "0 0 8px" }, children: [] }, { id: uid(), type: "text", tag: "p", content: "Real-time dashboards for every metric that matters.", styles: { color: "#9ca7c0", margin: "0" }, children: [] }] },
                        ],
                    },
                ],
            },
            {
                id: uid(), type: "footer", tag: "footer",
                styles: { background: "#0b0d12", padding: "40px 48px", textAlign: "center", color: "#9ca7c0", fontSize: "0.88rem", borderTop: "1px solid #2f3749" },
                children: [{ id: uid(), type: "text", tag: "p", content: "© 2025 SaaSPro Inc. All rights reserved.", styles: { margin: "0" }, children: [] }],
            },
        ],
    },

    // ─── PORTFOLIO ────────────────────────────────────────────────────────
    {
        id: "portfolio",
        name: "Creative Portfolio",
        description: "Showcase your work with a bold, minimal portfolio.",
        thumbnail: "🎨",
        category: "portfolio",
        elements: [
            {
                id: uid(), type: "hero", tag: "section",
                styles: { background: "#111827", color: "#fff", padding: "120px 48px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px", alignItems: "center", maxWidth: "1200px", margin: "0 auto" },
                children: [
                    {
                        id: uid(), type: "section", tag: "div", styles: {},
                        children: [
                            { id: uid(), type: "text", tag: "p", content: "👋 Hi, I'm Alex", styles: { color: "#9ca7c0", fontSize: "1rem", margin: "0 0 12px" }, children: [] },
                            { id: uid(), type: "text", tag: "h1", content: "Product Designer & React Developer", styles: { fontSize: "2.8rem", fontWeight: "800", lineHeight: "1.15", margin: "0 0 20px", color: "#fff" }, children: [] },
                            { id: uid(), type: "text", tag: "p", content: "I build beautiful digital products that people love to use. Open to freelance and full-time opportunities.", styles: { color: "#9ca7c0", margin: "0 0 28px", lineHeight: "1.7" }, children: [] },
                            { id: uid(), type: "button", tag: "button", content: "View My Work ↓", styles: { background: "#6366f1", color: "#fff", padding: "13px 28px", borderRadius: "999px", border: "none", fontWeight: "700", cursor: "pointer" }, children: [] },
                        ],
                    },
                    { id: uid(), type: "image", tag: "img", attrs: { src: "https://placehold.co/480x480/1d2130/7c8cff?text=Photo", alt: "Portrait" }, styles: { borderRadius: "20px", width: "100%" }, children: [] },
                ],
            },
            {
                id: uid(), type: "section", tag: "section",
                styles: { padding: "80px 48px", background: "#0f1115" },
                children: [
                    { id: uid(), type: "text", tag: "h2", content: "Selected Work", styles: { fontSize: "2rem", fontWeight: "700", color: "#e5eaf5", margin: "0 0 40px" }, children: [] },
                    {
                        id: uid(), type: "columns", tag: "div",
                        styles: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" },
                        children: [
                            { id: uid(), type: "image", tag: "img", attrs: { src: "https://placehold.co/600x380/1d2130/7c8cff?text=Project+1", alt: "Project 1" }, styles: { borderRadius: "12px", width: "100%" }, children: [] },
                            { id: uid(), type: "image", tag: "img", attrs: { src: "https://placehold.co/600x380/1d2130/2fd5b2?text=Project+2", alt: "Project 2" }, styles: { borderRadius: "12px", width: "100%" }, children: [] },
                        ],
                    },
                ],
            },
        ],
    },

    // ─── BLOG ─────────────────────────────────────────────────────────────
    {
        id: "blog",
        name: "Blog / Article",
        description: "Clean reading layout with header, body and footer.",
        thumbnail: "📰",
        category: "blog",
        elements: [
            {
                id: uid(), type: "navbar", tag: "nav",
                styles: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 48px", background: "#fff", borderBottom: "1px solid #e5e7eb" },
                children: [
                    { id: uid(), type: "text", tag: "span", content: "✍ The Daily Draft", styles: { fontWeight: "800", fontSize: "1.15rem", color: "#111827" }, children: [] },
                ],
            },
            {
                id: uid(), type: "section", tag: "section",
                styles: { maxWidth: "720px", margin: "60px auto", padding: "0 24px" },
                children: [
                    { id: uid(), type: "text", tag: "p", content: "TECHNOLOGY · 5 min read", styles: { color: "#6b7280", fontSize: "0.82rem", fontWeight: "600", letterSpacing: "0.06em", margin: "0 0 16px" }, children: [] },
                    { id: uid(), type: "text", tag: "h1", content: "Why the Future of Development is No-Code", styles: { fontSize: "2.6rem", fontWeight: "800", lineHeight: "1.2", margin: "0 0 20px", color: "#111827" }, children: [] },
                    { id: uid(), type: "text", tag: "p", content: "The tools we use to build software are evolving at an unprecedented rate. No longer do you need a decade of experience to ship a production-ready product.", styles: { fontSize: "1.15rem", color: "#374151", lineHeight: "1.8", margin: "0 0 24px" }, children: [] },
                    { id: uid(), type: "image", tag: "img", attrs: { src: "https://placehold.co/720x400/e5e7eb/9ca3af?text=Article+Image", alt: "Article" }, styles: { width: "100%", borderRadius: "12px", margin: "0 0 24px" }, children: [] },
                    { id: uid(), type: "text", tag: "p", content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.", styles: { fontSize: "1.05rem", color: "#374151", lineHeight: "1.8", margin: "0 0 16px" }, children: [] },
                ],
            },
        ],
    },

    // ─── E-COMMERCE ───────────────────────────────────────────────────────
    {
        id: "ecommerce",
        name: "Product Store",
        description: "Hero banner + product grid for an online store.",
        thumbnail: "🛍️",
        category: "ecommerce",
        elements: [
            {
                id: uid(), type: "navbar", tag: "nav",
                styles: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 40px", background: "#fff", borderBottom: "1px solid #e5e7eb" },
                children: [
                    { id: uid(), type: "text", tag: "span", content: "🛍 ShopEasy", styles: { fontWeight: "800", fontSize: "1.2rem", color: "#111827" }, children: [] },
                    { id: uid(), type: "button", tag: "button", content: "🛒 Cart (0)", styles: { background: "#111827", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "8px", fontWeight: "700", cursor: "pointer" }, children: [] },
                ],
            },
            {
                id: uid(), type: "hero", tag: "section",
                styles: { background: "linear-gradient(135deg, #fdf4ff, #f0f9ff)", padding: "80px 48px", textAlign: "center" },
                children: [
                    { id: uid(), type: "text", tag: "h1", content: "Summer Sale — Up to 50% Off", styles: { fontSize: "2.8rem", fontWeight: "800", color: "#111827", margin: "0 0 16px" }, children: [] },
                    { id: uid(), type: "button", tag: "button", content: "Shop Now →", styles: { background: "#111827", color: "#fff", padding: "14px 36px", borderRadius: "999px", border: "none", fontSize: "1rem", fontWeight: "700", cursor: "pointer" }, children: [] },
                ],
            },
            {
                id: uid(), type: "section", tag: "section",
                styles: { padding: "60px 40px", background: "#fff" },
                children: [
                    { id: uid(), type: "text", tag: "h2", content: "Featured Products", styles: { fontSize: "1.8rem", fontWeight: "700", color: "#111827", margin: "0 0 32px" }, children: [] },
                    {
                        id: uid(), type: "columns", tag: "div",
                        styles: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" },
                        children: [
                            { id: uid(), type: "card", tag: "div", styles: { border: "1px solid #e5e7eb", borderRadius: "12px", overflow: "hidden" }, children: [{ id: uid(), type: "image", tag: "img", attrs: { src: "https://placehold.co/400x300/f3f4f6/9ca3af?text=Product+1", alt: "Product 1" }, styles: { width: "100%", display: "block" }, children: [] }, { id: uid(), type: "text", tag: "div", content: "<p style='margin:12px 16px 4px;font-weight:700;color:#111827'>Wireless Headphones</p><p style='margin:0 16px 16px;color:#6b7280'>$89.99</p>", styles: {}, children: [] }] },
                            { id: uid(), type: "card", tag: "div", styles: { border: "1px solid #e5e7eb", borderRadius: "12px", overflow: "hidden" }, children: [{ id: uid(), type: "image", tag: "img", attrs: { src: "https://placehold.co/400x300/f3f4f6/9ca3af?text=Product+2", alt: "Product 2" }, styles: { width: "100%", display: "block" }, children: [] }, { id: uid(), type: "text", tag: "div", content: "<p style='margin:12px 16px 4px;font-weight:700;color:#111827'>Leather Wallet</p><p style='margin:0 16px 16px;color:#6b7280'>$39.99</p>", styles: {}, children: [] }] },
                            { id: uid(), type: "card", tag: "div", styles: { border: "1px solid #e5e7eb", borderRadius: "12px", overflow: "hidden" }, children: [{ id: uid(), type: "image", tag: "img", attrs: { src: "https://placehold.co/400x300/f3f4f6/9ca3af?text=Product+3", alt: "Product 3" }, styles: { width: "100%", display: "block" }, children: [] }, { id: uid(), type: "text", tag: "div", content: "<p style='margin:12px 16px 4px;font-weight:700;color:#111827'>Smartwatch</p><p style='margin:0 16px 16px;color:#6b7280'>$199.99</p>", styles: {}, children: [] }] },
                        ],
                    },
                ],
            },
        ],
    },

    // ─── RESTAURANT ───────────────────────────────────────────────────────
    {
        id: "restaurant",
        name: "Restaurant",
        description: "Warm and inviting page for a café or restaurant.",
        thumbnail: "🍽️",
        category: "landing",
        elements: [
            {
                id: uid(), type: "hero", tag: "section",
                styles: { background: "linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url('https://placehold.co/1400x700/3b1f0d/a0522d?text=Restaurant') center/cover", color: "#fff", padding: "140px 48px", textAlign: "center" },
                children: [
                    { id: uid(), type: "text", tag: "h1", content: "La Bella Cucina", styles: { fontSize: "3.5rem", fontWeight: "800", margin: "0 0 16px" }, children: [] },
                    { id: uid(), type: "text", tag: "p", content: "Authentic Italian Cuisine in the Heart of the City", styles: { fontSize: "1.2rem", opacity: "0.85", margin: "0 0 32px" }, children: [] },
                    { id: uid(), type: "button", tag: "button", content: "Reserve a Table", styles: { background: "#c0392b", color: "#fff", padding: "14px 36px", borderRadius: "999px", border: "none", fontSize: "1rem", fontWeight: "700", cursor: "pointer" }, children: [] },
                ],
            },
            {
                id: uid(), type: "section", tag: "section",
                styles: { padding: "80px 48px", background: "#fdf8f3", textAlign: "center" },
                children: [
                    { id: uid(), type: "text", tag: "h2", content: "Our Menu", styles: { fontSize: "2rem", fontWeight: "700", color: "#3b1f0d", margin: "0 0 40px" }, children: [] },
                    {
                        id: uid(), type: "columns", tag: "div",
                        styles: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "24px", maxWidth: "1100px", margin: "0 auto" },
                        children: [
                            { id: uid(), type: "card", tag: "div", styles: { background: "#fff", border: "1px solid #e8ddd4", borderRadius: "12px", padding: "24px", textAlign: "left" }, children: [{ id: uid(), type: "text", tag: "h3", content: "🍝 Pasta", styles: { color: "#3b1f0d", margin: "0 0 8px" }, children: [] }, { id: uid(), type: "text", tag: "p", content: "Handmade pasta with fresh ingredients from the region.", styles: { color: "#7a5a3a", margin: "0" }, children: [] }] },
                            { id: uid(), type: "card", tag: "div", styles: { background: "#fff", border: "1px solid #e8ddd4", borderRadius: "12px", padding: "24px", textAlign: "left" }, children: [{ id: uid(), type: "text", tag: "h3", content: "🍕 Pizza", styles: { color: "#3b1f0d", margin: "0 0 8px" }, children: [] }, { id: uid(), type: "text", tag: "p", content: "Wood-fired Neapolitan pizza baked to perfection.", styles: { color: "#7a5a3a", margin: "0" }, children: [] }] },
                            { id: uid(), type: "card", tag: "div", styles: { background: "#fff", border: "1px solid #e8ddd4", borderRadius: "12px", padding: "24px", textAlign: "left" }, children: [{ id: uid(), type: "text", tag: "h3", content: "🍮 Desserts", styles: { color: "#3b1f0d", margin: "0 0 8px" }, children: [] }, { id: uid(), type: "text", tag: "p", content: "Traditional tiramisu, panna cotta, and seasonal gelato.", styles: { color: "#7a5a3a", margin: "0" }, children: [] }] },
                        ],
                    },
                ],
            },
        ],
    },
];
