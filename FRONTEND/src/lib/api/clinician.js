import { apiFetch } from "./client";

/**
 * Retrieve cases awaiting clinician review.
 * Cases are sorted: Emergency first, then urgent/soon/routine, then longest waiting.
 * @param {object} params
 * @param {boolean} params.include_reviewed
 */
export async function getClinicianQueue({ include_reviewed = false } = {}) {
  const query = include_reviewed ? "?include_reviewed=true" : "";
  return apiFetch(`/clinician/queue${query}`, {
    method: "GET",
  });
}

/**
 * Retrieve case detail bundle (handoff, patient, risk, symptoms, photo, review, heatmap).
 */
export async function getClinicianCase(caseId) {
  return apiFetch(`/clinician/cases/${caseId}`, {
    method: "GET",
  });
}

/**
 * Record a clinician review or override.
 * Note: If decision is "override", reason is required and final_risk_level or final_urgency must be set.
 * @param {number} caseId
 * @param {object} reviewData
 * @param {"confirm"|"override"} reviewData.decision
 * @param {string|null} reviewData.reason
 * @param {"Low"|"Medium"|"High"|null} reviewData.final_risk_level
 * @param {"routine"|"soon"|"urgent"|null} reviewData.final_urgency
 */
export async function reviewCase(caseId, reviewData) {
  return apiFetch(`/clinician/cases/${caseId}/review`, {
    method: "POST",
    body: reviewData,
  });
}
