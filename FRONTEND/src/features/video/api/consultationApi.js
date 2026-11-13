/**
 * Consultation API client integrated with actual Nirmay FastAPI endpoints:
 * - GET /appointments/{id}
 * - POST /appointments
 */
import { getAppointment, createAppointment } from "@/lib/api/appointments";

export const consultationApi = {
  get: async (id) => {
    const raw = await getAppointment(Number(id));
    return {
      id: String(raw.id),
      roomId: raw.room_id,
      status: "live", // Backend creates room ready upon appointment creation
      scheduledAt: new Date().toISOString(),
      joinUrl: raw.join_url,
      patientId: raw.patient_id,
      doctorId: raw.doctor_id,
      caseId: raw.case_id,
    };
  },

  start: async (id) => {
    // Already live on server once created
    const raw = await getAppointment(Number(id));
    return {
      status: "live",
      roomId: raw.room_id,
    };
  },

  end: async (id) => {
    return {
      status: "ended",
    };
  },
};
