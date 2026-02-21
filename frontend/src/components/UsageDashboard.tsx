"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

interface UsageStats {
  total_users: number;
  total_projects: number;
  total_requests: number;
  api_calls: number;
  storage_used_mb: number;
  bandwidth_used_gb: number;
  active_domains: number;
  page_views: number;
  unique_visitors: number;
}

interface Limits {
  max_users: number;
  max_projects: number;
  max_domains: number;
  max_traffic_gb: number;
  features: Record<string, boolean>;
}

interface Alert {
  id: string;
  alert_type: string;
  metric_name: string;
  current_value: number;
  limit_value: number;
  percentage: number;
  is_resolved: boolean;
  created_at: string;
}

interface Suggestion {
  type: string;
  severity: string;
  message: string;
  metric?: string;
  current?: number;
  limit?: number;
}

export default function UsageDashboard() {
  const { currentTenant, token } = useAuth();
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [limits, setLimits] = useState<Limits | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

  useEffect(() => {
    if (!currentTenant || !token) return;
    fetchUsageData();
  }, [currentTenant, token]);

  const fetchUsageData = async () => {
    try {
      setLoading(true);
      setError(null);

      const headers = {
        Authorization: `Bearer ${token}`,
        "x-tenant-id": currentTenant!.id,
      };

      // Fetch usage data
      const usageRes = await fetch(
        `${API_BASE_URL}/usage/tenants/${currentTenant!.id}/usage/current`,
        { headers }
      );

      if (!usageRes.ok) throw new Error("Failed to fetch usage data");
      const usageData = await usageRes.json();
      setUsage(usageData.usage);
      setLimits(usageData.limits);
      setAlerts(usageData.alerts || []);

      // Fetch suggestions
      const suggestionsRes = await fetch(
        `${API_BASE_URL}/usage/tenants/${currentTenant!.id}/usage-suggestions`,
        { headers }
      );

      if (suggestionsRes.ok) {
        const suggestionsData = await suggestionsRes.json();
        setSuggestions(suggestionsData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load usage data");
    } finally {
      setLoading(false);
    }
  };

  const getUsagePercentage = (current: number, limit: number) => {
    return limit > 0 ? Math.round((current / limit) * 100) : 0;
  };

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 90) return "bg-red-600";
    if (percentage >= 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">Loading usage data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <p className="text-sm text-red-700">{error}</p>
      </div>
    );
  }

  if (!usage || !limits) {
    return (
      <div className="rounded-md bg-yellow-50 p-4">
        <p className="text-sm text-yellow-700">No usage data available yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Active Alerts</h2>
          <div className="grid gap-4">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="rounded-lg border border-red-200 bg-red-50 p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-red-900">
                      {alert.alert_type}
                    </h3>
                    <p className="mt-1 text-sm text-red-700">
                      {alert.metric_name}: {alert.current_value} of{" "}
                      {alert.limit_value} ({Math.round(alert.percentage)}%)
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-1 rounded">
                    {Math.round(alert.percentage)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions Section */}
      {suggestions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">
            Optimization Suggestions
          </h2>
          <div className="grid gap-4">
            {suggestions.map((suggestion, idx) => (
              <div
                key={idx}
                className={`rounded-lg border p-4 ${
                  suggestion.severity === "high"
                    ? "border-orange-200 bg-orange-50"
                    : suggestion.severity === "medium"
                    ? "border-yellow-200 bg-yellow-50"
                    : "border-blue-200 bg-blue-50"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3
                      className={`font-semibold ${
                        suggestion.severity === "high"
                          ? "text-orange-900"
                          : suggestion.severity === "medium"
                          ? "text-yellow-900"
                          : "text-blue-900"
                      }`}
                    >
                      {suggestion.message}
                    </h3>
                    {suggestion.current && suggestion.limit && (
                      <p
                        className={`mt-1 text-sm ${
                          suggestion.severity === "high"
                            ? "text-orange-700"
                            : suggestion.severity === "medium"
                            ? "text-yellow-700"
                            : "text-blue-700"
                        }`}
                      >
                        Current: {suggestion.current} / Limit:{" "}
                        {suggestion.limit}
                      </p>
                    )}
                  </div>
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded ${
                      suggestion.severity === "high"
                        ? "bg-orange-100 text-orange-700"
                        : suggestion.severity === "medium"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {suggestion.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Usage Metrics Grid */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">
          Current Usage Metrics
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Users */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">Team Members</h3>
              <span className="text-sm font-medium text-gray-600">
                {usage.total_users} / {limits.max_users}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${getPercentageColor(
                  getUsagePercentage(usage.total_users, limits.max_users)
                )}`}
                style={{
                  width: `${Math.min(
                    100,
                    getUsagePercentage(usage.total_users, limits.max_users)
                  )}%`,
                }}
              ></div>
            </div>
            <p className="text-xs text-gray-500">
              {getUsagePercentage(usage.total_users, limits.max_users)}% used
            </p>
          </div>

          {/* Projects */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">Projects</h3>
              <span className="text-sm font-medium text-gray-600">
                {usage.total_projects} / {limits.max_projects}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${getPercentageColor(
                  getUsagePercentage(usage.total_projects, limits.max_projects)
                )}`}
                style={{
                  width: `${Math.min(
                    100,
                    getUsagePercentage(usage.total_projects, limits.max_projects)
                  )}%`,
                }}
              ></div>
            </div>
            <p className="text-xs text-gray-500">
              {getUsagePercentage(usage.total_projects, limits.max_projects)}%
              used
            </p>
          </div>

          {/* Bandwidth */}
          {limits.max_traffic_gb && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-gray-900">Bandwidth</h3>
                <span className="text-sm font-medium text-gray-600">
                  {usage.bandwidth_used_gb.toFixed(2)} /{" "}
                  {limits.max_traffic_gb} GB
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getPercentageColor(
                    getUsagePercentage(
                      usage.bandwidth_used_gb,
                      limits.max_traffic_gb
                    )
                  )}`}
                  style={{
                    width: `${Math.min(
                      100,
                      getUsagePercentage(
                        usage.bandwidth_used_gb,
                        limits.max_traffic_gb
                      )
                    )}%`,
                  }}
                ></div>
              </div>
              <p className="text-xs text-gray-500">
                {getUsagePercentage(
                  usage.bandwidth_used_gb,
                  limits.max_traffic_gb
                )}
                % used
              </p>
            </div>
          )}

          {/* Storage */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">Storage</h3>
              <span className="text-sm font-medium text-gray-600">
                {usage.storage_used_mb.toFixed(2)} MB
              </span>
            </div>
            <p className="text-sm text-gray-600">
              {usage.storage_used_mb > 0 ? "Active storage in use" : "No data"}
            </p>
          </div>
        </div>
      </div>

      {/* Engagement Metrics */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Engagement Metrics</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm text-gray-600">Page Views</h3>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {usage.page_views.toLocaleString()}
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm text-gray-600">Unique Visitors</h3>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {usage.unique_visitors.toLocaleString()}
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm text-gray-600">API Calls</h3>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {usage.api_calls.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
