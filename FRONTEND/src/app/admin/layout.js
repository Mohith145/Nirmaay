"use client";

import { RoleGate } from "@/components/ui/RoleGate";
import { AppShell } from "@/components/ui/AppShell";
import { ROLES } from "@/config/roles";

export default function AdminLayout({ children }) {
  return (
    <RoleGate allowedRoles={[ROLES.ADMIN]}>
      <AppShell role={ROLES.ADMIN} showSidebar={true}>
        {children}
      </AppShell>
    </RoleGate>
  );
}
