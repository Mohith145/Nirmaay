import { http } from "../../doctor/adapters";

/** ASSUMED CONTRACTS - see docs/API_CONTRACTS.md. */
export const insightsApi = {
  overview: () => http.get("/insights/overview"),
  funnel: () => http.get("/insights/funnel"),
  hotspots: () => http.get("/insights/hotspots"),
  camps: () => http.get("/insights/camps"),
  qr: () => http.get("/insights/qr"),
};
