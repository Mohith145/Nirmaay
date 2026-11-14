"use client";

import React, { useState, useRef, useEffect } from "react";
import { Globe, Type, Eye, ChevronDown } from "lucide-react";
import { useI18n } from "../../context/I18nContext";

export function LanguageSwitcher({ showAccessibility = true, className = "" }) {
  const { lang, setLang, isLargeText, toggleLargeText, isHighContrast, toggleHighContrast } =
    useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const languages = [
    { code: "en", label: "English", native: "English" },
    { code: "hi", label: "Hindi", native: "हिन्दी" },
    { code: "kn", label: "Kannada", native: "ಕನ್ನಡ" },
  ];

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentLang = languages.find((l) => l.code === lang) || languages[0];

  return (
    <div className={`relative inline-flex items-center gap-2 ${className}`} ref={dropdownRef}>
      {/* Language Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={`Select language: ${currentLang.native}`}
        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg border border-line-200 bg-surface-0 hover:bg-surface-50 text-ink-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 min-h-touch"
      >
        <Globe className="w-4 h-4 text-brand-600" />
        <span>{currentLang.native}</span>
        <ChevronDown className="w-3.5 h-3.5 text-ink-600" />
      </button>

      {/* Language Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-48 bg-surface-0 border border-line-200 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-1 text-xs font-semibold text-ink-600 uppercase tracking-wider border-b border-line-200 mb-1">
            Language / भाषा
          </div>
          {languages.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => {
                setLang(l.code);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3.5 py-2.5 text-sm flex items-center justify-between hover:bg-brand-50 transition-colors ${
                lang === l.code ? "text-brand-600 font-semibold bg-brand-50" : "text-ink-900"
              }`}
            >
              <span>{l.native}</span>
              <span className="text-xs text-ink-600 font-normal">{l.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Accessibility Quick Toggles */}
      {showAccessibility && (
        <div className="flex items-center gap-1">
          {/* Large Text Mode */}
          <button
            type="button"
            onClick={toggleLargeText}
            title={isLargeText ? "Disable large text" : "Enable large text"}
            aria-pressed={isLargeText}
            aria-label="Toggle large text mode"
            className={`p-2 rounded-lg border transition-colors min-h-touch min-w-touch flex items-center justify-center ${
              isLargeText
                ? "bg-brand-600 border-brand-600 text-surface-0"
                : "bg-surface-0 border-line-200 text-ink-900 hover:bg-surface-50"
            }`}
          >
            <Type className="w-4 h-4" />
          </button>

          {/* High Contrast Mode */}
          <button
            type="button"
            onClick={toggleHighContrast}
            title={isHighContrast ? "Disable high contrast" : "Enable high contrast"}
            aria-pressed={isHighContrast}
            aria-label="Toggle high contrast mode"
            className={`p-2 rounded-lg border transition-colors min-h-touch min-w-touch flex items-center justify-center ${
              isHighContrast
                ? "bg-brand-600 border-brand-600 text-surface-0"
                : "bg-surface-0 border-line-200 text-ink-900 hover:bg-surface-50"
            }`}
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
