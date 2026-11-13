"use client";

import { RoleGate } from "@/components/ui/RoleGate";
import { AppShell } from "@/components/ui/AppShell";
import { ROLES } from "@/config/roles";

export default function HealthWorkerLayout({ children }) {
  return (
    <RoleGate allowedRoles={[ROLES.HEALTH_WORKER, ROLES.ADMIN]}>
      <AppShell role={ROLES.HEALTH_WORKER} showSidebar={true}>
        {children}
      </AppShell>
    </RoleGate>
  );
}
