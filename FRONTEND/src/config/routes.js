export const ROUTES = {
  // Public
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  EMERGENCY: "/emergency",
  MYTHS: "/myths",
  SELF_EXAM: "/self-exam",
  ROADMAP: "/roadmap",
  MODEL_CARD: "/model-card",

  // Patient Journey (Codex)
  PATIENT_HOME: "/patient",
  PATIENT_CONSENT: "/patient/consent",
  PATIENT_INTAKE: "/patient/intake",
  PATIENT_SYMPTOMS: "/patient/symptoms",
  PATIENT_PHOTO: "/patient/photo",
  PATIENT_RESULTS: "/patient/results",
  PATIENT_CASES: "/patient/cases",
  PATIENT_QUIT: "/patient/quit",

  // Health Worker (Codex)
  HEALTH_WORKER_HOME: "/health-worker",
  HEALTH_WORKER_INTAKE: "/health-worker/intake",
  HEALTH_WORKER_CAMP: "/health-worker/camp",

  // Doctor / Clinician Workspace (Claude)
  DOCTOR_HOME: "/doctor",
  DOCTOR_CASE_DETAIL: (id) => `/doctor/cases/${id}`,
  DOCTOR_CONSULTATION: (id) => `/doctor/consultation/${id}`,
  DOCTOR_INSIGHTS: "/doctor/insights",

  // Shared Consultation / Insights
  CONSULTATION: (id) => `/consultation/${id}`,
  INSIGHTS: "/insights",

  // Admin (Antigravity)
  ADMIN_HOME: "/admin",
  ADMIN_STAFF: "/admin/staff",
};
