"use client";
/**
 * SINGLE integration seam with Antigravity's shared foundation.
 * Every import below is an ASSUMPTION about the shared repo. When the real
 * paths/signatures differ, fix them HERE ONLY - no other file in
 * features/doctor, features/video or features/insights imports shared code.
 */
import { api } from "@/lib/api"; // ASSUMED: centralized client exposing api.get(path) / api.post(path, body)
import { useAuth } from "@/context/AuthContext"; // ASSUMED: returns { user: { id, name, role }, loading }
import { useLanguage } from "@/context/LanguageContext"; // ASSUMED: returns { t(key), language }

export { useAuth };

// Adjust if the shared client wraps payloads, e.g. (r) => r.data
const unwrap = (r) => r;

export const http = {
  get: async (path) => unwrap(await api.get(path)),
  post: async (path, body) => unwrap(await api.post(path, body)),
};

/** t(key, englishFallback): falls back to the English text if the key is not translated yet. */
export function useT() {
  const lang = useLanguage();
  return (key, fallback) => {
    const v = lang && typeof lang.t === "function" ? lang.t(key) : undefined;
    return v && v !== key ? v : fallback ?? key;
  };
}

export const DOCTOR_ROLES = ["doctor"];
export const INSIGHT_ROLES = ["doctor", "admin"]; // ASSUMED: confirm against the blueprint's access rules
