"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

type Role = "owner" | "administrator" | "editor" | "developer" | "viewer";

interface Member {
    id: string;
    user_id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: Role;
    joined_at: string;
}

// ── Role hierarchy ───────────────────────────────────────────────────
const ROLE_LEVEL: Record<string, number> = {
    viewer: 1, developer: 2, editor: 3, administrator: 4, owner: 5,
};
const ROLES_ASC = ["viewer", "developer", "editor", "administrator", "owner"] as const;

const ROLE_META: Record<Role, { color: string; icon: string; desc: string; capabilities: string[] }> = {
    owner: {
        color: "#f4b942",
        icon: "👑",
        desc: "Full platform access including billing, settings, and all management",
        capabilities: ["Invite & remove members", "Change any role", "Manage billing & subscription", "Enable/disable features", "View all analytics", "Delete workspace", "Access API & developer tools", "Create & publish content"],
    },
    administrator: {
        color: "var(--primary)",
        icon: "🛡",
        desc: "Manage users, projects, content, and all operational settings",
        capabilities: ["Invite & remove members", "Change roles (up to administrator)", "Enable/disable features", "View all analytics & alerts", "Access API & developer tools", "Create & publish content", "Manage domains"],
    },
    editor: {
        color: "var(--accent)",
        icon: "✏️",
        desc: "Create, edit, and publish content. Respond to usage alerts",
        capabilities: ["Create & edit content", "Publish content", "View usage alerts", "View analytics", "Manage projects"],
    },
    developer: {
        color: "#a78bfa",
        icon: "⚙️",
        desc: "API access, technical configuration, and usage monitoring",
        capabilities: ["View & use API tokens", "View usage metrics", "View analytics", "Access developer settings", "Create content drafts"],
    },
    viewer: {
        color: "var(--text-muted)",
        icon: "👁",
        desc: "Read-only access to projects, team list, and basic analytics",
        capabilities: ["View team members", "View projects", "View basic analytics"],
    },
};

// Can `myRole` manage `targetRole`?
function canManage(myRole: string, targetRole: string) {
    return ROLE_LEVEL[myRole] > ROLE_LEVEL[targetRole];
}

// Roles that `myRole` can assign (must be strictly below myRole)
function assignableRoles(myRole: string): Role[] {
    return ROLES_ASC.filter((r) => ROLE_LEVEL[r] < ROLE_LEVEL[myRole]) as Role[];
}

export default function TenantUsersTable() {
    const { currentTenant, token } = useAuth();
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showInvite, setShowInvite] = useState(false);
    const [newEmail, setNewEmail] = useState("");
    const [newRole, setNewRole] = useState<Role>("editor");
    const [adding, setAdding] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterRole, setFilterRole] = useState<string>("all");
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [activeView, setActiveView] = useState<"list" | "hierarchy" | "matrix">("list");

    const myRole = currentTenant?.role ?? "viewer";
    const myLevel = ROLE_LEVEL[myRole] ?? 0;
    const isAdmin = myLevel >= 4; // owner or administrator can manage

    const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";
    const headers = {
        Authorization: `Bearer ${token}`,
        "x-tenant-id": currentTenant?.id ?? "",
        "Content-Type": "application/json",
    };

    useEffect(() => {
        if (!currentTenant || !token) return;
        fetchMembers();
    }, [currentTenant, token]);

    async function fetchMembers() {
        setLoading(true); setError(null);
        try {
            const res = await fetch(`${API}/auth/tenants/${currentTenant!.id}/members`, { headers });
            if (!res.ok) throw new Error("Failed to fetch members");
            setMembers(await res.json());
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to load members");
        } finally { setLoading(false); }
    }

    async function handleAddMember() {
        if (!newEmail.trim()) return;
        setAdding(true); setError(null);
        try {
            const res = await fetch(`${API}/auth/tenants/${currentTenant!.id}/members`, {
                method: "POST", headers,
                body: JSON.stringify({ email: newEmail.trim(), role: newRole }),
            });
            if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed to add"); }
            setNewEmail(""); setShowInvite(false);
            setSuccess("Member added!"); setTimeout(() => setSuccess(null), 3000);
            await fetchMembers();
        } catch (e) { setError(e instanceof Error ? e.message : "Failed to add"); }
        finally { setAdding(false); }
    }

    async function handleRoleChange(userId: string, role: string) {
        setError(null);
        try {
            const res = await fetch(`${API}/auth/tenants/${currentTenant!.id}/members/${userId}/role`, {
                method: "PUT", headers, body: JSON.stringify({ role }),
            });
            if (!res.ok) throw new Error("Failed to update role");
            setSuccess("Role updated"); setTimeout(() => setSuccess(null), 2500);
            // Update selected member too
            if (selectedMember?.user_id === userId) setSelectedMember(prev => prev ? { ...prev, role: role as Role } : null);
            await fetchMembers();
        } catch (e) { setError(e instanceof Error ? e.message : "Failed to update"); }
    }

    async function handleRemove(userId: string) {
        if (!confirm("Remove this member from the workspace?")) return;
        try {
            const res = await fetch(`${API}/auth/tenants/${currentTenant!.id}/members/${userId}`, { method: "DELETE", headers });
            if (!res.ok) throw new Error("Failed to remove");
            setSuccess("Member removed"); setTimeout(() => setSuccess(null), 2500);
            if (selectedMember?.user_id === userId) setSelectedMember(null);
            await fetchMembers();
        } catch (e) { setError(e instanceof Error ? e.message : "Failed to remove"); }
    }

    const filtered = members
        .filter((m) => filterRole === "all" || m.role === filterRole)
        .filter((m) =>
            m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            `${m.first_name} ${m.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
        );

    const roleCounts = ROLES_ASC.reduce<Record<string, number>>((acc, r) => {
        acc[r] = members.filter((m) => m.role === r).length;
        return acc;
    }, {});

    return (
        <div style={{ display: "grid", gap: 20 }}>
            {/* Header */}
            <div className="sp-panel-head">
                <div>
                    <h2 style={{ margin: 0 }}>Team Members</h2>
                    <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                        {currentTenant?.display_name} · {members.length} members ·{" "}
                        <span style={{ textTransform: "capitalize", color: ROLE_META[myRole as Role]?.color ?? "inherit" }}>
                            {ROLE_META[myRole as Role]?.icon} You are {myRole}
                        </span>
                    </p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                    {/* View toggles */}
                    {(["list", "hierarchy", "matrix"] as const).map((v) => (
                        <button key={v} onClick={() => setActiveView(v)} className={`sp-btn ${activeView === v ? "sp-secondary" : "sp-ghost"}`}
                            style={{ padding: "5px 12px", fontSize: "0.8rem", textTransform: "capitalize" }}>
                            {v === "list" ? "📋 List" : v === "hierarchy" ? "🏗 Hierarchy" : "📐 Matrix"}
                        </button>
                    ))}
                    {isAdmin && (
                        <button className={`sp-btn ${showInvite ? "sp-ghost" : "sp-primary"}`} style={{ fontSize: "0.88rem" }}
                            onClick={() => { setShowInvite(v => !v); setError(null); }}>
                            {showInvite ? "✕ Cancel" : "+ Invite Member"}
                        </button>
                    )}
                </div>
            </div>

            {/* Role distribution pills */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                <button onClick={() => setFilterRole("all")} style={{
                    padding: "4px 12px", borderRadius: 999, fontSize: "0.78rem", fontWeight: 600, cursor: "pointer",
                    border: "1px solid", borderColor: filterRole === "all" ? "var(--primary)" : "var(--border)",
                    background: filterRole === "all" ? "color-mix(in srgb, var(--primary) 15%, transparent)" : "transparent",
                    color: filterRole === "all" ? "var(--text)" : "var(--text-muted)",
                }}>All ({members.length})</button>
                {ROLES_ASC.slice().reverse().filter(r => roleCounts[r] > 0).map((r) => (
                    <button key={r} onClick={() => setFilterRole(filterRole === r ? "all" : r)} style={{
                        padding: "4px 12px", borderRadius: 999, fontSize: "0.78rem", fontWeight: 600, cursor: "pointer",
                        border: `1px solid ${ROLE_META[r as Role].color}`,
                        color: ROLE_META[r as Role].color,
                        background: filterRole === r
                            ? `color-mix(in srgb, ${ROLE_META[r as Role].color} 25%, transparent)`
                            : `color-mix(in srgb, ${ROLE_META[r as Role].color} 10%, transparent)`,
                    }}>
                        {ROLE_META[r as Role].icon} {r} ({roleCounts[r]})
                    </button>
                ))}
            </div>

            {/* Toasts */}
            {error && (
                <div className="sp-card" style={{ borderColor: "var(--danger)", background: "color-mix(in srgb, var(--danger) 10%, transparent)", padding: "10px 16px" }}>
                    <p style={{ color: "var(--danger)", margin: 0 }}>⚠ {error}</p>
                </div>
            )}
            {success && (
                <div className="sp-card" style={{ borderColor: "var(--accent)", background: "color-mix(in srgb, var(--accent) 10%, transparent)", padding: "10px 16px" }}>
                    <p style={{ color: "var(--accent)", margin: 0 }}>✓ {success}</p>
                </div>
            )}

            {/* Invite form */}
            {isAdmin && showInvite && (
                <div className="sp-card" style={{ borderColor: "color-mix(in srgb, var(--primary) 40%, var(--border))", background: "color-mix(in srgb, var(--primary) 6%, transparent)" }}>
                    <h3 style={{ margin: "0 0 14px" }}>Invite Team Member</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 10, alignItems: "end" }}>
                        <div>
                            <label style={{ marginBottom: 6, display: "block", fontSize: "0.82rem", color: "var(--text-muted)" }}>Email address</label>
                            <input type="email" placeholder="user@example.com" value={newEmail} onChange={e => setNewEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAddMember()} />
                        </div>
                        <div>
                            <label style={{ marginBottom: 6, display: "block", fontSize: "0.82rem", color: "var(--text-muted)" }}>Role to assign</label>
                            <select value={newRole} onChange={e => setNewRole(e.target.value as Role)}>
                                {assignableRoles(myRole).reverse().map(r => (
                                    <option key={r} value={r}>{ROLE_META[r].icon} {r.charAt(0).toUpperCase() + r.slice(1)}</option>
                                ))}
                            </select>
                        </div>
                        <button className="sp-btn sp-primary" onClick={handleAddMember} disabled={adding || !newEmail.trim()}>
                            {adding ? "Adding…" : "Add"}
                        </button>
                    </div>
                    <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center" }}>
                        <span style={{ fontSize: "0.8rem", color: ROLE_META[newRole].color }}>{ROLE_META[newRole].icon}</span>
                        <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-muted)" }}>{ROLE_META[newRole].desc}</p>
                    </div>
                </div>
            )}

            {/* ── VIEW: LIST ──────────────────────────────────────────────── */}
            {activeView === "list" && (
                <div style={{ display: "grid", gap: 12 }}>
                    <div>
                        <input type="search" placeholder="Search members…" value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)} style={{ maxWidth: 320 }} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: selectedMember ? "1fr 340px" : "1fr", gap: 16, alignItems: "start" }}>
                        {/* Member table */}
                        <div className="sp-card" style={{ padding: 0, overflow: "hidden" }}>
                            {loading ? (
                                <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Loading members…</div>
                            ) : (
                                <div className="sp-table-wrap">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Member</th>
                                                <th>Email</th>
                                                <th>Role</th>
                                                <th>Joined</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filtered.length === 0 ? (
                                                <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--text-muted)", padding: 32 }}>
                                                    {searchQuery ? "No members match your search" : "No team members yet"}
                                                </td></tr>
                                            ) : filtered.map((m) => {
                                                const rm = ROLE_META[m.role];
                                                const isSelf = m.email === (currentTenant as { email?: string })?.email;
                                                const canMgr = isAdmin && canManage(myRole, m.role) && !isSelf;
                                                const isSelected = selectedMember?.user_id === m.user_id;
                                                return (
                                                    <tr key={m.id} onClick={() => setSelectedMember(isSelected ? null : m)}
                                                        style={{ cursor: "pointer", background: isSelected ? "color-mix(in srgb, var(--primary) 8%, transparent)" : "" }}>
                                                        <td>
                                                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                                <div style={{
                                                                    width: 34, height: 34, borderRadius: "50%",
                                                                    background: `linear-gradient(135deg, ${rm.color}, var(--primary))`,
                                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                                    fontSize: "0.85rem", fontWeight: 800, color: "#fff", flexShrink: 0,
                                                                }}>
                                                                    {(m.first_name || m.email).charAt(0).toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <p style={{ margin: 0, fontWeight: 600, color: "var(--text)", fontSize: "0.9rem" }}>
                                                                        {m.first_name || ""} {m.last_name || ""}
                                                                        {!m.first_name && !m.last_name && <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>—</span>}
                                                                    </p>
                                                                    {isSelf && <span style={{ fontSize: "0.7rem", color: "var(--primary)", fontWeight: 700 }}>You</span>}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td><span style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>{m.email}</span></td>
                                                        <td>
                                                            {canMgr ? (
                                                                <select value={m.role} onClick={e => e.stopPropagation()}
                                                                    onChange={e => { e.stopPropagation(); handleRoleChange(m.user_id, e.target.value); }}
                                                                    style={{
                                                                        width: "auto", padding: "5px 10px", fontSize: "0.85rem", fontWeight: 600,
                                                                        color: rm.color, border: `1px solid ${rm.color}`,
                                                                        background: `color-mix(in srgb, ${rm.color} 12%, var(--bg-elevated))`, borderRadius: 8
                                                                    }}>
                                                                    {assignableRoles(myRole).reverse().map(r => (
                                                                        <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                                                                    ))}
                                                                    {/* Also show own role if not in assignable */}
                                                                    {!assignableRoles(myRole).includes(m.role) && (
                                                                        <option value={m.role}>{m.role.charAt(0).toUpperCase() + m.role.slice(1)}</option>
                                                                    )}
                                                                </select>
                                                            ) : (
                                                                <span style={{
                                                                    padding: "4px 10px", borderRadius: 8, fontSize: "0.85rem", fontWeight: 600,
                                                                    color: rm.color, border: `1px solid ${rm.color}`,
                                                                    background: `color-mix(in srgb, ${rm.color} 12%, transparent)`,
                                                                    textTransform: "capitalize", display: "inline-flex", alignItems: "center", gap: 4,
                                                                }}>
                                                                    {rm.icon} {m.role}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                                                            {new Date(m.joined_at).toLocaleDateString()}
                                                        </td>
                                                        <td onClick={e => e.stopPropagation()}>
                                                            <div style={{ display: "flex", gap: 6 }}>
                                                                <button className="sp-btn sp-ghost" style={{ padding: "4px 10px", fontSize: "0.8rem" }}
                                                                    onClick={() => setSelectedMember(isSelected ? null : m)}>
                                                                    {isSelected ? "Close" : "Details"}
                                                                </button>
                                                                {canMgr && (
                                                                    <button className="sp-btn" style={{ color: "var(--danger)", border: "1px solid var(--danger)", background: "transparent", padding: "4px 10px", fontSize: "0.8rem" }}
                                                                        onClick={() => handleRemove(m.user_id)}>
                                                                        Remove
                                                                    </button>
                                                                )}
                                                                {!canMgr && !isSelf && (
                                                                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", padding: "4px 0" }}>
                                                                        {m.role === myRole ? "Same level" : "Higher role"}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Member detail panel */}
                        {selectedMember && (
                            <MemberDetailPanel
                                member={selectedMember}
                                myRole={myRole}
                                onRoleChange={handleRoleChange}
                                onRemove={handleRemove}
                                onClose={() => setSelectedMember(null)}
                            />
                        )}
                    </div>
                </div>
            )}

            {/* ── VIEW: HIERARCHY ──────────────────────────────────────────── */}
            {activeView === "hierarchy" && (
                <div className="sp-card" style={{ padding: 24 }}>
                    <h3 style={{ margin: "0 0 20px" }}>Role Hierarchy</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {ROLES_ASC.slice().reverse().map((role, i) => {
                            const rm = ROLE_META[role as Role];
                            const roleMembers = members.filter(m => m.role === role);
                            const isMyRole = role === myRole;
                            return (
                                <div key={role} style={{
                                    display: "flex", gap: 16, padding: 16, borderRadius: 12,
                                    border: `1px solid ${isMyRole ? rm.color : "var(--border)"}`,
                                    background: isMyRole
                                        ? `color-mix(in srgb, ${rm.color} 10%, var(--surface))`
                                        : "var(--surface)",
                                    position: "relative",
                                }}>
                                    {/* Level indicator */}
                                    <div style={{
                                        width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                                        background: `linear-gradient(135deg, ${rm.color}, color-mix(in srgb, ${rm.color} 60%, var(--primary)))`,
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: "1.2rem", fontWeight: 800,
                                    }}>
                                        {rm.icon}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                            <span style={{ fontWeight: 700, textTransform: "capitalize", color: rm.color, fontSize: "1rem" }}>{role}</span>
                                            <span style={{ fontSize: "0.72rem", background: `color-mix(in srgb, ${rm.color} 20%, transparent)`, color: rm.color, borderRadius: 999, padding: "1px 7px", fontWeight: 700 }}>
                                                Level {5 - i}
                                            </span>
                                            {isMyRole && <span style={{ fontSize: "0.7rem", background: "var(--primary)", color: "#fff", borderRadius: 999, padding: "1px 7px", fontWeight: 700 }}>YOU</span>}
                                        </div>
                                        <p style={{ margin: "0 0 8px", fontSize: "0.83rem", color: "var(--text-muted)" }}>{rm.desc}</p>
                                        {/* Member avatars */}
                                        {roleMembers.length > 0 && (
                                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                                {roleMembers.map(m => (
                                                    <div key={m.id} onClick={() => { setSelectedMember(m); setActiveView("list"); }}
                                                        title={`${m.first_name || ""} ${m.last_name || ""} (${m.email})`}
                                                        style={{
                                                            width: 28, height: 28, borderRadius: "50%", cursor: "pointer",
                                                            background: `linear-gradient(135deg, ${rm.color}, var(--primary))`,
                                                            display: "flex", alignItems: "center", justifyContent: "center",
                                                            fontSize: "0.72rem", fontWeight: 800, color: "#fff",
                                                            border: `2px solid color-mix(in srgb, ${rm.color} 60%, var(--border))`,
                                                        }}>
                                                        {(m.first_name || m.email).charAt(0).toUpperCase()}
                                                    </div>
                                                ))}
                                                <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", alignSelf: "center" }}>
                                                    {roleMembers.length === 1
                                                        ? (roleMembers[0].first_name || roleMembers[0].email.split("@")[0])
                                                        : `${roleMembers.length} ${role}s`}
                                                </span>
                                            </div>
                                        )}
                                        {roleMembers.length === 0 && <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontStyle: "italic" }}>No members at this level</span>}
                                    </div>
                                    {/* Connector */}
                                    {i < ROLES_ASC.length - 1 && (
                                        <div style={{ position: "absolute", bottom: -13, left: 28, width: 2, height: 12, background: "var(--border)", zIndex: 1 }} />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── VIEW: MATRIX ────────────────────────────────────────────── */}
            {activeView === "matrix" && (
                <div className="sp-card" style={{ padding: 0, overflow: "hidden" }}>
                    <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid var(--border)" }}>
                        <h3 style={{ margin: 0 }}>Permissions Matrix</h3>
                        <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: "var(--text-muted)" }}>
                            What each role can do in this workspace
                        </p>
                    </div>
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.83rem" }}>
                            <thead>
                                <tr>
                                    <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid var(--border)", background: "var(--bg-elevated)" }}>
                                        Capability
                                    </th>
                                    {ROLES_ASC.slice().reverse().map(role => (
                                        <th key={role} style={{ padding: "12px 14px", textAlign: "center", borderBottom: "1px solid var(--border)", background: "var(--bg-elevated)" }}>
                                            <div style={{ color: ROLE_META[role as Role].color, fontWeight: 700, textTransform: "capitalize" }}>
                                                {ROLE_META[role as Role].icon}
                                            </div>
                                            <div style={{ color: ROLE_META[role as Role].color, fontWeight: 700, textTransform: "capitalize", fontSize: "0.78rem" }}>{role}</div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    { cap: "View team members", levels: [1, 2, 3, 4, 5] },
                                    { cap: "View projects", levels: [1, 2, 3, 4, 5] },
                                    { cap: "View analytics", levels: [2, 3, 4, 5] },
                                    { cap: "View usage metrics", levels: [2, 3, 4, 5] },
                                    { cap: "Create content drafts", levels: [2, 3, 4, 5] },
                                    { cap: "Publish content", levels: [3, 4, 5] },
                                    { cap: "Manage projects", levels: [3, 4, 5] },
                                    { cap: "View usage alerts", levels: [3, 4, 5] },
                                    { cap: "Manage domains", levels: [4, 5] },
                                    { cap: "Invite members", levels: [4, 5] },
                                    { cap: "Change member roles", levels: [4, 5] },
                                    { cap: "Enable feature flags", levels: [4, 5] },
                                    { cap: "Remove members", levels: [4, 5] },
                                    { cap: "View billing", levels: [5] },
                                    { cap: "Manage billing", levels: [5] },
                                    { cap: "Delete workspace", levels: [5] },
                                    { cap: "Transfer ownership", levels: [5] },
                                ].map((row, ri) => (
                                    <tr key={row.cap} style={{ background: ri % 2 === 0 ? "transparent" : "color-mix(in srgb, var(--border) 20%, transparent)" }}>
                                        <td style={{ padding: "10px 16px", color: "var(--text)", borderBottom: "1px solid color-mix(in srgb, var(--border) 40%, transparent)" }}>
                                            {row.cap}
                                        </td>
                                        {ROLES_ASC.slice().reverse().map(role => {
                                            const lvl = ROLE_LEVEL[role];
                                            const allowed = row.levels.includes(lvl);
                                            const isMe = role === myRole;
                                            return (
                                                <td key={role} style={{
                                                    padding: "10px 14px", textAlign: "center",
                                                    borderBottom: "1px solid color-mix(in srgb, var(--border) 40%, transparent)",
                                                    background: isMe ? `color-mix(in srgb, ${ROLE_META[role as Role].color} 6%, transparent)` : "",
                                                }}>
                                                    <span style={{ fontSize: "1rem" }}>
                                                        {allowed ? (
                                                            <span style={{ color: "var(--accent)", fontWeight: 700 }}>✓</span>
                                                        ) : (
                                                            <span style={{ color: "var(--text-muted)", opacity: 0.4 }}>—</span>
                                                        )}
                                                    </span>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Member detail side panel ─────────────────────────────────────────
function MemberDetailPanel({
    member, myRole, onRoleChange, onRemove, onClose,
}: {
    member: Member;
    myRole: string;
    onRoleChange: (userId: string, role: string) => void;
    onRemove: (userId: string) => void;
    onClose: () => void;
}) {
    const rm = ROLE_META[member.role];
    const canMgr = (ROLE_LEVEL[myRole] ?? 0) > (ROLE_LEVEL[member.role] ?? 0);

    return (
        <div className="sp-card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
                <h3 style={{ margin: 0 }}>Member Details</h3>
                <button className="sp-btn sp-ghost" style={{ padding: "2px 8px" }} onClick={onClose}>✕</button>
            </div>

            {/* Avatar + name */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "12px 0" }}>
                <div style={{
                    width: 64, height: 64, borderRadius: "50%",
                    background: `linear-gradient(135deg, ${rm.color}, var(--primary))`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "1.8rem", fontWeight: 800, color: "#fff",
                    boxShadow: `0 0 0 4px color-mix(in srgb, ${rm.color} 25%, transparent)`,
                }}>
                    {(member.first_name || member.email).charAt(0).toUpperCase()}
                </div>
                <div style={{ textAlign: "center" }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: "1rem" }}>
                        {member.first_name ? `${member.first_name} ${member.last_name || ""}` : "—"}
                    </p>
                    <p style={{ margin: "2px 0 0", fontSize: "0.82rem", color: "var(--text-muted)" }}>{member.email}</p>
                </div>
                <span style={{
                    padding: "4px 14px", borderRadius: 999, fontSize: "0.82rem", fontWeight: 700,
                    color: rm.color, border: `1px solid ${rm.color}`, textTransform: "capitalize",
                    background: `color-mix(in srgb, ${rm.color} 15%, transparent)`,
                }}>
                    {rm.icon} {member.role}
                </span>
            </div>

            {/* Info */}
            <div style={{ display: "grid", gap: 8 }}>
                <InfoRow label="Joined" value={new Date(member.joined_at).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })} />
                <InfoRow label="Level" value={`L${ROLE_LEVEL[member.role]} — ${member.role}`} />
                <InfoRow label="Access" value={rm.desc} />
            </div>

            {/* Capabilities */}
            <div>
                <p style={{ margin: "0 0 8px", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)" }}>
                    Capabilities
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {rm.capabilities.map((c) => (
                        <div key={c} style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                            <span style={{ color: "var(--accent)", flexShrink: 0, marginTop: 2 }}>✓</span>
                            <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>{c}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Actions for admins */}
            {canMgr && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 8, borderTop: "1px solid var(--border)" }}>
                    <p style={{ margin: "0 0 4px", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)" }}>
                        Change Role
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {assignableRoles(myRole).reverse().map(r => (
                            <button key={r} onClick={() => onRoleChange(member.user_id, r)}
                                className={`sp-btn ${member.role === r ? "sp-secondary" : "sp-ghost"}`}
                                style={{
                                    fontSize: "0.78rem", padding: "4px 10px", textTransform: "capitalize",
                                    color: member.role === r ? ROLE_META[r].color : undefined,
                                    borderColor: member.role === r ? ROLE_META[r].color : undefined,
                                }}>
                                {ROLE_META[r].icon} {r}
                            </button>
                        ))}
                    </div>
                    <button className="sp-btn" style={{ width: "100%", color: "var(--danger)", border: "1px solid var(--danger)", background: "transparent", marginTop: 4 }}
                        onClick={() => { onRemove(member.user_id); onClose(); }}>
                        Remove from workspace
                    </button>
                </div>
            )}
        </div>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div style={{ display: "flex", gap: 8 }}>
            <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", minWidth: 60 }}>{label}</span>
            <span style={{ fontSize: "0.82rem", color: "var(--text)", flex: 1 }}>{value}</span>
        </div>
    );
}

