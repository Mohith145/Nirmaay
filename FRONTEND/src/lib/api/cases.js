import { apiFetch } from "./client";

/**
 * Create a case linking intake, symptom check, and retained photo screening.
 * @param {object} params
 * @param {number} params.intake_id
 * @param {number|null} params.symptom_id
 * @param {number|null} params.photo_id
 * @param {number|null} params.patient_id
 */
export async function createCase({ intake_id, symptom_id = null, photo_id = null, patient_id = null }) {
  const body = {
    intake_id: Number(intake_id),
  };
  if (symptom_id !== null && symptom_id !== undefined) body.symptom_id = Number(symptom_id);
  if (photo_id !== null && photo_id !== undefined) body.photo_id = Number(photo_id);
  if (patient_id !== null && patient_id !== undefined) body.patient_id = Number(patient_id);

  return apiFetch("/cases", {
    method: "POST",
    body,
  });
}

/**
 * List screening cases.
 * @param {number|null} patientId - optional patient filter for health workers/doctors
 */
export async function listCases(patientId = null) {
  const query = patientId ? `?patient_id=${Number(patientId)}` : "";
  return apiFetch(`/cases${query}`, {
    method: "GET",
  });
}

/**
 * Retrieve patient handoff summary for a case.
 */
export async function getCaseHandoff(caseId) {
  return apiFetch(`/cases/${caseId}/handoff`, {
    method: "GET",
  });
}
