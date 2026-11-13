"use client";

import { RoleGate } from "@/components/ui/RoleGate";
import { AppShell } from "@/components/ui/AppShell";
import { ROLES } from "@/config/roles";

export default function ConsultationLayout({ children }) {
  return (
    <RoleGate
      allowedRoles={[ROLES.DOCTOR, ROLES.PATIENT, ROLES.HEALTH_WORKER, ROLES.ADMIN]}
    >
      <AppShell showSidebar={false} showFooter={false}>
        {children}
      </AppShell>
    </RoleGate>
  );
}
