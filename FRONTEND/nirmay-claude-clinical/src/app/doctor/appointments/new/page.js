import { Suspense } from "react";
import AppointmentCreate from "@/features/doctor/components/AppointmentCreate";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AppointmentCreate />
    </Suspense>
  );
}
