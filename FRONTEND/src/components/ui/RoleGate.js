"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { ROLE_HOME_ROUTES } from "../../config/roles";
import { Spinner } from "./Spinner";
import { Button } from "./Button";

export function RoleGate({ allowedRoles = [], children }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, isAuthenticated, router, pathname]);

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <span className="text-xs text-ink-600 font-medium">Verifying access...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  const isRoleAllowed =
    allowedRoles.length === 0 || (user && allowedRoles.includes(user.role));

  if (!isRoleAllowed) {
    const homeRoute = (user && ROLE_HOME_ROUTES[user.role]) || "/";
    return (
      <div className="max-w-md mx-auto my-12 p-8 rounded-xl bg-surface-0 border border-line-200 shadow-sm text-center flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-emergency-bg text-emergency flex items-center justify-center">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-bold text-ink-900">Access Restricted</h2>
          <p className="text-xs sm:text-sm text-ink-600">
            Your current account role (<strong>{user?.role || "Guest"}</strong>) does not have
            authorization to view this portal.
          </p>
        </div>
        <Button variant="primary" onClick={() => router.push(homeRoute)}>
          Go to Your Portal
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
