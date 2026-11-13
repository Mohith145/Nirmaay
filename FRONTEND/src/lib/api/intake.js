import { apiFetch } from "./client";

/**
 * Submit oral cancer intake questionnaire.
 * Fields:
 * - age: number (0-120)
 * - tobacco: "none" | "smokeless" | "smoking" | "both"
 * - tobacco_years?: number
 * - betel_quid: boolean
 * - alcohol: "none" | "occasional" | "regular"
 * - family_history: boolean
 * - prior_oral_lesion: boolean
 * - patient_id?: number (for health workers)
 */
export async function submitIntake(data) {
  const payload = {
    cancer_type: "oral",
    age: Number(data.age),
    tobacco: data.tobacco || "none",
    tobacco_years: data.tobacco_years !== undefined && data.tobacco_years !== null ? Number(data.tobacco_years) : null,
    betel_quid: Boolean(data.betel_quid),
    alcohol: data.alcohol || "none",
    family_history: Boolean(data.family_history),
    prior_oral_lesion: Boolean(data.prior_oral_lesion),
  };

  if (data.patient_id !== null && data.patient_id !== undefined) {
    payload.patient_id = Number(data.patient_id);
  }

  return apiFetch("/intakes", {
    method: "POST",
    body: payload,
  });
}
