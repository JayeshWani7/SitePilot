"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

interface Subscription {
    id: string;
    status: string;
    current_period_start: string;
    current_period_end: string;
    name: string;
    description: string;
    max_users: number;
    max_projects: number;
    max_domains: number;
    max_traffic_gb: number;
    features: Record<string, boolean>;
    price_monthly: number;
}

interface Plan {
    id: string;
    name: string;
    description: string;
    max_users: number;
    max_projects: number;
    max_domains: number;
    max_traffic_gb: number;
    features: Record<string, boolean>;
    price_monthly: number | null;
    price_annual: number | null;
}

const PLAN_COLORS: Record<string, string> = {
    Free: "var(--text-muted)",
    Starter: "var(--accent)",
    Pro: "var(--primary)",
    Enterprise: "#f4b942",
};

export default function SubscriptionPanel() {
    const { currentTenant, token } = useAuth();
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

    useEffect(() => {
        if (!currentTenant || !token) return;
        fetchData();
    }, [currentTenant, token]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        const headers = {
            Authorization: `Bearer ${token}`,
            "x-tenant-id": currentTenant!.id,
        };
        try {
            const [subRes, plansRes] = await Promise.all([
                fetch(`${API_BASE_URL}/auth/tenants/${currentTenant!.id}/subscription`, { headers }),
                fetch(`${API_BASE_URL}/auth/subscription-plans`, { headers }),
            ]);

            if (subRes.ok) {
                const subData = await subRes.json();
                setSubscription(subData);
            }
            if (plansRes.ok) {
                const plansData = await plansRes.json();
                setPlans(plansData);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load subscription data");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 200 }}>
                <p style={{ color: "var(--text-muted)" }}>Loading subscription...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="sp-card" style={{ borderColor: "var(--danger)", background: "color-mix(in srgb, var(--danger) 10%, transparent)" }}>
                <p style={{ color: "var(--danger)", margin: 0 }}>{error}</p>
            </div>
        );
    }

    return (
        <div style={{ display: "grid", gap: 24 }}>
            {/* Current Plan */}
            {subscription && (
                <div className="sp-card">
                    <div className="sp-panel-head">
                        <h2 style={{ margin: 0 }}>Current Plan</h2>
                        <span
                            className="sp-pill"
                            style={{
                                borderColor: subscription.status === "active" ? "var(--accent)" : "var(--danger)",
                                color: subscription.status === "active" ? "var(--accent)" : "var(--danger)",
                            }}
                        >
                            {subscription.status}
                        </span>
                    </div>

                    <div style={{ marginTop: 16 }}>
                        <h3 style={{ margin: "0 0 4px", fontSize: "1.6rem", color: PLAN_COLORS[subscription.name] || "var(--primary)" }}>
                            {subscription.name}
                        </h3>
                        {subscription.description && (
                            <p className="sp-muted" style={{ marginBottom: 16 }}>{subscription.description}</p>
                        )}

                        <div className="sp-kpi-grid">
                            {[
                                { label: "Max Users", value: subscription.max_users ?? "Unlimited" },
                                { label: "Max Projects", value: subscription.max_projects ?? "Unlimited" },
                                { label: "Max Domains", value: subscription.max_domains ?? "Unlimited" },
                                { label: "Bandwidth", value: subscription.max_traffic_gb ? `${subscription.max_traffic_gb} GB` : "Unlimited" },
                            ].map((stat) => (
                                <article key={stat.label} className="sp-kpi">
                                    <h3>{stat.label}</h3>
                                    <p style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--text)", margin: "4px 0 0" }}>
                                        {stat.value}
                                    </p>
                                </article>
                            ))}
                        </div>

                        <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                                Billing period: {new Date(subscription.current_period_start).toLocaleDateString()} –{" "}
                                {new Date(subscription.current_period_end).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Available Plans */}
            {plans.length > 0 && (
                <div>
                    <h2 style={{ marginBottom: 16 }}>Available Plans</h2>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                            gap: 16,
                        }}
                    >
                        {plans.map((plan) => {
                            const isCurrent = subscription?.name === plan.name;
                            const planColor = PLAN_COLORS[plan.name] || "var(--primary)";
                            return (
                                <div
                                    key={plan.id}
                                    className="sp-card"
                                    style={{
                                        border: isCurrent ? `2px solid ${planColor}` : undefined,
                                        position: "relative",
                                    }}
                                >
                                    {isCurrent && (
                                        <span
                                            className="sp-pill"
                                            style={{
                                                position: "absolute",
                                                top: 12,
                                                right: 12,
                                                borderColor: planColor,
                                                color: planColor,
                                                fontSize: "0.75rem",
                                            }}
                                        >
                                            Current
                                        </span>
                                    )}
                                    <h3 style={{ margin: "0 0 6px", color: planColor }}>{plan.name}</h3>
                                    {plan.description && (
                                        <p className="sp-muted" style={{ fontSize: "0.85rem", marginBottom: 12 }}>
                                            {plan.description}
                                        </p>
                                    )}

                                    <p style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--text)", margin: "8px 0" }}>
                                        {plan.price_monthly === null ? (
                                            <span>Free</span>
                                        ) : (
                                            <span>
                                                ${plan.price_monthly}
                                                <span style={{ fontSize: "0.9rem", color: "var(--text-muted)", fontWeight: 400 }}>/mo</span>
                                            </span>
                                        )}
                                    </p>

                                    <ul style={{ margin: "12px 0", padding: "0 0 0 16px", color: "var(--text-muted)", fontSize: "0.85rem", lineHeight: 1.8 }}>
                                        <li>{plan.max_users ?? "Unlimited"} users</li>
                                        <li>{plan.max_projects ?? "Unlimited"} projects</li>
                                        <li>{plan.max_domains ?? "Unlimited"} domains</li>
                                        {plan.max_traffic_gb && <li>{plan.max_traffic_gb} GB bandwidth</li>}
                                    </ul>

                                    <button
                                        className={`sp-btn ${isCurrent ? "sp-ghost" : "sp-primary"}`}
                                        style={{ width: "100%", marginTop: 8 }}
                                        disabled={isCurrent}
                                    >
                                        {isCurrent ? "Active Plan" : "Upgrade"}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
