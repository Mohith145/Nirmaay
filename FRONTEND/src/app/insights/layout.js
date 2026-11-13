"use client";

import { RoleGate } from "@/components/ui/RoleGate";
import { AppShell } from "@/components/ui/AppShell";
import { ROLES } from "@/config/roles";

export default function InsightsLayout({ children }) {
  return (
    <RoleGate allowedRoles={[ROLES.DOCTOR, ROLES.ADMIN]}>
      <AppShell showSidebar={false} showFooter={true}>
        {children}
      </AppShell>
    </RoleGate>
  );
}
