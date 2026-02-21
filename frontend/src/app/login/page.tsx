"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Already logged in → go straight to dashboard
  useEffect(() => {
    if (!authLoading && user) {
      router.replace(searchParams.get("redirect") || "/dashboard");
    }
  }, [authLoading, user]);

  if (authLoading || user) return null;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      const redirectTo = searchParams.get("redirect") || "/dashboard";
      router.replace(redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
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
      <div style={{ width: "100%", maxWidth: 420 }}>
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
          <h1 style={{ margin: "0 0 6px", fontSize: "1.7rem" }}>SitePilot</h1>
          <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Sign in to your account
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
            <label>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 500 }}>
                Email address
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
                Password
              </span>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="sp-btn sp-primary"
              style={{ width: "100%", marginTop: 6, padding: "12px" }}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", marginTop: 20, color: "var(--text-muted)", fontSize: "0.88rem" }}>
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            style={{ color: "var(--primary)", textDecoration: "none", fontWeight: 600 }}
          >
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
