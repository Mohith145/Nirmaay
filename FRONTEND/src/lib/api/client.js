import { ApiError, normalizeError } from "./errors";
import { firebaseAuth } from "../firebase";

const DEFAULT_TIMEOUT_MS = 30000;
const PHOTO_TIMEOUT_MS = 60000;

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ||
  (process.env.NODE_ENV === "development" ? "http://localhost:8000" : "");

// In a Vercel Services deployment, the browser and API share an origin. Route
// API calls through the public /api rewrite unless an external API origin is set.
export const API_PATH_PREFIX = process.env.NEXT_PUBLIC_API_PATH_PREFIX ??
  (!process.env.NEXT_PUBLIC_API_BASE_URL && process.env.NODE_ENV === "production" ? "/api" : "");

export function buildApiUrl(endpoint) {
  if (endpoint.startsWith("http")) return endpoint;

  const path = `${API_PATH_PREFIX}/${endpoint.replace(/^\/+/, "")}`;
  return API_BASE_URL
    ? `${API_BASE_URL.replace(/\/$/, "")}${path}`
    : path;
}

/**
 * Core HTTP client for the Nirmay platform.
 * Centralizes authentication, timeouts, error normalization, and response parsing.
 *
 * @param {string} endpoint - API path (e.g., "/auth/login")
 * @param {object} options - Fetch options (method, body, headers, token, timeoutMs, etc.)
 */
export async function apiFetch(endpoint, options = {}) {
  const {
    token,
    timeoutMs,
    headers = {},
    body,
    ...restOptions
  } = options;

  // Resolve base URL and path
  if (!endpoint.startsWith("http") && !API_BASE_URL && !API_PATH_PREFIX) {
    throw new ApiError(
      "The API is not configured. Set NEXT_PUBLIC_API_BASE_URL or deploy the backend with the frontend.",
      503,
      "api_not_configured"
    );
  }
  const url = buildApiUrl(endpoint);

  // Resolve authorization token
  let authToken = token;
  if (!authToken && typeof window !== "undefined") {
    authToken = firebaseAuth.currentUser
      ? await firebaseAuth.currentUser.getIdToken()
      : localStorage.getItem("nirmay_token");
  }

  const finalHeaders = { ...headers };
  if (authToken) {
    finalHeaders["Authorization"] = `Bearer ${authToken}`;
  }

  // Handle FormData vs JSON bodies
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  if (!isFormData && body && typeof body === "object" && !(body instanceof Blob)) {
    finalHeaders["Content-Type"] = "application/json";
  }

  // Determine timeout
  const isPhotoUpload = endpoint.includes("/photos") || isFormData;
  const timeout = timeoutMs || (isPhotoUpload ? PHOTO_TIMEOUT_MS : DEFAULT_TIMEOUT_MS);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);

  try {
    const response = await fetch(url, {
      ...restOptions,
      headers: finalHeaders,
      body: isFormData ? body : (typeof body === "object" ? JSON.stringify(body) : body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Handle 401 Unauthorized globally
    if (response.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("nirmay_token");
        localStorage.removeItem("nirmay_user");
        if (firebaseAuth.currentUser) await firebaseAuth.signOut();
        if (!window.location.pathname.startsWith("/login")) {
          const currentPath = window.location.pathname;
          window.location.href = `/login?next=${encodeURIComponent(currentPath)}`;
        }
      }
    }

    // Parse response
    const contentType = response.headers.get("content-type");
    let data = null;
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else if (contentType && (contentType.includes("image/") || contentType.includes("application/octet-stream"))) {
      data = await response.blob();
    } else {
      const text = await response.text();
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = text;
      }
    }

    if (!response.ok) {
      throw normalizeError(data, response.status);
    }

    return data;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      throw new ApiError(
        `Request timed out after ${Math.round(timeout / 1000)} seconds.`,
        408,
        "timeout_error"
      );
    }
    throw normalizeError(err);
  }
}
