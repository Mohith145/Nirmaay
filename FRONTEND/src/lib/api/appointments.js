import { apiFetch } from "./client";

/**
 * Schedule a tele-consultation appointment for a case.
 * Clinician initiates. Backend assigns Jitsi room_id "nirmay-" + uuid.
 * @param {object} params
 * @param {number} params.case_id
 */
export async function createAppointment({ case_id, scheduled_at, duration_minutes }) {
  return apiFetch("/appointments", {
    method: "POST",
    body: {
      case_id: Number(case_id),
      ...(scheduled_at ? { scheduled_at } : {}),
      ...(duration_minutes ? { duration_minutes: Number(duration_minutes) } : {}),
    },
  });
}

/**
 * Retrieve consultation appointment details.
 */
export async function getAppointment(appointmentId) {
  return apiFetch(`/appointments/${appointmentId}`, {
    method: "GET",
  });
}

export async function getAppointmentStatus(appointmentId) {
  return apiFetch(`/appointments/${appointmentId}/status`, { method: "GET" });
}

export async function startAppointment(appointmentId) {
  return apiFetch(`/appointments/${appointmentId}/start`, { method: "POST" });
}

export async function getAppointmentToken(appointmentId) {
  return apiFetch(`/appointments/${appointmentId}/token`, { method: "POST" });
}

export async function endAppointment(appointmentId) {
  return apiFetch(`/appointments/${appointmentId}/end`, { method: "POST" });
}
