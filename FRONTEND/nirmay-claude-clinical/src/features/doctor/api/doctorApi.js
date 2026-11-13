import { http } from "../adapters";

const qs = (o = {}) => {
  const p = new URLSearchParams();
  Object.entries(o).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") p.set(k, v);
  });
  const s = p.toString();
  return s ? `?${s}` : "";
};
const enc = encodeURIComponent;

/**
 * ASSUMED CONTRACTS - see docs/API_CONTRACTS.md. Replace paths with the
 * blueprint's documented endpoints; nothing outside this file knows them.
 */
export const doctorApi = {
  dashboard: () => http.get("/doctor/dashboard"),
  listCases: (filters) => http.get(`/doctor/cases${qs(filters)}`),
  getCase: (id) => http.get(`/doctor/cases/${enc(id)}`),
  submitDecision: (id, payload) => http.post(`/doctor/cases/${enc(id)}/decision`, payload),
  listPatients: () => http.get("/doctor/patients"),
  createAppointment: (payload) => http.post("/doctor/appointments", payload),
};
