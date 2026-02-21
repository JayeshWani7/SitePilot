"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

interface Tenant {
    id: string;
    slug: string;
    display_name: string;
    role: string;
    subscription_plan: string;
    subscription_status: string;
}

export default function AdminTenantsTable() {
    const { user, tenants, token, selectTenant, currentTenant } = useAuth();
    const [searchQuery, setSearchQuery] = useState("");

    // This component is for super admin overview of all available tenants from auth context
    const filtered = tenants.filter(
        (t) =>
            t.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const statusBadge = (status?: string) => {
        const s = status || "unknown";
        const color =
            s === "active" ? "var(--accent)" : s === "trialing" ? "var(--primary)" : "var(--danger)";
        return (
            <span
                style={{
                    padding: "3px 9px",
                    borderRadius: 999,
                    fontSize: "0.76rem",
                    fontWeight: 700,
                    border: `1px solid ${color}`,
                    color,
                    background: `color-mix(in srgb, ${color} 15%, transparent)`,
                }}
            >
                {s}
            </span>
        );
    };

    const planBadge = (plan?: string) => {
        const p = plan || "—";
        return (
            <span
                style={{
                    padding: "3px 9px",
                    borderRadius: 999,
                    fontSize: "0.76rem",
                    fontWeight: 600,
                    border: "1px solid var(--border)",
                    color: "var(--text-muted)",
                }}
            >
                {p}
            </span>
        );
    };

    const roleBadge = (role?: string) => {
        const r = role || "member";
        const color =
            r === "owner" ? "var(--primary)" : r === "administrator" ? "#f4b942" : "var(--text-muted)";
        return (
            <span
                style={{
                    padding: "3px 9px",
                    borderRadius: 999,
                    fontSize: "0.76rem",
                    fontWeight: 600,
                    border: `1px solid ${color}`,
                    color,
                    textTransform: "capitalize",
                }}
            >
                {r}
            </span>
        );
    };

    return (
        <div style={{ display: "grid", gap: 20 }}>
            {/* Header */}
            <div className="sp-panel-head">
                <div>
                    <h2 style={{ margin: 0 }}>Tenants Overview</h2>
                    <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                        {user?.isSuperAdmin ? "Super Admin · All accessible tenants" : "Your tenant memberships"}
                    </p>
                </div>
                <span className="sp-pill">{filtered.length} tenant{filtered.length !== 1 ? "s" : ""}</span>
            </div>

            {/* Search bar */}
            <div>
                <input
                    type="search"
                    placeholder="Search tenants..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ maxWidth: 320 }}
                />
            </div>

            {/* Tenants Table */}
            <div className="sp-card" style={{ padding: 0, overflow: "hidden" }}>
                <div className="sp-table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Organization</th>
                                <th>Slug</th>
                                <th>Your Role</th>
                                <th>Plan</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: "center", color: "var(--text-muted)", padding: 32 }}>
                                        {searchQuery ? "No tenants match your search" : "No tenants found"}
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((tenant) => (
                                    <tr
                                        key={tenant.id}
                                        style={{
                                            background:
                                                currentTenant?.id === tenant.id
                                                    ? "color-mix(in srgb, var(--primary) 8%, transparent)"
                                                    : undefined,
                                        }}
                                    >
                                        <td>
                                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                <div
                                                    style={{
                                                        width: 32,
                                                        height: 32,
                                                        borderRadius: 8,
                                                        background: "linear-gradient(135deg, var(--primary), var(--accent))",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        fontSize: "0.85rem",
                                                        fontWeight: 800,
                                                        color: "#fff",
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    {tenant.display_name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p style={{ margin: 0, fontWeight: 600, color: "var(--text)" }}>
                                                        {tenant.display_name}
                                                        {currentTenant?.id === tenant.id && (
                                                            <span
                                                                style={{
                                                                    marginLeft: 8,
                                                                    fontSize: "0.72rem",
                                                                    color: "var(--primary)",
                                                                    fontWeight: 600,
                                                                }}
                                                            >
                                                                Active
                                                            </span>
                                                        )}
                                                    </p>
                                                    <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "monospace" }}>
                                                        {tenant.id.slice(0, 8)}...
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <code style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                                                {tenant.slug || "—"}
                                            </code>
                                        </td>
                                        <td>{roleBadge(tenant.role)}</td>
                                        <td>{planBadge(tenant.subscription_plan)}</td>
                                        <td>{statusBadge(tenant.subscription_status)}</td>
                                        <td>
                                            <button
                                                className="sp-btn sp-ghost"
                                                style={{ fontSize: "0.82rem", padding: "5px 12px" }}
                                                onClick={() => selectTenant(tenant.id)}
                                                disabled={currentTenant?.id === tenant.id}
                                            >
                                                {currentTenant?.id === tenant.id ? "Active" : "Switch"}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
