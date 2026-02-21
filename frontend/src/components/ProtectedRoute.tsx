"use client";

import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "owner" | "administrator" | "editor" | "developer" | "viewer";
  fallbackPath?: string;
}

const ROLE_HIERARCHY: Record<string, number> = {
  owner: 5,
  administrator: 4,
  editor: 3,
  developer: 2,
  viewer: 1,
};

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  fallbackPath = "/login",
}) => {
  const router = useRouter();
  const { isAuthenticated, loading, currentTenant } = useAuth();

  const hasRequiredRole =
    !requiredRole ||
    !currentTenant?.role ||
    ROLE_HIERARCHY[currentTenant.role] >= ROLE_HIERARCHY[requiredRole];

  // Trigger navigation imperatively after auth state is resolved
  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      router.replace(fallbackPath);
    } else if (!hasRequiredRole) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, loading, hasRequiredRole, router, fallbackPath]);

  // ── LOADING STATE ─────────────────────────────────────────────────────────
  // While auth is being resolved (e.g. token validation on mount), show a
  // full-screen loader so no protected content flashes.
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          gap: 16,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            border: "3px solid var(--border)",
            borderTopColor: "var(--primary)",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <p style={{ color: "var(--text-muted)", margin: 0 }}>Loading...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── NOT AUTHENTICATED ─────────────────────────────────────────────────────
  // Return null (render nothing) while the router.replace() fires.
  // This prevents the protected page from flashing to unauthenticated users.
  if (!isAuthenticated) {
    return null;
  }

  // ── INSUFFICIENT ROLE ─────────────────────────────────────────────────────
  if (!hasRequiredRole) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          gap: 16,
          textAlign: "center",
        }}
      >
        <span style={{ fontSize: "2rem" }}>🔒</span>
        <h2 style={{ margin: 0 }}>Access Denied</h2>
        <p style={{ color: "var(--text-muted)", margin: 0 }}>
          You don&apos;t have permission to access this page.
        </p>
        <button
          className="sp-btn sp-primary"
          onClick={() => router.push("/dashboard")}
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  // ── AUTHENTICATED + AUTHORIZED ────────────────────────────────────────────
  return <>{children}</>;
};

export default ProtectedRoute;
