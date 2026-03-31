"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { TEMPLATES } from "@/lib/builder/templates";
import { useEditorStore } from "@/stores/useEditorStore";
import { useAuth } from "@/context/AuthContext";
import type { Template } from "@/lib/builder/types";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";
const ROLE_RANK: Record<string, number> = { viewer: 1, developer: 2, editor: 3, administrator: 4, owner: 5 };

/** Build auth + tenant headers for every builder API call */
function buildHeaders(token: string, tenantId?: string, json = false): HeadersInit {
    return {
        ...(json ? { "Content-Type": "application/json" } : {}),
        Authorization: `Bearer ${token}`,
        ...(tenantId ? { "X-Tenant-ID": tenantId } : {}),
    };
}
const ROLES = ["viewer", "developer", "editor", "administrator", "owner"];
const ROLE_ICON: Record<string, string> = { viewer: "", developer: "", editor: "", administrator: "", owner: "" };

interface Project {
    id: string; name: string; description: string; min_role: string;
    created_at: string; updated_at: string; page_count: number | string;
}
interface Page {
    id: string; name: string; route: string; min_role: string;
    current_version: number; updated_at: string;
}

// ── Modal: create new project ──────────────────────────────────────
function NewProjectModal({ myRole, token, tenantId, onCreated, onClose }: {
    myRole: string; token: string; tenantId: string;
    onCreated: (p: Project) => void; onClose: () => void;
}) {
    const [name, setName] = useState("");
    const [desc, setDesc] = useState("");
    const [minRole, setMinRole] = useState("viewer");
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState("");

    const allowedRoles = ROLES.filter(r => ROLE_RANK[r] <= ROLE_RANK[myRole]);

    async function submit() {
        if (!name.trim()) { setErr("Project name is required"); return; }
        setBusy(true); setErr("");
        const res = await fetch(`${API}/builder/projects`, {
            method: "POST",
            headers: buildHeaders(token, tenantId, true),
            body: JSON.stringify({ name: name.trim(), description: desc.trim(), min_role: minRole }),
        });
        setBusy(false);
        if (!res.ok) { const d = await res.json(); setErr(d.error || "Failed"); return; }
        onCreated(await res.json());
    }

    return (
        <div style={{
            position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)",
        }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div style={{
                background: "var(--surface)", borderRadius: 18, padding: "32px 36px", width: 480,
                border: "1px solid var(--border)", boxShadow: "0 24px 60px rgba(0,0,0,0.4)",
                animation: "fadeSlideDown 0.16s ease",
            }}>
                <h2 style={{ margin: "0 0 6px", fontSize: "1.2rem" }}>New Project</h2>
                <p style={{ margin: "0 0 24px", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                    A project is a full website with multiple pages.
                </p>
                {err && <p style={{ color: "var(--danger)", fontSize: "0.82rem", marginBottom: 12 }}>{err}</p>}
                <label style={labelStyle}>Project name</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="My Portfolio"
                    style={inputStyle} autoFocus onKeyDown={e => e.key === "Enter" && submit()} />
                <label style={labelStyle}>Description (optional)</label>
                <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="A short description…"
                    style={inputStyle} />
                <label style={labelStyle}>Minimum role to view</label>
                <select value={minRole} onChange={e => setMinRole(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                    {allowedRoles.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                </select>
                <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "flex-end" }}>
                    <button onClick={onClose} style={ghostBtn}>Cancel</button>
                    <button onClick={submit} disabled={busy} style={primaryBtn}>
                        {busy ? "Creating…" : "Create Project →"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Modal: create new page in a project ───────────────────────────
function NewPageModal({ project, myRole, token, tenantId, existingRoutes, onCreated, onClose }: {
    project: Project; myRole: string; token: string; tenantId: string; existingRoutes: string[];
    onCreated: (p: Page) => void; onClose: () => void;
}) {
    const [name, setName] = useState("");
    const [route, setRoute] = useState("/");
    const [minRole, setMinRole] = useState(project.min_role);
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState("");

    const allowedRoles = ROLES.filter(r => ROLE_RANK[r] <= ROLE_RANK[myRole]);

    async function submit() {
        if (!name.trim()) { setErr("Page name required"); return; }
        if (!route.startsWith("/")) { setErr("Route must start with /"); return; }
        if (existingRoutes.includes(route)) { setErr(`Route "${route}" already exists in this project`); return; }
        setBusy(true); setErr("");
        const res = await fetch(`${API}/builder/pages`, {
            method: "POST",
            headers: buildHeaders(token, tenantId, true),
            body: JSON.stringify({ name: name.trim(), elements: [], project_id: project.id, route, min_role: minRole }),
        });
        setBusy(false);
        if (!res.ok) { const d = await res.json(); setErr(d.error || "Failed"); return; }
        onCreated(await res.json());
    }

    return (
        <div style={{
            position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)",
        }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div style={{
                background: "var(--surface)", borderRadius: 18, padding: "32px 36px", width: 480,
                border: "1px solid var(--border)", boxShadow: "0 24px 60px rgba(0,0,0,0.4)",
                animation: "fadeSlideDown 0.16s ease",
            }}>
                <h2 style={{ margin: "0 0 4px", fontSize: "1.2rem" }}>New Page</h2>
                <p style={{ margin: "0 0 24px", color: "var(--text-muted)", fontSize: "0.84rem" }}>
                    in <strong>{project.name}</strong>
                </p>
                {err && <p style={{ color: "var(--danger)", fontSize: "0.82rem", marginBottom: 12 }}>{err}</p>}
                <label style={labelStyle}>Page name</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Home, About, Contact…"
                    style={inputStyle} autoFocus />
                <label style={labelStyle}>URL route</label>
                <input value={route} onChange={e => setRoute(e.target.value)} placeholder="/"
                    style={{ ...inputStyle, fontFamily: "monospace" }} />
                <p style={{ margin: "-8px 0 14px", fontSize: "0.74rem", color: "var(--text-muted)" }}>
                    Use <code>/</code> for homepage, <code>/about</code>, <code>/contact</code>, etc.
                </p>
                <label style={labelStyle}>Minimum role to view/edit</label>
                <select value={minRole} onChange={e => setMinRole(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                    {allowedRoles.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                </select>
                <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "flex-end" }}>
                    <button onClick={onClose} style={ghostBtn}>Cancel</button>
                    <button onClick={submit} disabled={busy} style={primaryBtn}>
                        {busy ? "Creating…" : "Add Page →"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Types ──────────────────────────────────────────────────────────
interface Deployment {
    id: string; subdomain: string; version_number: number; is_live: boolean;
    deployed_at: string; first_name?: string; last_name?: string; email?: string; page_count: number;
}

// ── Modal: Deploy project ──────────────────────────────────────────
function DeployModal({ project, token, tenantId, hasExisting, existingSubdomain, onDeployed, onClose }: {
    project: Project; token: string; tenantId: string;
    hasExisting: boolean; existingSubdomain?: string;
    onDeployed: (d: Deployment) => void; onClose: () => void;
}) {
    const [subdomain, setSubdomain] = useState(existingSubdomain ?? "");
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState("");

    async function submit() {
        setBusy(true); setErr("");
        const body: Record<string, string> = {};
        if (!hasExisting || !existingSubdomain) {
            if (!subdomain.trim()) { setErr("Subdomain is required"); setBusy(false); return; }
            body.subdomain = subdomain.trim();
        }
        const res = await fetch(`${API}/builder/projects/${project.id}/deploy`, {
            method: "POST",
            headers: buildHeaders(token, tenantId, true),
            body: JSON.stringify(body),
        });
        setBusy(false);
        if (!res.ok) { const d = await res.json(); setErr(d.error || "Deploy failed"); return; }
        onDeployed(await res.json());
    }

    const liveUrl = existingSubdomain ? `${window.location.origin.replace("3001", "3000")}/builder/site/${existingSubdomain}` : null;

    return (
        <div style={{
            position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)",
        }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div style={{
                background: "var(--surface)", borderRadius: 18, padding: "32px 36px", width: 480,
                border: "1px solid var(--border)", boxShadow: "0 24px 60px rgba(0,0,0,0.4)",
                animation: "fadeSlideDown 0.16s ease",
            }}>
                <h2 style={{ margin: "0 0 6px", fontSize: "1.2rem" }}>
                    {hasExisting ? "Deploy new version" : "Deploy project"}
                </h2>
                <p style={{ margin: "0 0 20px", color: "var(--text-muted)", fontSize: "0.84rem" }}>
                    {hasExisting
                        ? `This will snapshot all pages and deploy as version ${" "}onto ${existingSubdomain}.`
                        : "Choose a subdomain to host your website at."}
                </p>
                {err && <p style={{ color: "var(--danger)", fontSize: "0.82rem", marginBottom: 12 }}>{err}</p>}

                {!hasExisting && (
                    <>
                        <label style={labelStyle}>Subdomain</label>
                        <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
                            <input value={subdomain} onChange={e => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                                placeholder="my-site" style={{ ...inputStyle, borderRadius: "10px 0 0 10px", borderRight: "none" }}
                                onKeyDown={e => e.key === "Enter" && submit()} />
                            <span style={{ padding: "10px 12px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "0 10px 10px 0", fontSize: "0.84rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                                .sitepilot/site
                            </span>
                        </div>
                        <p style={{ margin: "6px 0 0", fontSize: "0.73rem", color: "var(--text-muted)" }}>Lowercase letters, numbers, hyphens only.</p>
                    </>
                )}

                {liveUrl && (
                    <div style={{ margin: "12px 0", padding: "10px 14px", borderRadius: 10, background: "color-mix(in srgb, var(--accent) 8%, var(--surface))", border: "1px solid color-mix(in srgb, var(--accent) 25%, var(--border))" }}>
                        <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-muted)" }}>Currently live at:</p>
                        <a href={liveUrl} target="_blank" rel="noreferrer" style={{ fontSize: "0.84rem", color: "var(--accent)", fontWeight: 600 }}>{liveUrl}</a>
                    </div>
                )}

                <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "flex-end" }}>
                    <button onClick={onClose} style={ghostBtn}>Cancel</button>
                    <button onClick={submit} disabled={busy} style={primaryBtn}>
                        {busy ? "Deploying..." : "Deploy"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Project detail view ────────────────────────────────────────────
function ProjectDetail({ project, myRole, token, tenantId, onBack }: {
    project: Project; myRole: string; token: string; tenantId: string; onBack: () => void;
}) {
    const router = useRouter();
    const { loadPage, setActiveProjectId } = useEditorStore();
    const [pages, setPages] = useState<Page[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewPage, setShowNewPage] = useState(false);
    const [hovered, setHovered] = useState<string | null>(null);
    const [compiling, setCompiling] = useState(false);
    const [detailTab, setDetailTab] = useState<"pages" | "deployments">("pages");
    const [deployments, setDeployments] = useState<Deployment[]>([]);
    const [showDeploy, setShowDeploy] = useState(false);
    const [activating, setActivating] = useState<string | null>(null);

    const canEdit = ROLE_RANK[myRole] >= ROLE_RANK.editor;
    const canDeploy = ROLE_RANK[myRole] >= ROLE_RANK.developer;

    function loadDeployments() {
        fetch(`${API}/builder/projects/${project.id}/deployments`, {
            headers: buildHeaders(token, tenantId),
        }).then(r => r.json()).then(d => setDeployments(Array.isArray(d) ? d : []));
    }

    useEffect(() => {
        setLoading(true);
        fetch(`${API}/builder/projects/${project.id}/pages`, {
            headers: buildHeaders(token, tenantId),
        }).then(r => r.json()).then(d => setPages(Array.isArray(d) ? d : [])).finally(() => setLoading(false));
        loadDeployments();
    }, [project.id, token]);

    async function handleOpenPage(p: Page) {
        await loadPage(token, p.id, tenantId);
        setActiveProjectId(project.id);
        router.push("/builder/editor");
    }

    async function handleCompile() {
        setCompiling(true);
        try {
            const res = await fetch(`${API}/builder/projects/${project.id}/compile`, {
                headers: buildHeaders(token, tenantId),
            });
            const data = await res.json();

            // Build zip using JSZip
            const JSZip = (await import("jszip")).default;
            const zip = new JSZip();
            for (const page of data.pages) {
                const filePath = page.route === "/" ? "index.html" : `${page.route.replace(/^\//, "")}/index.html`;
                zip.file(filePath, page.html);
            }
            const blob = await zip.generateAsync({ type: "blob" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url; a.download = `${data.project.replace(/\s+/g, "-").toLowerCase()}.zip`;
            a.click(); URL.revokeObjectURL(url);
        } catch (e) {
            console.error("Compile error:", e);
        }
        setCompiling(false);
    }

    const liveDeployment = deployments.find(d => d.is_live);
    const liveUrl = liveDeployment ? `${typeof window !== "undefined" ? window.location.origin.replace("3001", "3000") : ""}/builder/site/${liveDeployment.subdomain}` : null;

    async function handleActivate(deploymentId: string) {
        setActivating(deploymentId);
        const res = await fetch(`${API}/builder/deployments/${deploymentId}/activate`, {
            method: "POST",
            headers: buildHeaders(token, tenantId, true),
        });
        if (res.ok) loadDeployments();
        setActivating(null);
    }

    return (
        <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <button onClick={onBack} style={{ ...ghostBtn, padding: "6px 14px" }}>← Projects</button>
                <div>
                    <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800 }}>{project.name}</h2>
                    {project.description && (
                        <p style={{ margin: "2px 0 0", fontSize: "0.84rem", color: "var(--text-muted)" }}>{project.description}</p>
                    )}
                </div>
                <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
                    <button onClick={handleCompile} disabled={compiling || pages.length === 0} style={{
                        ...ghostBtn,
                        borderColor: "color-mix(in srgb, var(--accent) 40%, var(--border))",
                        color: "var(--accent)",
                    }}>
                        {compiling ? "Compiling..." : "Compile"}
                    </button>
                    {canDeploy && (
                        <button onClick={() => setShowDeploy(true)} disabled={pages.length === 0} style={{
                            ...primaryBtn,
                            background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                        }}>
                            {liveDeployment ? "Re-deploy" : "Deploy"}
                        </button>
                    )}
                    {canEdit && (
                        <button onClick={() => setShowNewPage(true)} style={primaryBtn}>+ New Page</button>
                    )}
                </div>
            </div>

            {/* Live URL banner */}
            {liveUrl && (
                <div style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "10px 16px",
                    borderRadius: 10, marginBottom: 20,
                    background: "color-mix(in srgb, #4f46e5 8%, var(--surface))",
                    border: "1px solid color-mix(in srgb, #4f46e5 30%, var(--border))",
                }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", flexShrink: 0 }} />
                    <span style={{ fontSize: "0.84rem", color: "var(--text-muted)" }}>Live at:</span>
                    <a href={liveUrl} target="_blank" rel="noreferrer"
                        style={{ fontSize: "0.84rem", fontWeight: 600, color: "#6366f1" }}>{liveUrl}</a>
                    <span style={{ marginLeft: "auto", fontSize: "0.74rem", color: "var(--text-muted)" }}>v{liveDeployment?.version_number}</span>
                </div>
            )}

            {/* Sub-tabs: Pages | Deployments */}
            <div style={{ display: "flex", borderBottom: "1px solid var(--border)", marginBottom: 24 }}>
                {(["pages", "deployments"] as const).map(t => (
                    <button key={t} onClick={() => setDetailTab(t)} style={{
                        padding: "8px 20px", border: "none", cursor: "pointer", fontWeight: 600,
                        fontSize: "0.86rem", background: "transparent", textTransform: "capitalize",
                        color: detailTab === t ? "var(--text)" : "var(--text-muted)",
                        borderBottom: detailTab === t ? "2px solid var(--primary)" : "2px solid transparent",
                        transition: "all 0.15s",
                    }}>
                        {t === "deployments" ? `Deployments (${deployments.length})` : "Pages"}
                    </button>
                ))}
            </div>

            {/* Pages tab */}
            {detailTab === "pages" && (
                <div>
                    {loading ? (
                        <div style={{ textAlign: "center", padding: "64px 0", color: "var(--text-muted)" }}>Loading pages...</div>
                    ) : pages.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "80px 0" }}>
                            <p style={{ color: "var(--text-muted)", fontSize: "1rem" }}>No pages yet.</p>
                            {canEdit && (
                                <button onClick={() => setShowNewPage(true)} style={{ ...primaryBtn, marginTop: 12 }}>+ Add your first page</button>
                            )}
                        </div>
                    ) : (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
                            {pages.map(p => (
                                <div key={p.id}
                                    onClick={() => handleOpenPage(p)}
                                    onMouseEnter={() => setHovered(p.id)}
                                    onMouseLeave={() => setHovered(null)}
                                    style={{
                                        borderRadius: 14, border: "1px solid", cursor: "pointer", overflow: "hidden",
                                        borderColor: hovered === p.id ? "var(--primary)" : "var(--border)",
                                        background: hovered === p.id ? "color-mix(in srgb, var(--primary) 6%, var(--surface))" : "var(--surface)",
                                        transition: "all 0.15s", boxShadow: hovered === p.id ? "0 4px 20px rgba(0,0,0,0.2)" : "none",
                                    }}>
                                    {/* Page color band */}
                                    <div style={{
                                        height: 6,
                                        background: "linear-gradient(90deg, var(--primary), var(--accent))",
                                    }} />
                                    <div style={{ padding: "14px 16px" }}>
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                                            <p style={{ margin: 0, fontWeight: 700, fontSize: "0.95rem", color: "var(--text)" }}>{p.name}</p>
                                            <span style={{
                                                fontSize: "0.7rem", padding: "2px 8px", borderRadius: 999, fontWeight: 700,
                                                background: "color-mix(in srgb, var(--accent) 12%, transparent)",
                                                color: "var(--accent)", whiteSpace: "nowrap",
                                            }}>
                                                {p.min_role}+
                                            </span>
                                        </div>
                                        <code style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{p.route}</code>
                                        <p style={{ margin: "6px 0 0", fontSize: "0.73rem", color: "var(--text-muted)" }}>
                                            v{p.current_version} · {new Date(p.updated_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {showDeploy && (
                        <DeployModal
                            project={project} token={token} tenantId={tenantId}
                            hasExisting={deployments.length > 0}
                            existingSubdomain={deployments[0]?.subdomain}
                            onDeployed={d => { setDeployments(prev => [d, ...prev.map(x => ({ ...x, is_live: false }))]); setShowDeploy(false); setDetailTab("deployments"); }}
                            onClose={() => setShowDeploy(false)} />
                    )}
                    {showNewPage && (
                        <NewPageModal
                            project={project} myRole={myRole} token={token} tenantId={tenantId}
                            existingRoutes={pages.map(p => p.route)}
                            onCreated={p => { setPages(prev => [...prev, p]); setShowNewPage(false); }}
                            onClose={() => setShowNewPage(false)}
                        />
                    )}
                </div>
            )}

            {/* Deployments tab */}
            {detailTab === "deployments" && (
                <div>
                    {deployments.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "60px 0" }}>
                            <p style={{ color: "var(--text-muted)", marginBottom: 16 }}>No deployments yet.</p>
                            {canDeploy && <button onClick={() => setShowDeploy(true)} disabled={pages.length === 0} style={primaryBtn}>Deploy this project</button>}
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            {deployments.map(d => (
                                <div key={d.id} style={{
                                    borderRadius: 12, border: "1px solid",
                                    borderColor: d.is_live ? "color-mix(in srgb, #4f46e5 40%, var(--border))" : "var(--border)",
                                    background: d.is_live ? "color-mix(in srgb, #4f46e5 6%, var(--surface))" : "var(--surface)",
                                    padding: "16px 20px",
                                    display: "flex", alignItems: "center", gap: 16,
                                }}>
                                    {/* Version + status */}
                                    <div style={{ minWidth: 60 }}>
                                        <p style={{ margin: 0, fontWeight: 800, fontSize: "1rem", color: d.is_live ? "#6366f1" : "var(--text)" }}>v{d.version_number}</p>
                                        {d.is_live && (
                                            <span style={{ fontSize: "0.65rem", background: "#4f46e5", color: "#fff", padding: "1px 7px", borderRadius: 999, fontWeight: 700 }}>LIVE</span>
                                        )}
                                    </div>
                                    {/* Details */}
                                    <div style={{ flex: 1 }}>
                                        <p style={{ margin: 0, fontWeight: 600, fontSize: "0.88rem" }}>
                                            /{d.subdomain} &nbsp;<span style={{ color: "var(--text-muted)", fontWeight: 400 }}>({d.page_count} page{d.page_count !== 1 ? "s" : ""})</span>
                                        </p>
                                        <p style={{ margin: "3px 0 0", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                            {new Date(d.deployed_at).toLocaleString()} · by {d.first_name ? `${d.first_name} ${d.last_name ?? ""}`.trim() : d.email ?? "unknown"}
                                        </p>
                                    </div>
                                    {/* Actions */}
                                    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                                        {d.is_live && liveUrl && (
                                            <a href={liveUrl} target="_blank" rel="noreferrer"
                                                style={{ ...ghostBtn, display: "inline-block", textDecoration: "none", padding: "6px 14px", fontSize: "0.8rem" }}>
                                                Open
                                            </a>
                                        )}
                                        {!d.is_live && canDeploy && (
                                            <button onClick={() => handleActivate(d.id)} disabled={activating === d.id}
                                                style={{
                                                    ...ghostBtn, padding: "6px 14px", fontSize: "0.8rem",
                                                    borderColor: "color-mix(in srgb, #4f46e5 40%, var(--border))",
                                                    color: "#6366f1"
                                                }}>
                                                {activating === d.id ? "Activating..." : "Activate"}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}


// ── Main builder home ──────────────────────────────────────────────
export default function BuilderHomePage() {
    const router = useRouter();
    const { loadTemplate } = useEditorStore();
    const { token, currentTenant } = useAuth();
    const [tab, setTab] = useState<"projects" | "templates">("projects");
    const [projects, setProjects] = useState<Project[]>([]);
    const [loadingProjects, setLoadingProjects] = useState(false);
    const [showNewProject, setShowNewProject] = useState(false);
    const [activeProject, setActiveProject] = useState<Project | null>(null);
    const [hovered, setHovered] = useState<string | null>(null);

    const myRole = currentTenant?.role ?? "viewer";
    const canEdit = ROLE_RANK[myRole] >= ROLE_RANK.editor;

    useEffect(() => {
        if (!token) return;
        console.log("Fetching projects for tenant:", currentTenant?.id, "role:", currentTenant?.role);
        setLoadingProjects(true);
        const headers = buildHeaders(token, currentTenant?.id);
        console.log("Request headers:", headers);
        fetch(`${API}/builder/projects`, { headers })
            .then(async r => {
                const text = await r.text();
                console.log("Projects response status:", r.status, "body:", text);
                if (!r.ok) {
                    try {
                        const err = JSON.parse(text);
                        console.error("Failed to fetch projects:", r.status, err);
                    } catch {
                        console.error("Failed to fetch projects:", r.status, text);
                    }
                    setProjects([]);
                    return;
                }
                try {
                    const d = JSON.parse(text);
                    console.log("Parsed projects:", d);
                    setProjects(Array.isArray(d) ? d : []);
                } catch (e) {
                    console.error("Failed to parse projects response:", e);
                    setProjects([]);
                }
            })
            .catch(err => {
                console.error("Error fetching projects:", err);
                setProjects([]);
            })
            .finally(() => setLoadingProjects(false));
    }, [token, currentTenant?.id]);

    function handleTemplate(t: Template) { 
        // Create a new project from template and save to database
        if (!canEdit) {
            alert("Editor role required to create projects");
            return;
        }
        
        (async () => {
            try {
                const res = await fetch(`${API}/builder/projects`, {
                    method: "POST",
                    headers: buildHeaders(token!, currentTenant?.id, true),
                    body: JSON.stringify({ 
                        name: t.name, 
                        description: `Based on ${t.name} template`,
                        min_role: myRole
                    }),
                });
                
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    alert("Failed to create project: " + (err.error || "Unknown error"));
                    return;
                }
                
                const projectData = await res.json();
                
                // Create a home page from template
                try {
                    await fetch(`${API}/builder/pages`, {
                        method: "POST",
                        headers: buildHeaders(token!, currentTenant?.id, true),
                        body: JSON.stringify({
                            project_id: projectData.id,
                            name: "Home",
                            route: "/",
                            elements: t.elements || [],
                            min_role: myRole
                        }),
                    });
                } catch (pageErr) {
                    console.error("Error creating page from template:", pageErr);
                }
                
                loadTemplate(t);
                router.push("/builder/editor");
            } catch (err) {
                console.error("Error creating project from template:", err);
                alert("Error creating project");
            }
        })();
    }

    if (activeProject) {
        return (
            <div style={{ minHeight: "100vh", padding: "40px 48px", background: "var(--bg)" }}>
                <style>{`@keyframes fadeSlideDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}`}</style>
                <div style={{ maxWidth: 1100, margin: "0 auto" }}>
                    <ProjectDetail project={activeProject} myRole={myRole} token={token!} tenantId={currentTenant?.id ?? ""}
                        onBack={() => setActiveProject(null)} />
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: "100vh", padding: "40px 48px", background: "var(--bg)" }}>
            <style>{`@keyframes fadeSlideDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}`}</style>
            <div style={{ maxWidth: 1100, margin: "0 auto" }}>

                {/* Header */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 36 }}>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "linear-gradient(135deg, var(--primary), var(--accent))", boxShadow: "0 0 0 5px color-mix(in srgb, var(--primary) 20%, transparent)" }} />
                            <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                                SitePilot Builder
                            </span>
                        </div>
                        <h1 style={{
                            fontSize: "2.2rem", fontWeight: 900, margin: 0, letterSpacing: "-0.03em",
                            background: "linear-gradient(135deg, var(--text), var(--primary))",
                            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                        }}>
                            Website Builder
                        </h1>
                        <p style={{ margin: "6px 0 0", fontSize: "0.9rem", color: "var(--text-muted)" }}>
                            Build multi-page websites, organised by project.
                        </p>
                    </div>
                    <button className="sp-btn sp-ghost" onClick={() => router.push("/dashboard")} style={{ flexShrink: 0 }}>
                        ← Dashboard
                    </button>
                </div>

                {/* Tabs */}
                <div style={{ display: "flex", gap: 0, marginBottom: 28, borderBottom: "1px solid var(--border)" }}>
                    {(["projects", "templates"] as const).map(t => (
                        <button key={t} onClick={() => setTab(t)} style={{
                            padding: "10px 22px", border: "none", cursor: "pointer", fontWeight: 600, fontSize: "0.88rem",
                            background: "transparent", textTransform: "capitalize",
                            color: tab === t ? "var(--text)" : "var(--text-muted)",
                            borderBottom: tab === t ? "2px solid var(--primary)" : "2px solid transparent",
                            transition: "all 0.15s",
                        }}>
                            {t === "projects" ? `Projects (${projects.length})` : "Templates"}
                        </button>
                    ))}
                </div>

                {/* Projects tab */}
                {tab === "projects" && (
                    <div>
                        <div style={{ display: "flex", gap: 12, marginBottom: 24, alignItems: "center" }}>
                            {canEdit && (
                                <button onClick={() => setShowNewProject(true)} style={primaryBtn}>+ New Project</button>
                            )}
                            {!canEdit && (
                                <p style={{ margin: 0, fontSize: "0.84rem", color: "var(--text-muted)" }}>
                                    You have read-only access. Editor role required to create projects.
                                </p>
                            )}
                        </div>

                        {loadingProjects ? (
                            <p style={{ color: "var(--text-muted)", padding: "48px 0", textAlign: "center" }}>Loading projects…</p>
                        ) : projects.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "80px 0" }}>
                                <p style={{ color: "var(--text-muted)", fontSize: "1rem", marginBottom: 4 }}>No projects yet.</p>
                                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: 24 }}>Create a project to start building your website.</p>
                                {canEdit && <button onClick={() => setShowNewProject(true)} style={primaryBtn}>+ Create your first project</button>}
                            </div>
                        ) : (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 18 }}>
                                {projects.map(p => (
                                    <div key={p.id}
                                        onClick={() => setActiveProject(p)}
                                        onMouseEnter={() => setHovered(p.id)}
                                        onMouseLeave={() => setHovered(null)}
                                        style={{
                                            borderRadius: 16, border: "1px solid", cursor: "pointer", overflow: "hidden",
                                            borderColor: hovered === p.id ? "var(--primary)" : "var(--border)",
                                            background: hovered === p.id ? "color-mix(in srgb, var(--primary) 6%, var(--surface))" : "var(--surface)",
                                            transition: "all 0.18s",
                                            boxShadow: hovered === p.id ? "0 8px 32px rgba(0,0,0,0.22)" : "none",
                                            transform: hovered === p.id ? "translateY(-2px)" : "none",
                                        }}>
                                        {/* Project color band */}
                                        <div style={{
                                            height: 6,
                                            background: "linear-gradient(90deg, var(--primary), var(--accent))",
                                        }} />
                                        <div style={{ padding: "16px 18px" }}>
                                            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                                                <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>{p.name}</h3>
                                                <span style={{
                                                    fontSize: "0.7rem", padding: "2px 8px", borderRadius: 999, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0,
                                                    background: "color-mix(in srgb, var(--primary) 12%, transparent)", color: "var(--primary)",
                                                }}>
                                                    {p.min_role}+
                                                </span>
                                            </div>
                                            {p.description && (
                                                <p style={{ margin: "5px 0 0", fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: 1.4 }}>{p.description}</p>
                                            )}
                                            <p style={{ margin: "10px 0 0", fontSize: "0.74rem", color: "var(--text-muted)" }}>
                                                {p.page_count} page{p.page_count === 1 ? "" : "s"} · Updated {new Date(p.updated_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Templates tab */}
                {tab === "templates" && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
                        {TEMPLATES.map(t => (
                            <div key={t.id}
                                onMouseEnter={() => setHovered(t.id)} onMouseLeave={() => setHovered(null)}
                                onClick={() => handleTemplate(t)}
                                style={{
                                    borderRadius: 14, border: "1px solid", cursor: "pointer", overflow: "hidden",
                                    borderColor: hovered === t.id ? "var(--primary)" : "var(--border)",
                                    background: "var(--surface)", transition: "all 0.15s",
                                    boxShadow: hovered === t.id ? "0 6px 24px rgba(0,0,0,0.2)" : "none",
                                    transform: hovered === t.id ? "translateY(-2px)" : "none",
                                }}>
                                <div style={{
                                    height: 6,
                                    background: t.category === "blank"
                                        ? "color-mix(in srgb, var(--border) 60%, transparent)"
                                        : "linear-gradient(90deg, var(--primary), var(--accent))",
                                }} />
                                <div style={{ padding: "14px 16px" }}>
                                    <h3 style={{ margin: "0 0 4px", fontSize: "0.94rem", fontWeight: 700 }}>{t.name}</h3>
                                    <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-muted)" }}>{t.description}</p>
                                    {hovered === t.id && (
                                        <button style={{ ...primaryBtn, marginTop: 12, width: "100%" }}>Use template</button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {showNewProject && (
                <NewProjectModal myRole={myRole} token={token!} tenantId={currentTenant?.id ?? ""}
                    onCreated={p => { setProjects(prev => [...prev, p]); setShowNewProject(false); }}
                    onClose={() => setShowNewProject(false)} />
            )}
        </div>
    );
}

// Shared styles
const labelStyle: React.CSSProperties = {
    display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)",
    marginBottom: 6, marginTop: 16,
};
const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid var(--border)",
    background: "color-mix(in srgb, var(--bg) 60%, var(--surface))",
    color: "var(--text)", fontSize: "0.92rem", outline: "none",
    transition: "border-color 0.15s",
};
const primaryBtn: React.CSSProperties = {
    padding: "9px 22px", borderRadius: 9, border: "none", cursor: "pointer", fontWeight: 700,
    background: "linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--primary) 70%, var(--accent)))",
    color: "#fff", fontSize: "0.88rem",
};
const ghostBtn: React.CSSProperties = {
    padding: "8px 18px", borderRadius: 9, cursor: "pointer", fontWeight: 600, fontSize: "0.88rem",
    background: "transparent", border: "1px solid var(--border)", color: "var(--text)",
};
