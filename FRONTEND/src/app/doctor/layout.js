"use client";

import { RoleGate } from "@/components/ui/RoleGate";
import { AppShell } from "@/components/ui/AppShell";
import { ROLES } from "@/config/roles";

export default function DoctorLayout({ children }) {
  return (
    <RoleGate allowedRoles={[ROLES.DOCTOR, ROLES.ADMIN]}>
      <AppShell role={ROLES.DOCTOR} showSidebar={true}>
        {children}
      </AppShell>
    </RoleGate>
  );
}
