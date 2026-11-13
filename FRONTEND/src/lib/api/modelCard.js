import { apiFetch } from "./client";

/**
 * Retrieve public model card and transparency disclosures.
 * Reports model_available: false, limitations, and biases when running demo placeholder.
 */
export async function getModelCard() {
  return apiFetch("/model-card", {
    method: "GET",
  });
}
