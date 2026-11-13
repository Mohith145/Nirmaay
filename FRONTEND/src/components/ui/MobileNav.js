"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import * as Icons from "lucide-react";
import { ROLE_NAVIGATION } from "../../config/navigation";
import { useI18n } from "../../context/I18nContext";

export function MobileNav({ role }) {
  const pathname = usePathname();
  const { t } = useI18n();
  const navItems = (ROLE_NAVIGATION[role] || []).slice(0, 4); // Top 4 items for bottom bar

  if (navItems.length === 0) return null;

  return (
    <nav
      aria-label="Mobile navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface-0 border-t border-line-200 px-2 py-1 flex items-center justify-around shadow-lg"
    >
      {navItems.map((item) => {
        const IconComponent = Icons[item.icon] || Icons.Circle;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              "flex flex-col items-center justify-center p-2 rounded-lg min-h-touch flex-1 transition-colors",
              isActive ? "text-brand-600 font-semibold" : "text-ink-600 hover:text-ink-900"
            )}
          >
            <IconComponent className={clsx("w-5 h-5", isActive && "stroke-[2.5]")} />
            <span className="text-[10px] mt-1 truncate max-w-[70px]">
              {t(item.labelKey, item.fallback)}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
