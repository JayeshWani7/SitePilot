"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

interface Member {
    id: string;
    user_id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: "owner" | "administrator" | "editor" | "developer" | "viewer";
    joined_at: string;
}

const ROLES = ["viewer", "developer", "editor", "administrator", "owner"] as const;

const ROLE_META: Record<string, { color: string; desc: string }> = {
    owner: { color: "#f4b942", desc: "Full access including billing and user management" },
    administrator: { color: "var(--primary)", desc: "Can manage users, projects, and content" },
    editor: { color: "var(--accent)", desc: "Can create and edit content, manage projects" },
    developer: { color: "#a78bfa", desc: "Can edit content and access API" },
    viewer: { color: "var(--text-muted)", desc: "Read-only access to analytics and projects" },
};

export default function TenantUsersTable() {
    const { currentTenant, token } = useAuth();
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showInvite, setShowInvite] = useState(false);
    const [newEmail, setNewEmail] = useState("");
    const [newRole, setNewRole] = useState<string>("editor");
    const [adding, setAdding] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // Only owner/administrator can manage members
    const isAdmin = currentTenant?.role === "owner" || currentTenant?.role === "administrator";

    const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

    const getHeaders = () => ({
        Authorization: `Bearer ${token}`,
        "x-tenant-id": currentTenant!.id,
        "Content-Type": "application/json",
    });

    useEffect(() => {
        if (!currentTenant || !token) return;
        fetchMembers();
    }, [currentTenant, token]);

    const fetchMembers = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(
                `${API_BASE_URL}/auth/tenants/${currentTenant!.id}/members`,
                { headers: getHeaders() }
            );
            if (!res.ok) throw new Error("Failed to fetch members");
            setMembers(await res.json());
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load members");
        } finally {
            setLoading(false);
        }
    };

    const handleAddMember = async () => {
        if (!newEmail.trim()) return;
        setAdding(true);
        setError(null);
        try {
            const res = await fetch(
                `${API_BASE_URL}/auth/tenants/${currentTenant!.id}/members`,
                {
                    method: "POST",
                    headers: getHeaders(),
                    body: JSON.stringify({ email: newEmail.trim(), role: newRole }),
                }
            );
            if (!res.ok) {
                const d = await res.json();
                throw new Error(d.error || "Failed to add member");
            }
            setNewEmail("");
            setNewRole("editor");
            setShowInvite(false);
            setSuccess("Member added successfully");
            setTimeout(() => setSuccess(null), 3000);
            await fetchMembers();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to add member");
        } finally {
            setAdding(false);
        }
    };

    const handleRoleChange = async (userId: string, role: string) => {
        setError(null);
        try {
            const res = await fetch(
                `${API_BASE_URL}/auth/tenants/${currentTenant!.id}/members/${userId}/role`,
                {
                    method: "PUT",
                    headers: getHeaders(),
                    body: JSON.stringify({ role }),
                }
            );
            if (!res.ok) throw new Error("Failed to update role");
            setSuccess("Role updated");
            setTimeout(() => setSuccess(null), 2500);
            await fetchMembers();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update role");
        }
    };

    const handleRemove = async (userId: string) => {
        if (!confirm("Are you sure you want to remove this member?")) return;
        setError(null);
        try {
            const res = await fetch(
                `${API_BASE_URL}/auth/tenants/${currentTenant!.id}/members/${userId}`,
                { method: "DELETE", headers: getHeaders() }
            );
            if (!res.ok) throw new Error("Failed to remove member");
            setSuccess("Member removed");
            setTimeout(() => setSuccess(null), 2500);
            await fetchMembers();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to remove member");
        }
    };

    const filtered = members.filter(
        (m) =>
            m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            `${m.first_name} ${m.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const roleCounts = ROLES.reduce<Record<string, number>>((acc, r) => {
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
                        {currentTenant?.display_name} · {isAdmin ? "Manage users & roles" : "View team"}
                    </p>
                </div>
                {isAdmin && (
                    <button
                        className={`sp-btn ${showInvite ? "sp-ghost" : "sp-primary"}`}
                        style={{ fontSize: "0.88rem" }}
                        onClick={() => { setShowInvite((v) => !v); setError(null); }}
                    >
                        {showInvite ? "✕ Cancel" : "+ Invite Member"}
                    </button>
                )}
            </div>

            {/* Role distribution pills */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {ROLES.filter((r) => roleCounts[r] > 0).map((r) => (
                    <span
                        key={r}
                        style={{
                            padding: "4px 12px",
                            borderRadius: 999,
                            fontSize: "0.78rem",
                            fontWeight: 600,
                            border: `1px solid ${ROLE_META[r].color}`,
                            color: ROLE_META[r].color,
                            background: `color-mix(in srgb, ${ROLE_META[r].color} 12%, transparent)`,
                        }}
                    >
                        {roleCounts[r]} {r}{roleCounts[r] !== 1 ? "s" : ""}
                    </span>
                ))}
                <span className="sp-pill" style={{ marginLeft: "auto" }}>
                    {members.length} total
                </span>
            </div>

            {/* Toast-like messages */}
            {error && (
                <div className="sp-card" style={{ borderColor: "var(--danger)", background: "color-mix(in srgb, var(--danger) 10%, transparent)", padding: "10px 16px" }}>
                    <p style={{ color: "var(--danger)", margin: 0, fontSize: "0.9rem" }}>⚠ {error}</p>
                </div>
            )}
            {success && (
                <div className="sp-card" style={{ borderColor: "var(--accent)", background: "color-mix(in srgb, var(--accent) 10%, transparent)", padding: "10px 16px" }}>
                    <p style={{ color: "var(--accent)", margin: 0, fontSize: "0.9rem" }}>✓ {success}</p>
                </div>
            )}

            {/* Invite form — admin only */}
            {isAdmin && showInvite && (
                <div className="sp-card" style={{ borderColor: "color-mix(in srgb, var(--primary) 40%, var(--border))", background: "color-mix(in srgb, var(--primary) 6%, transparent)" }}>
                    <h3 style={{ margin: "0 0 14px" }}>Invite Team Member</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 10, alignItems: "end" }}>
                        <div>
                            <label style={{ marginBottom: 6, display: "block", fontSize: "0.82rem", color: "var(--text-muted)" }}>
                                Email address
                            </label>
                            <input
                                type="email"
                                placeholder="user@example.com"
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleAddMember()}
                            />
                        </div>
                        <div>
                            <label style={{ marginBottom: 6, display: "block", fontSize: "0.82rem", color: "var(--text-muted)" }}>
                                Role
                            </label>
                            <select value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                                {ROLES.filter((r) => r !== "owner").map((r) => (
                                    <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                                ))}
                            </select>
                        </div>
                        <button
                            className="sp-btn sp-primary"
                            onClick={handleAddMember}
                            disabled={adding || !newEmail.trim()}
                        >
                            {adding ? "Adding..." : "Add"}
                        </button>
                    </div>
                    {newRole && (
                        <p style={{ margin: "10px 0 0", fontSize: "0.82rem", color: "var(--text-muted)" }}>
                            {ROLE_META[newRole]?.desc}
                        </p>
                    )}
                </div>
            )}

            {/* Search */}
            <div>
                <input
                    type="search"
                    placeholder="Search members..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ maxWidth: 320 }}
                />
            </div>

            {/* Members Table */}
            <div className="sp-card" style={{ padding: 0, overflow: "hidden" }}>
                {loading ? (
                    <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
                        Loading team members...
                    </div>
                ) : (
                    <div className="sp-table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Member</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Joined</th>
                                    {isAdmin && <th>Actions</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} style={{ textAlign: "center", color: "var(--text-muted)", padding: 32 }}>
                                            {searchQuery ? "No members match your search" : "No team members yet"}
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((member) => {
                                        const roleMeta = ROLE_META[member.role];
                                        return (
                                            <tr key={member.id}>
                                                <td>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                        <div
                                                            style={{
                                                                width: 34,
                                                                height: 34,
                                                                borderRadius: "50%",
                                                                background: `linear-gradient(135deg, ${roleMeta.color}, var(--primary))`,
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                fontSize: "0.85rem",
                                                                fontWeight: 800,
                                                                color: "#fff",
                                                                flexShrink: 0,
                                                            }}
                                                        >
                                                            {(member.first_name || member.email).charAt(0).toUpperCase()}
                                                        </div>
                                                        <p style={{ margin: 0, fontWeight: 600, color: "var(--text)" }}>
                                                            {member.first_name || ""} {member.last_name || ""}
                                                            {!member.first_name && !member.last_name && (
                                                                <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>—</span>
                                                            )}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                                                        {member.email}
                                                    </span>
                                                </td>
                                                <td>
                                                    {isAdmin ? (
                                                        <select
                                                            value={member.role}
                                                            onChange={(e) => handleRoleChange(member.user_id, e.target.value)}
                                                            style={{
                                                                width: "auto",
                                                                padding: "5px 10px",
                                                                fontSize: "0.85rem",
                                                                fontWeight: 600,
                                                                color: roleMeta.color,
                                                                border: `1px solid ${roleMeta.color}`,
                                                                background: `color-mix(in srgb, ${roleMeta.color} 12%, var(--bg-elevated))`,
                                                                borderRadius: 8,
                                                            }}
                                                        >
                                                            {ROLES.map((r) => (
                                                                <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                                                            ))}
                                                        </select>
                                                    ) : (
                                                        <span style={{
                                                            padding: "4px 10px",
                                                            borderRadius: 8,
                                                            fontSize: "0.85rem",
                                                            fontWeight: 600,
                                                            color: roleMeta.color,
                                                            border: `1px solid ${roleMeta.color}`,
                                                            background: `color-mix(in srgb, ${roleMeta.color} 12%, transparent)`,
                                                            textTransform: "capitalize",
                                                        }}>
                                                            {member.role}
                                                        </span>
                                                    )}
                                                </td>
                                                <td style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                                                    {new Date(member.joined_at).toLocaleDateString()}
                                                </td>
                                                {isAdmin && (
                                                    <td>
                                                        <button
                                                            className="sp-btn"
                                                            style={{
                                                                color: "var(--danger)",
                                                                border: "1px solid var(--danger)",
                                                                background: "transparent",
                                                                padding: "5px 12px",
                                                                fontSize: "0.82rem",
                                                            }}
                                                            onClick={() => handleRemove(member.user_id)}
                                                        >
                                                            Remove
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Role Key */}
            <div className="sp-card">
                <h3 style={{ margin: "0 0 12px" }}>Role Permissions</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
                    {ROLES.slice().reverse().map((role) => (
                        <div
                            key={role}
                            style={{
                                padding: "10px 14px",
                                borderRadius: 10,
                                border: `1px solid ${ROLE_META[role].color}`,
                                background: `color-mix(in srgb, ${ROLE_META[role].color} 8%, transparent)`,
                            }}
                        >
                            <p style={{ margin: "0 0 4px", fontWeight: 700, color: ROLE_META[role].color, textTransform: "capitalize" }}>
                                {role}
                            </p>
                            <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)" }}>
                                {ROLE_META[role].desc}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
