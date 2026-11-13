import { apiFetch } from "./client";

/**
 * Demo endpoints for seeded data visualizations.
 * All return payloads labeled with data_label: "demo data"
 */

export async function getHotspots() {
  return apiFetch("/demo/hotspots", {
    method: "GET",
  });
}

export async function getFunnel() {
  return apiFetch("/demo/funnel", {
    method: "GET",
  });
}

export async function getCamp() {
  return apiFetch("/demo/camp", {
    method: "GET",
  });
}

export async function getQrCard(patientId) {
  return apiFetch(`/demo/qr/${patientId}`, {
    method: "GET",
  });
}
