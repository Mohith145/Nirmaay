import { apiFetch } from "./client";

/**
 * Request plain-language explanation of structured rules/screening result.
 * Appends standard disclaimer.
 * @param {object} result - Structured result from intake/symptoms/photo
 */
export async function explainResult(result) {
  return apiFetch("/explain", {
    method: "POST",
    body: { result },
  });
}

/**
 * Retrieve curated FAQ answer by question ID.
 */
export async function getFaqAnswer(questionId) {
  return apiFetch(`/explain/faq/${encodeURIComponent(questionId)}`, {
    method: "GET",
  });
}
