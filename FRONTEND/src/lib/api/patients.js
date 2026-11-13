import { apiFetch } from "./client";

/**
 * Register a new screening participant / patient (health workers / staff).
 * @param {object} data
 * @param {string} data.full_name
 * @param {number|null} [data.age]
 * @param {string|null} [data.gender]
 * @param {string|null} [data.phone]
 * @param {string|null} [data.camp_token]
 * @param {string|null} [data.email]
 * @param {string|null} [data.password]
 * @param {boolean} [data.consent_given]
 */
export async function registerPatient(data) {
  const payload = {
    full_name: data.full_name.trim(),
    consent_given: data.consent_given !== false,
  };
  if (data.age !== undefined && data.age !== null && data.age !== "") {
    payload.age = Number(data.age);
  }
  if (data.gender) payload.gender = data.gender;
  if (data.phone) payload.phone = data.phone;
  if (data.camp_token) payload.camp_token = String(data.camp_token).trim();
  if (data.email) payload.email = data.email.trim();
  if (data.password) payload.password = data.password;

  return apiFetch("/patients", {
    method: "POST",
    body: payload,
  });
}

/**
 * Search and list patients for health workers and clinicians.
 * @param {string|null} query
 * @param {number} [limit=50]
 */
export async function searchPatients(query = "", limit = 50) {
  const qStr = query ? `?q=${encodeURIComponent(query)}&limit=${limit}` : `?limit=${limit}`;
  return apiFetch(`/patients${qStr}`, {
    method: "GET",
  });
}

/**
 * Fetch patient profile details.
 * @param {number} patientId
 */
export async function getPatient(patientId) {
  return apiFetch(`/patients/${patientId}`, {
    method: "GET",
  });
}

