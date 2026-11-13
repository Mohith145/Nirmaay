"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Menu, X, LogIn, LogOut, User, PhoneCall } from "lucide-react";
import { PUBLIC_NAV } from "../../config/navigation";
import { ROUTES } from "../../config/routes";
import { ROLE_LABELS, ROLE_HOME_ROUTES } from "../../config/roles";
import { useAuth } from "../../context/AuthContext";
import { useI18n } from "../../context/I18nContext";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Badge } from "./Badge";

export function Navbar({ onToggleSidebar = null }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const { t } = useI18n();

  return (
    <header className="sticky top-0 z-40 w-full bg-surface-0 border-b border-line-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo & Sidebar Toggle */}
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              aria-label="Toggle navigation drawer"
              className="lg:hidden p-2 rounded-lg text-ink-600 hover:text-ink-900 hover:bg-surface-100 min-h-touch min-w-touch flex items-center justify-center"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <Link href={ROUTES.HOME} className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-brand-600 text-surface-0 flex items-center justify-center font-bold text-lg shadow-sm group-hover:bg-brand-700 transition-colors">
              <Activity className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base sm:text-lg text-ink-900 tracking-tight leading-none">
                Nirmay
              </span>
              <span className="text-[10px] text-ink-600 font-medium tracking-wide">
                Oral Cancer Triage
              </span>
            </div>
          </Link>
        </div>

        {/* Desktop Public Nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {PUBLIC_NAV.map((item) => {
            const isActive = pathname === item.href;
            if (item.isEmergency) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-lg text-emergency bg-emergency-bg hover:bg-emergency/15 transition-colors ml-2 min-h-[38px]"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>{t(item.labelKey, item.fallback)}</span>
                </Link>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors min-h-[38px] flex items-center ${
                  isActive
                    ? "bg-brand-50 text-brand-700"
                    : "text-ink-600 hover:text-ink-900 hover:bg-surface-50"
                }`}
              >
                {t(item.labelKey, item.fallback)}
              </Link>
            );
          })}
        </nav>

        {/* Right actions: Language Switcher, Accessibility, User / Login */}
        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher />

          {isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              <Link
                href={ROLE_HOME_ROUTES[user.role] || "/"}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line-200 bg-surface-50 hover:bg-surface-100 text-xs font-medium min-h-touch"
              >
                <User className="w-3.5 h-3.5 text-brand-600" />
                <span className="truncate max-w-[120px]">{user.email}</span>
                <Badge variant="brand" size="sm">
                  {ROLE_LABELS[user.role] || user.role}
                </Badge>
              </Link>

              <button
                type="button"
                onClick={logout}
                title="Sign out"
                aria-label="Sign out"
                className="p-2 rounded-lg border border-line-200 bg-surface-0 hover:bg-surface-50 text-ink-600 hover:text-emergency transition-colors min-h-touch min-w-touch flex items-center justify-center"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href={ROUTES.LOGIN}
                className="inline-flex items-center gap-1 px-3.5 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-surface-0 text-xs sm:text-sm font-semibold transition-colors min-h-touch shadow-xs"
              >
                <LogIn className="w-4 h-4" />
                <span>{t("nav.login", "Sign In")}</span>
              </Link>
            </div>
          )}

          {/* Mobile public nav toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-public-navigation"
            className="lg:hidden p-2 rounded-lg text-ink-600 hover:bg-surface-100 min-h-touch min-w-touch flex items-center justify-center"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Public Nav Dropdown */}
      {mobileMenuOpen && (
        <div id="mobile-public-navigation" className="lg:hidden border-t border-line-200 bg-surface-0 px-4 py-3 space-y-1 shadow-md">
          {PUBLIC_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2.5 rounded-lg text-sm font-medium ${
                item.isEmergency
                  ? "bg-emergency-bg text-emergency font-bold"
                  : pathname === item.href
                  ? "bg-brand-50 text-brand-700 font-semibold"
                  : "text-ink-600 hover:bg-surface-50"
              }`}
            >
              {t(item.labelKey, item.fallback)}
            </Link>
          ))}
          {isAuthenticated && user && (
            <div className="pt-2 border-t border-line-200">
              <Link
                href={ROLE_HOME_ROUTES[user.role] || "/"}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2.5 rounded-lg text-sm font-semibold text-brand-600 bg-brand-50"
              >
                Go to {ROLE_LABELS[user.role] || "Dashboard"}
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
