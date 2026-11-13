/**
 * Normalized API Error for Nirmay
 * Handles:
 * 1. { detail: { error: "code", message: "text" } }
 * 2. { detail: [ { loc: [...], msg: "text" } ] }
 * 3. { detail: "string" }
 * 4. Network / Timeout errors
 */

export class ApiError extends Error {
  constructor(message, status = 500, code = "api_error", details = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function normalizeError(err, status = 500) {
  if (err instanceof ApiError) return err;

  if (typeof err === "string") {
    return new ApiError(err, status, "api_error");
  }

  if (err && err.detail) {
    const detail = err.detail;

    // Shape 1: { detail: { error: "code", message: "..." } }
    if (typeof detail === "object" && !Array.isArray(detail)) {
      const code = detail.error || "request_failed";
      const message = detail.message || detail.reason || JSON.stringify(detail);
      return new ApiError(message, status, code, detail);
    }

    // Shape 2: { detail: [{ loc: [...], msg: "..." }] } (FastAPI 422 validation errors)
    if (Array.isArray(detail)) {
      const msgList = detail.map((d) => d.msg || JSON.stringify(d)).join("; ");
      return new ApiError(msgList || "Validation failed", status, "validation_error", detail);
    }

    // Shape 3: { detail: "string message" }
    if (typeof detail === "string") {
      return new ApiError(detail, status, "api_error");
    }
  }

  const message = err?.message || "An unexpected error occurred while contacting the server.";
  return new ApiError(message, status, "unknown_error", err);
}
