"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export type UserRole =
  | "Public_Portal"
  | "Municipal_Analyst"
  | "Policy_Reviewer"
  | "System_Admin";

export interface UserProfile {
  username: string;
  role: UserRole;
  organization: string;
  token: string;
}

interface AuthContextType {
  role: UserRole;
  token: string;
  profile: UserProfile;
  setRole: (role: UserRole) => Promise<void>;
  canSimulate: boolean;
  canGenerateBrief: boolean;
  canViewAuditLogs: boolean;
  canManageSystem: boolean;
  getRoleBadgeColor: (r?: UserRole) => string;
}

const DEFAULT_USERS: Record<UserRole, { username: string; org: string }> = {
  Public_Portal: {
    username: "public_guest",
    org: "Citizen Transparency Portal",
  },
  Municipal_Analyst: {
    username: "dhaka_analyst",
    org: "Dhaka North City Corporation (DNCC)",
  },
  Policy_Reviewer: {
    username: "planning_reviewer",
    org: "Planning Commission & MoDMR",
  },
  System_Admin: {
    username: "admin_root",
    org: "National Spatial Lakehouse Administration",
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<UserRole>("Municipal_Analyst");
  const [token, setToken] = useState<string>("");

  const fetchTokenForRole = useCallback(async (targetRole: UserRole): Promise<string> => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/demo-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: targetRole }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.access_token;
      }
    } catch {
      // Backend may be offline during build/tests - fallback to simulated token
    }
    return `simulated_jwt_for_${targetRole.toLowerCase()}`;
  }, []);

  const setRole = async (newRole: UserRole) => {
    setRoleState(newRole);
    try {
      localStorage.setItem("civicsphere_role", newRole);
    } catch {
      // Ignore
    }
    const newToken = await fetchTokenForRole(newRole);
    setToken(newToken);
  };

  useEffect(() => {
    let initialRole: UserRole = "Municipal_Analyst";
    try {
      const saved = localStorage.getItem("civicsphere_role") as UserRole;
      if (
        saved === "Public_Portal" ||
        saved === "Municipal_Analyst" ||
        saved === "Policy_Reviewer" ||
        saved === "System_Admin"
      ) {
        initialRole = saved;
      }
    } catch {
      // Ignore
    }
    setRoleState(initialRole);
    fetchTokenForRole(initialRole).then((t) => setToken(t));
  }, [fetchTokenForRole]);

  const profile: UserProfile = {
    username: DEFAULT_USERS[role].username,
    role: role,
    organization: DEFAULT_USERS[role].org,
    token: token,
  };

  const canSimulate = role !== "Public_Portal";
  const canGenerateBrief = role === "Policy_Reviewer" || role === "System_Admin";
  const canViewAuditLogs = role === "Policy_Reviewer" || role === "System_Admin";
  const canManageSystem = role === "System_Admin";

  const getRoleBadgeColor = (r: UserRole = role): string => {
    switch (r) {
      case "Public_Portal":
        return "bg-emerald-950/80 text-emerald-300 border-emerald-500/40";
      case "Municipal_Analyst":
        return "bg-cyan-950/80 text-cyan-300 border-cyan-500/40";
      case "Policy_Reviewer":
        return "bg-purple-950/80 text-purple-300 border-purple-500/40";
      case "System_Admin":
        return "bg-amber-950/80 text-amber-300 border-amber-500/40";
    }
  };

  return (
    <AuthContext.Provider
      value={{
        role,
        token,
        profile,
        setRole,
        canSimulate,
        canGenerateBrief,
        canViewAuditLogs,
        canManageSystem,
        getRoleBadgeColor,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
