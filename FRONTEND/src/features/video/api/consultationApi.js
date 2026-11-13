/**
 * Consultation API client integrated with actual Nirmay FastAPI endpoints:
 * - GET /appointments/{id}
 * - POST /appointments
 */
import { endAppointment, getAppointment, getAppointmentStatus, getAppointmentToken, startAppointment } from "@/lib/api/appointments";

export const consultationApi = {
  get: async (id) => {
    const raw = await getAppointment(Number(id));
    return {
      id: String(raw.id),
      roomId: raw.room_id,
      status: raw.status,
      joinUrl: raw.join_url,
      patientId: raw.patient_id,
      doctorId: raw.doctor_id,
      caseId: raw.case_id,
    };
  },

  status: (id) => getAppointmentStatus(Number(id)),

  start: (id) => startAppointment(Number(id)),

  token: (id) => getAppointmentToken(Number(id)),

  end: (id) => endAppointment(Number(id)),
};
