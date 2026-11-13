export const ROLES = {
  PATIENT: "patient",
  HEALTH_WORKER: "health_worker",
  DOCTOR: "doctor",
  ADMIN: "admin",
};

export const ROLE_LABELS = {
  [ROLES.PATIENT]: "Patient",
  [ROLES.HEALTH_WORKER]: "Health Worker",
  [ROLES.DOCTOR]: "Clinician",
  [ROLES.ADMIN]: "Administrator",
};

export const ROLE_HOME_ROUTES = {
  [ROLES.PATIENT]: "/patient",
  [ROLES.HEALTH_WORKER]: "/health-worker",
  [ROLES.DOCTOR]: "/doctor",
  [ROLES.ADMIN]: "/admin",
};

export function hasRequiredRole(userRole, allowedRoles) {
  if (!allowedRoles || allowedRoles.length === 0) return true;
  if (!userRole) return false;
  return allowedRoles.includes(userRole);
}
