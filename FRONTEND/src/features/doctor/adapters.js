"use client";
/**
 * SINGLE integration seam with Antigravity's shared foundation.
 * Connects Claude's clinical features to Nirmay's apiFetch, AuthContext, and I18nContext.
 */
import { apiFetch } from "@/lib/api/client";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";

export { useAuth };

export const http = {
  get: async (path) => apiFetch(path, { method: "GET" }),
  post: async (path, body) => apiFetch(path, { method: "POST", body }),
};

/** t(key, englishFallback): falls back to the English text if the key is not translated yet. */
export function useT() {
  const i18n = useI18n();
  return (key, fallback) => {
    const v = i18n && typeof i18n.t === "function" ? i18n.t(key) : undefined;
    return v && v !== key ? v : fallback ?? key;
  };
}

export const DOCTOR_ROLES = ["doctor", "admin"];
export const INSIGHT_ROLES = ["doctor", "admin"];
