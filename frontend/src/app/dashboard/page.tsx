"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import RoleManagement from "@/components/RoleManagement";
import UsageDashboard from "@/components/UsageDashboard";

export default function DashboardPage() {
  const { user, currentTenant, logout, selectTenant, tenants } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "team" | "usage">("overview");

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">SitePilot</h1>
                {currentTenant && (
                  <p className="text-sm text-gray-600">
                    {currentTenant.display_name} • {currentTenant.role}
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-4">
                {user && (
                  <div className="text-sm">
                    <p className="text-gray-900 font-medium">{user.email}</p>
                    <p className="text-gray-600">{user.firstName}</p>
                  </div>
                )}
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Logout
                </button>
              </div>
            </div>

            {/* Tenant Selector */}
            {tenants.length > 1 && (
              <div className="mt-4 flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">
                  Switch Tenant:
                </label>
                <select
                  value={currentTenant?.id || ""}
                  onChange={(e) => selectTenant(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.display_name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </header>

        {/* Navigation Tabs */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab("overview")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "overview"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("team")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "team"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Team
              </button>
              <button
                onClick={() => setActiveTab("usage")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "usage"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Usage
              </button>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Welcome to SitePilot
                </h2>
                <p className="text-gray-600 mb-6">
                  Manage your projects, team members, and track usage all in one place.
                </p>

                {/* Quick Stats */}
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-sm text-blue-900 font-semibold">
                      Current Tenant
                    </h3>
                    <p className="text-2xl font-bold text-blue-600 mt-2">
                      {currentTenant?.display_name}
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="text-sm text-green-900 font-semibold">
                      Your Role
                    </h3>
                    <p className="text-2xl font-bold text-green-600 mt-2 capitalize">
                      {currentTenant?.role}
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="text-sm text-purple-900 font-semibold">
                      Plan
                    </h3>
                    <p className="text-2xl font-bold text-purple-600 mt-2 capitalize">
                      {currentTenant?.subscription_plan || "Free"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Getting Started */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Getting Started
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <span className="flex-shrink-0 h-6 w-6 text-green-500">
                      ✓
                    </span>
                    <p className="ml-3 text-gray-700">
                      Create your first project
                    </p>
                  </li>
                  <li className="flex items-start">
                    <span className="flex-shrink-0 h-6 w-6 text-green-500">
                      ✓
                    </span>
                    <p className="ml-3 text-gray-700">
                      Invite team members from the Team tab
                    </p>
                  </li>
                  <li className="flex items-start">
                    <span className="flex-shrink-0 h-6 w-6 text-green-500">
                      ✓
                    </span>
                    <p className="ml-3 text-gray-700">
                      Monitor usage from the Usage tab
                    </p>
                  </li>
                  <li className="flex items-start">
                    <span className="flex-shrink-0 h-6 w-6 text-green-500">
                      ✓
                    </span>
                    <p className="ml-3 text-gray-700">
                      Upgrade your plan when needed
                    </p>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === "team" && <RoleManagement />}

          {activeTab === "usage" && <UsageDashboard />}
        </main>
      </div>
    </ProtectedRoute>
  );
}
