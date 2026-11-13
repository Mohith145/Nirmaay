import { apiFetch } from "./client";

/**
 * Log in to Nirmay.
 * Returns { access_token, token_type, user_id, role }
 */
export async function login({ email, password }) {
  return apiFetch("/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

/**
 * Register a user.
 * Patients can register openly. Staff registration requires caller to be an admin (or open staff reg enabled).
 * Returns UserOut { id, email, full_name, role }
 */
export async function register({ email, password, full_name, role = "patient" }, adminToken = null) {
  return apiFetch("/auth/register", {
    method: "POST",
    token: adminToken,
    body: {
      email,
      password,
      full_name,
      role,
    },
  });
}

/**
 * Deactivates user and triggers consent withdrawal path.
 */
export async function deleteAccount() {
  return apiFetch("/me", {
    method: "DELETE",
  });
}
