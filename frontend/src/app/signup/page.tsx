"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function SignupPage() {
  const router = useRouter();
  const { signup, user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Already logged in → go straight to dashboard
  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/dashboard");
    }
  }, [authLoading, user]);

  if (authLoading || user) return null;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signup(email, password, firstName, lastName, tenantName);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 16px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 460 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 52,
              height: 52,
              borderRadius: 14,
              background: "linear-gradient(135deg, var(--primary), var(--accent))",
              marginBottom: 16,
              boxShadow: "0 0 0 10px color-mix(in srgb, var(--primary) 15%, transparent)",
            }}
          >
            <span style={{ fontSize: "1.4rem" }}>🚀</span>
          </div>
          <h1 style={{ margin: "0 0 6px", fontSize: "1.7rem" }}>Create your account</h1>
          <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Start your SitePilot journey
          </p>
        </div>

        <div className="sp-card">
          {error && (
            <div
              style={{
                marginBottom: 16,
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px solid var(--danger)",
                background: "color-mix(in srgb, var(--danger) 12%, transparent)",
                color: "var(--danger)",
                fontSize: "0.88rem",
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="sp-form">
            {/* Name row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <label>
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 500 }}>
                  First Name
                </span>
                <input
                  id="firstName"
                  type="text"
                  placeholder="Jane"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </label>
              <label>
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 500 }}>
                  Last Name
                </span>
                <input
                  id="lastName"
                  type="text"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </label>
            </div>

            <label>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 500 }}>
                Email address <span style={{ color: "var(--danger)" }}>*</span>
              </span>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            <label>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 500 }}>
                Password <span style={{ color: "var(--danger)" }}>*</span>
              </span>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>

            <label>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 500 }}>
                Organization Name{" "}
                <span style={{ opacity: 0.5, fontWeight: 400 }}>(optional)</span>
              </span>
              <input
                id="tenantName"
                type="text"
                placeholder="Your company or project"
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="sp-btn sp-primary"
              style={{ width: "100%", marginTop: 6, padding: "12px" }}
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", marginTop: 20, color: "var(--text-muted)", fontSize: "0.88rem" }}>
          Already have an account?{" "}
          <Link
            href="/login"
            style={{ color: "var(--primary)", textDecoration: "none", fontWeight: 600 }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
