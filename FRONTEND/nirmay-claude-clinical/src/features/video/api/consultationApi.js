import { http } from "../../doctor/adapters";

const enc = encodeURIComponent;

/**
 * ASSUMED CONTRACTS - see docs/API_CONTRACTS.md.
 * GET  /consultations/:id        -> { id, roomId, status: "scheduled"|"live"|"ended", scheduledAt, doctorName, patientName }
 * POST /consultations/:id/start  -> doctor only (server MUST enforce) -> { status: "live", roomId }
 * POST /consultations/:id/end    -> doctor only -> { status: "ended" }
 * `roomId` is an opaque server-generated value (never built from patient data).
 */
export const consultationApi = {
  get: (id) => http.get(`/consultations/${enc(id)}`),
  start: (id) => http.post(`/consultations/${enc(id)}/start`, {}),
  end: (id) => http.post(`/consultations/${enc(id)}/end`, {}),
};
