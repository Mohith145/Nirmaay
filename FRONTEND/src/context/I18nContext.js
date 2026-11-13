"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import enTranslations from "../../public/locales/en.json";
import hiTranslations from "../../public/locales/hi.json";
import knTranslations from "../../public/locales/kn.json";

const translationsMap = {
  en: enTranslations,
  hi: hiTranslations,
  kn: knTranslations,
};

// Build lowercased lookup tables and reverse dictionaries for bulletproof bidirectional translation
function buildLookupHelpers() {
  const lowerMaps = { en: {}, hi: {}, kn: {} };
  const reverseToEn = {};

  ["en", "hi", "kn"].forEach((lang) => {
    const phrases = translationsMap[lang]?.phrases || {};
    Object.entries(phrases).forEach(([k, v]) => {
      if (typeof v === "string") {
        lowerMaps[lang][k.toLowerCase().trim()] = v;
      }
    });
  });

  // Map non-English phrases back to English key
  ["hi", "kn"].forEach((lang) => {
    const phrases = translationsMap[lang]?.phrases || {};
    Object.entries(phrases).forEach(([enKey, transVal]) => {
      if (typeof transVal === "string" && transVal.trim()) {
        reverseToEn[transVal.trim()] = enKey.trim();
        reverseToEn[transVal.toLowerCase().trim()] = enKey.trim();
      }
    });
  });

  return { lowerMaps, reverseToEn };
}

const { lowerMaps, reverseToEn } = buildLookupHelpers();

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
   * Helper that finds translation of a phrase with quote/punctuation tolerance
   */
  const findPhraseTranslation = useCallback((targetLang, text) => {
    if (!text || typeof text !== "string") return null;
    const trimmed = text.trim();
    if (!trimmed) return null;

    if (targetLang === "en") {
      if (reverseToEn[trimmed]) return reverseToEn[trimmed];
      return trimmed;
    }

    const phrases = translationsMap[targetLang]?.phrases || {};
    const lowerMap = lowerMaps[targetLang] || {};

    // 1. Direct exact match
    if (phrases[trimmed]) return phrases[trimmed];

    // 2. Case-insensitive match
    const lower = trimmed.toLowerCase();
    if (lowerMap[lower]) return lowerMap[lower];

    // 3. Strip quotes and look up
    const quoteMatch = trimmed.match(/^([“"'])(.*?)([”"'])$/);
    if (quoteMatch) {
      const inner = quoteMatch[2].trim();
      const transInner = phrases[inner] || lowerMap[inner.toLowerCase()];
      if (transInner) {
        return `${quoteMatch[1]}${transInner}${quoteMatch[3]}`;
      }
    }

    // 4. Strip trailing punctuation (: or . or →)
    const trailingPunctMatch = trimmed.match(/^(.*?)([:\.\?!]|\s*[→←↑↓]|\s*&rarr;)$/);
    if (trailingPunctMatch) {
      const base = trailingPunctMatch[1].trim();
      const punct = trailingPunctMatch[2];
      const transBase = phrases[base] || lowerMap[base.toLowerCase()];
      if (transBase) {
        return `${transBase}${punct}`;
      }
    }

    // 5. Check if text is currently translated in another language
    const enEquivalent = reverseToEn[trimmed] || reverseToEn[lower];
    if (enEquivalent) {
      if (phrases[enEquivalent]) return phrases[enEquivalent];
      if (lowerMap[enEquivalent.toLowerCase()]) return lowerMap[enEquivalent.toLowerCase()];
    }

    return null;
  }, []);

  /**
   * Universal translation helper:
   * 1. Checks structured dot-paths in active language
   * 2. Checks exact / normalized phrase match in active language
   * 3. Checks fallback phrase match in active language
   * 4. Returns fallback or keyPath
   */
  const t = useCallback(
    (keyPath, fallback = "") => {
      if (!keyPath) return fallback;

      // 1. Structured dot path lookup
      if (typeof keyPath === "string" && keyPath.includes(".")) {
        const parts = keyPath.split(".");
        let current = translations;
        let found = true;
        for (const part of parts) {
          if (current && typeof current === "object" && part in current) {
            current = current[part];
          } else {
            found = false;
            break;
          }
        }
        if (found && typeof current === "string") {
          return current;
        }

        // If English dot path fallback
        if (lang === "en") {
          let engVal = enTranslations;
          let engFound = true;
          for (const engPart of parts) {
            if (engVal && typeof engVal === "object" && engPart in engVal) {
              engVal = engVal[engPart];
            } else {
              engFound = false;
              break;
            }
          }
          if (engFound && typeof engVal === "string") {
            return engVal;
          }
        }
      }

      // 2. Phrase lookup in current language
      const trans = findPhraseTranslation(lang, keyPath);
      if (trans) return trans;

      // 3. Fallback phrase lookup in current language
      if (fallback) {
        const transFallback = findPhraseTranslation(lang, fallback);
        if (transFallback) return transFallback;
      }

      return fallback || keyPath;
    },
    [lang, translations, findPhraseTranslation]
  );

  // Universal DOM text observer to guarantee 100% translation coverage across all pages & dynamically rendered components
  useEffect(() => {
    if (typeof window === "undefined" || !document?.body) return;

    let isTranslating = false;

    const translateNode = (node) => {
      if (!node || node.nodeType !== Node.TEXT_NODE) return;
      const raw = node.nodeValue;
      if (!raw || !raw.trim()) return;

      const parentTag = node.parentElement?.tagName?.toLowerCase();
      if (
        parentTag === "script" ||
        parentTag === "style" ||
        parentTag === "pre" ||
        parentTag === "code"
      ) {
        return;
      }

      if (lang === "en") {
        if (node.__origText !== undefined && node.nodeValue !== node.__origText) {
          node.nodeValue = node.__origText;
        } else {
          const rev = reverseToEn[raw.trim()] || reverseToEn[raw.trim().toLowerCase()];
          if (rev) {
            node.nodeValue = rev;
          }
        }
        return;
      }

      if (node.__origText === undefined) {
        const rev = reverseToEn[raw.trim()] || reverseToEn[raw.trim().toLowerCase()];
        node.__origText = rev || raw;
      }

      const translated = findPhraseTranslation(lang, node.__origText);
      if (translated && node.nodeValue.trim() !== translated.trim()) {
        const leading = node.nodeValue.match(/^\s*/)?.[0] || "";
        const trailing = node.nodeValue.match(/\s*$/)?.[0] || "";
        node.nodeValue = leading + translated + trailing;
      }
    };

    const translateAttributes = () => {
      const inputs = document.querySelectorAll("input[placeholder], textarea[placeholder]");
      inputs.forEach((el) => {
        const ph = el.getAttribute("placeholder");
        if (!ph) return;

        if (lang === "en") {
          if (el.__origPlaceholder !== undefined) {
            el.setAttribute("placeholder", el.__origPlaceholder);
          }
          return;
        }

        if (el.__origPlaceholder === undefined) {
          el.__origPlaceholder = ph;
        }

        const translated = findPhraseTranslation(lang, el.__origPlaceholder);
        if (translated) {
          el.setAttribute("placeholder", translated);
        }
      });
    };

    const runFullDOMTranslation = () => {
      if (isTranslating) return;
      isTranslating = true;
      try {
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        let current;
        while ((current = walker.nextNode())) {
          translateNode(current);
        }
        translateAttributes();
      } finally {
        isTranslating = false;
      }
    };

    // Run immediately on lang change
    runFullDOMTranslation();

    // Observe subsequent dynamic mutations
    const observer = new MutationObserver((mutations) => {
      if (isTranslating) return;
      isTranslating = true;
      try {
        for (const m of mutations) {
          if (m.type === "childList") {
            m.addedNodes.forEach((added) => {
              if (added.nodeType === Node.TEXT_NODE) {
                translateNode(added);
              } else if (added.nodeType === Node.ELEMENT_NODE) {
                const walker = document.createTreeWalker(added, NodeFilter.SHOW_TEXT);
                let current;
                while ((current = walker.nextNode())) {
                  translateNode(current);
                }
              }
            });
          } else if (m.type === "characterData") {
            translateNode(m.target);
          }
        }
        translateAttributes();
      } finally {
        isTranslating = false;
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      observer.disconnect();
    };
  }, [lang, findPhraseTranslation]);

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
