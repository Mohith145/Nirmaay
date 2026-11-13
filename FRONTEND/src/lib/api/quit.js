import { apiFetch } from "./client";

/**
 * Get quit-tobacco progress (streak, money saved, badges).
 */
export async function getQuitProgress() {
  return apiFetch("/quit/progress", {
    method: "GET",
  });
}

/**
 * Update quit tobacco tracker.
 * @param {object} params
 * @param {string} params.quit_date - ISO date YYYY-MM-DD
 * @param {number} params.daily_spend - Daily spend on tobacco products in INR
 */
export async function setQuitProgress({ quit_date, daily_spend }) {
  return apiFetch("/quit/progress", {
    method: "POST",
    body: {
      quit_date,
      daily_spend: Number(daily_spend),
    },
  });
}
