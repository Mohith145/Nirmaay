import { apiFetch } from "./client";

/**
 * Schedule a tele-consultation appointment for a case.
 * Clinician initiates. Backend assigns Jitsi room_id "nirmay-" + uuid.
 * @param {object} params
 * @param {number} params.case_id
 */
export async function createAppointment({ case_id }) {
  return apiFetch("/appointments", {
    method: "POST",
    body: { case_id: Number(case_id) },
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

export async function startAppointment(appointmentId) {
  return apiFetch(`/appointments/${appointmentId}/start`, { method: "POST" });
}

export async function endAppointment(appointmentId) {
  return apiFetch(`/appointments/${appointmentId}/end`, { method: "POST" });
}
