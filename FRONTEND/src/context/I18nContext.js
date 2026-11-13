"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import enTranslations from "../../public/locales/en.json";
import hiTranslations from "../../public/locales/hi.json";
import knTranslations from "../../public/locales/kn.json";

const translationsMap = {
  en: enTranslations,
  hi: hiTranslations,
  kn: knTranslations,
};

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState("en");
  const [isLargeText, setIsLargeText] = useState(false);
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [translations, setTranslations] = useState(enTranslations);

  useEffect(() => {
    const savedLang = localStorage.getItem("nirmay_lang") || process.env.NEXT_PUBLIC_DEFAULT_LANG || "en";
    const savedLarge = localStorage.getItem("nirmay_large_text") === "true";
    const savedContrast = localStorage.getItem("nirmay_high_contrast") === "true";

    setLangState(savedLang);
    setTranslations(translationsMap[savedLang] || enTranslations);
    setIsLargeText(savedLarge);
    setIsHighContrast(savedContrast);

    if (savedLarge) document.documentElement.classList.add("large-text");
    if (savedContrast) document.documentElement.classList.add("high-contrast");
  }, []);

  const setLang = useCallback((newLang) => {
    if (!translationsMap[newLang]) return;
    setLangState(newLang);
    setTranslations(translationsMap[newLang]);
    localStorage.setItem("nirmay_lang", newLang);
  }, []);

  const toggleLargeText = useCallback(() => {
    setIsLargeText((prev) => {
      const next = !prev;
      localStorage.setItem("nirmay_large_text", String(next));
      if (next) {
        document.documentElement.classList.add("large-text");
      } else {
        document.documentElement.classList.remove("large-text");
      }
      return next;
    });
  }, []);

  const toggleHighContrast = useCallback(() => {
    setIsHighContrast((prev) => {
      const next = !prev;
      localStorage.setItem("nirmay_high_contrast", String(next));
      if (next) {
        document.documentElement.classList.add("high-contrast");
      } else {
        document.documentElement.classList.remove("high-contrast");
      }
      return next;
    });
  }, []);

  /**
   * Translate key path e.g. "app.name" or "nav.login"
   */
  const t = useCallback(
    (keyPath, fallback = "") => {
      if (!keyPath) return fallback;
      const parts = keyPath.split(".");
      let current = translations;
      for (const part of parts) {
        if (current && typeof current === "object" && part in current) {
          current = current[part];
        } else {
          // Fallback to English translation first if available
          let engVal = enTranslations;
          for (const engPart of parts) {
            if (engVal && typeof engVal === "object" && engPart in engVal) {
              engVal = engVal[engPart];
            } else {
              engVal = null;
              break;
            }
          }
          return engVal || fallback || keyPath;
        }
      }
      return typeof current === "string" ? current : fallback || keyPath;
    },
    [translations]
  );

  return (
    <I18nContext.Provider
      value={{
        lang,
        setLang,
        t,
        isLargeText,
        toggleLargeText,
        isHighContrast,
        toggleHighContrast,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return ctx;
}
