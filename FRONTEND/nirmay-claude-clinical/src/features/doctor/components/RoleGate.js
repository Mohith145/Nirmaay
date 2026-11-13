"use client";
import { useAuth } from "../adapters";
import { LoadingState, PermissionState } from "./ui";

/** UI-level role restriction. The API must enforce the same rule server-side. */
export default function RoleGate({ roles, children }) {
  const auth = useAuth();
  const user = auth?.user;
  const loading = auth?.loading ?? auth?.isLoading ?? false;
  if (loading) return <LoadingState />;
  if (!user) return <PermissionState reason="signin" />;
  if (!roles.includes(user.role)) return <PermissionState reason="role" />;
  return children;
}
