/**
 * Consultation API client integrated with actual Nirmay FastAPI endpoints:
 * - GET /appointments/{id}
 * - POST /appointments/{id}/start and /end
 * - POST /appointments
 */
import {
  createAppointment,
  endAppointment,
  getAppointment,
  startAppointment,
} from "@/lib/api/appointments";

export const consultationApi = {
  get: async (id) => {
    const raw = await getAppointment(Number(id));
    return {
      id: String(raw.id),
      roomId: raw.room_id,
      status: raw.status,
      scheduledAt: new Date().toISOString(),
      joinUrl: raw.join_url,
      patientId: raw.patient_id,
      doctorId: raw.doctor_id,
      caseId: raw.case_id,
    };
  },

  start: async (id) => {
    const raw = await startAppointment(Number(id));
    return {
      status: raw.status,
      roomId: raw.room_id,
    };
  },

  end: async (id) => {
    return endAppointment(Number(id));
  },
};
