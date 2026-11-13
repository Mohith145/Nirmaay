import { apiFetch } from "./client";

/**
 * Check oral cancer symptoms against rules engine.
 * Symptoms: list of:
 * - "non_healing_ulcer"
 * - "white_or_red_patch"
 * - "lump_or_swelling"
 * - "persistent_mouth_pain"
 * - "difficulty_chewing_or_swallowing"
 * - "unexplained_loose_tooth"
 * Emergency flags:
 * - heavy_bleeding: boolean
 * - cannot_swallow_fluids: boolean
 * - severe_jaundice: boolean
 */
export async function checkSymptoms(data) {
  const payload = {
    symptoms: data.symptoms || [],
    duration_days: data.duration_days !== undefined && data.duration_days !== null ? Number(data.duration_days) : null,
    heavy_bleeding: Boolean(data.heavy_bleeding),
    cannot_swallow_fluids: Boolean(data.cannot_swallow_fluids),
    severe_jaundice: Boolean(data.severe_jaundice),
  };

  if (data.patient_id !== null && data.patient_id !== undefined) {
    payload.patient_id = Number(data.patient_id);
  }

  return apiFetch("/symptoms/check", {
    method: "POST",
    body: payload,
  });
}
