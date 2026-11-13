"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { RoleGate } from "@/components/ui/RoleGate";
import { AppShell } from "@/components/ui/AppShell";
import { ROLES } from "@/config/roles";

export default function PatientLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const screeningRoutes = ["/patient/consent", "/patient/intake", "/patient/symptoms", "/patient/photo"];
  const blocked = screeningRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));

  useEffect(() => {
    if (blocked) router.replace("/patient");
  }, [blocked, router]);

  if (blocked) return null;
  return (
    <RoleGate allowedRoles={[ROLES.PATIENT, ROLES.ADMIN]}>
      <AppShell role={ROLES.PATIENT} showSidebar={true}>
        {children}
      </AppShell>
    </RoleGate>
  );
}
