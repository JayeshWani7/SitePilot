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

const ROLE_DESCRIPTIONS: Record<string, string> = {
  owner: "Full access including billing and user management",
  administrator: "Can manage users, projects, and content",
  editor: "Can create and edit content, manage projects",
  developer: "Can edit content and access API",
  viewer: "Read-only access to analytics and projects",
};

export default function RoleManagement() {
  const { currentTenant, token } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<string>("editor");
  const [addingMember, setAddingMember] = useState(false);

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

  useEffect(() => {
    if (!currentTenant || !token) return;
    fetchMembers();
  }, [currentTenant, token]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${API_BASE_URL}/auth/tenants/${currentTenant!.id}/members`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "x-tenant-id": currentTenant!.id,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch members");
      const data = await response.json();
      setMembers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load members");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async () => {
    if (!newEmail.trim()) {
      setError("Email is required");
      return;
    }

    try {
      setAddingMember(true);
      const response = await fetch(
        `${API_BASE_URL}/auth/tenants/${currentTenant!.id}/members`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "x-tenant-id": currentTenant!.id,
          },
          body: JSON.stringify({
            email: newEmail,
            role: newRole,
          }),
        }
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to add member");
      }

      setNewEmail("");
      setNewRole("editor");
      setShowAddMember(false);
      await fetchMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add member");
    } finally {
      setAddingMember(false);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/tenants/${currentTenant!.id}/members/${memberId}/role`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "x-tenant-id": currentTenant!.id,
          },
          body: JSON.stringify({ role: newRole }),
        }
      );

      if (!response.ok) throw new Error("Failed to update role");
      await fetchMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role");
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/tenants/${currentTenant!.id}/members/${memberId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "x-tenant-id": currentTenant!.id,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to remove member");
      await fetchMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove member");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">Loading team members...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Team Members</h2>
        <button
          onClick={() => setShowAddMember(!showAddMember)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          {showAddMember ? "Cancel" : "Add Member"}
        </button>
      </div>

      {showAddMember && (
        <div className="bg-gray-50 p-6 rounded-lg space-y-4">
          <h3 className="font-semibold text-gray-900">Invite Team Member</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="member@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Role
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="viewer">Viewer</option>
                <option value="developer">Developer</option>
                <option value="editor">Editor</option>
                <option value="administrator">Administrator</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                {ROLE_DESCRIPTIONS[newRole]}
              </p>
            </div>

            <button
              onClick={handleAddMember}
              disabled={addingMember || !newEmail.trim()}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {addingMember ? "Adding..." : "Add Member"}
            </button>
          </div>
        </div>
      )}

      {members.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No team members yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {members.map((member) => (
                <tr key={member.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm font-medium text-gray-900">
                      {member.first_name} {member.last_name}
                    </p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm text-gray-500">{member.email}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={member.role}
                      onChange={(e) =>
                        handleRoleChange(member.user_id, e.target.value)
                      }
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                    >
                      <option value="viewer">Viewer</option>
                      <option value="developer">Developer</option>
                      <option value="editor">Editor</option>
                      <option value="administrator">Administrator</option>
                      <option value="owner">Owner</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(member.joined_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleRemoveMember(member.user_id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Role Descriptions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 space-y-4">
        <h3 className="font-semibold text-blue-900">Role Permissions</h3>
        <div className="space-y-3">
          {Object.entries(ROLE_DESCRIPTIONS).map(([role, description]) => (
            <div key={role} className="flex items-start space-x-3">
              <span className="text-sm font-medium text-blue-900 capitalize min-w-fit">
                {role}:
              </span>
              <p className="text-sm text-blue-700">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
