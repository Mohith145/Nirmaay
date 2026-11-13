import { apiFetch } from "./client";

/**
 * Grant informed consent for cancer screening.
 * Health workers pass `patient_id`. Patients leave it omitted.
 */
export async function grantConsent({ patient_id = null, purpose = "screening" } = {}) {
  const body = { purpose };
  if (patient_id !== null && patient_id !== undefined) {
    body.patient_id = Number(patient_id);
  }
  return apiFetch("/consents", {
    method: "POST",
    body,
  });
}

/**
 * Withdraw consent by consent ID.
 * Flags cases for deletion and removes stored photos.
 */
export async function withdrawConsent(consentId) {
  return apiFetch(`/consents/${consentId}`, {
    method: "DELETE",
  });
}
