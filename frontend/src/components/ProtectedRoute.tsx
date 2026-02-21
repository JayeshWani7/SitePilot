"use client";

import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "owner" | "administrator" | "editor" | "developer" | "viewer";
  fallbackPath?: string;
}

/**
 * Higher-order component for protecting routes
 * Redirects to login if not authenticated
 * Redirects to dashboard if user doesn't have required role
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  fallbackPath = "/login",
}) => {
  const router = useRouter();
  const { isAuthenticated, loading, currentTenant } = useAuth();

  useEffect(() => {
    if (loading) return;

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      router.push(fallbackPath);
      return;
    }

    // Check role if required
    if (requiredRole && currentTenant?.role) {
      const roleHierarchy = {
        owner: 5,
        administrator: 4,
        editor: 3,
        developer: 2,
        viewer: 1,
      };

      const userRoleLevel = roleHierarchy[currentTenant.role];
      const requiredRoleLevel = roleHierarchy[requiredRole];

      if (userRoleLevel < requiredRoleLevel) {
        router.push("/dashboard");
        return;
      }
    }
  }, [isAuthenticated, loading, currentTenant, requiredRole, router, fallbackPath]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (requiredRole && currentTenant?.role) {
    const roleHierarchy = {
      owner: 5,
      administrator: 4,
      editor: 3,
      developer: 2,
      viewer: 1,
    };

    const userRoleLevel = roleHierarchy[currentTenant.role];
    const requiredRoleLevel = roleHierarchy[requiredRole];

    if (userRoleLevel < requiredRoleLevel) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              You don't have permission to access this page.
            </p>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
