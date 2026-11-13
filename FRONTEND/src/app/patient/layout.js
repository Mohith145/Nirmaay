"use client";

import { RoleGate } from "@/components/ui/RoleGate";
import { AppShell } from "@/components/ui/AppShell";
import { ROLES } from "@/config/roles";

export default function PatientLayout({ children }) {
  return (
    <RoleGate allowedRoles={[ROLES.PATIENT, ROLES.ADMIN]}>
      <AppShell role={ROLES.PATIENT} showSidebar={true}>
        {children}
      </AppShell>
    </RoleGate>
  );
}
