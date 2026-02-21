"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export interface AuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isSuperAdmin?: boolean;
}

export interface Tenant {
  id: string;
  slug: string;
  display_name: string;
  role?: "owner" | "administrator" | "editor" | "developer" | "viewer";
  subscription_plan?: string;
  subscription_status?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  tenants: Tenant[];
  currentTenant: Tenant | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (
    email: string,
    password: string,
    firstName?: string,
    lastName?: string,
    tenantName?: string
  ) => Promise<void>;
  logout: () => void;
  selectTenant: (tenantId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

  // Initialize from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("auth_token");
    const storedTenant = localStorage.getItem("current_tenant");

    if (storedToken) {
      setToken(storedToken);
      // Validate token and fetch user
      validateToken(storedToken, storedTenant);
    } else {
      setLoading(false);
    }
  }, []);

  const validateToken = async (
    token: string,
    tenantId: string | null
  ) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Token validation failed");
      }

      const data = await response.json();
      setUser(data.user);
      setTenants(data.tenants || []);

      if (tenantId) {
        const tenant = data.tenants.find((t: Tenant) => t.id === tenantId);
        if (tenant) {
          setCurrentTenant(tenant);
        } else if (data.tenants.length > 0) {
          setCurrentTenant(data.tenants[0]);
        }
      } else if (data.tenants.length > 0) {
        setCurrentTenant(data.tenants[0]);
      }
    } catch (error) {
      console.error("Token validation error:", error);
      localStorage.removeItem("auth_token");
      localStorage.removeItem("current_tenant");
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Login failed");
      }

      const data = await response.json();
      setUser(data.user);
      setToken(data.token);
      setTenants(data.tenants || []);

      if (data.tenants.length > 0) {
        setCurrentTenant(data.tenants[0]);
        localStorage.setItem("current_tenant", data.tenants[0].id);
      }

      localStorage.setItem("auth_token", data.token);
    } catch (error) {
      throw error;
    }
  };

  const signup = async (
    email: string,
    password: string,
    firstName?: string,
    lastName?: string,
    tenantName?: string
  ) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          firstName,
          lastName,
          tenantName,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Signup failed");
      }

      const data = await response.json();
      setUser(data.user);
      setToken(data.token);
      setTenants(
        data.tenantId
          ? [{ id: data.tenantId, slug: "", display_name: tenantName || "" }]
          : []
      );

      if (data.tenantId) {
        const newTenant = {
          id: data.tenantId,
          slug: "",
          display_name: tenantName || "",
        };
        setCurrentTenant(newTenant);
        localStorage.setItem("current_tenant", data.tenantId);
      }

      localStorage.setItem("auth_token", data.token);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setTenants([]);
    setCurrentTenant(null);
    localStorage.removeItem("auth_token");
    localStorage.removeItem("current_tenant");
  };

  const selectTenant = (tenantId: string) => {
    const tenant = tenants.find((t) => t.id === tenantId);
    if (tenant) {
      setCurrentTenant(tenant);
      localStorage.setItem("current_tenant", tenantId);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        tenants,
        currentTenant,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        login,
        signup,
        logout,
        selectTenant,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
