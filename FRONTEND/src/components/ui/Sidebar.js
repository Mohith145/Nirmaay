"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import * as Icons from "lucide-react";
import { ROLE_NAVIGATION } from "../../config/navigation";
import { ROLE_LABELS } from "../../config/roles";
import { useAuth } from "../../context/AuthContext";
import { useI18n } from "../../context/I18nContext";
import { Badge } from "./Badge";

export function Sidebar({ role, isOpen = true, onClose = null, className = "" }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { t } = useI18n();

  const navItems = ROLE_NAVIGATION[role] || [];

  return (
    <aside
      className={clsx(
        "w-64 bg-surface-0 border-r border-line-200 flex flex-col justify-between h-[calc(100vh-4rem)] sticky top-16 select-none",
        className
      )}
    >
      <div className="p-4 flex flex-col gap-6 overflow-y-auto">
        {/* Role Banner */}
        <div className="p-3 rounded-xl bg-surface-50 border border-line-200 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-ink-600">
              Workspace
            </span>
            <span className="text-sm font-bold text-ink-900">
              {ROLE_LABELS[role] || role}
            </span>
          </div>
          <Badge variant="brand" size="sm">
            Active
          </Badge>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const IconComponent = Icons[item.icon] || Icons.Circle;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onClose && onClose()}
                className={clsx(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-touch",
                  isActive
                    ? "bg-brand-50 text-brand-700 font-semibold shadow-xs"
                    : "text-ink-600 hover:text-ink-900 hover:bg-surface-50"
                )}
              >
                <IconComponent
                  className={clsx(
                    "w-4 h-4 flex-shrink-0",
                    isActive ? "text-brand-600 stroke-[2.5]" : "text-ink-400 stroke-[2]"
                  )}
                />
                <span className="truncate">{t(item.labelKey, item.fallback)}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Info & Quick Action */}
      {user && (
        <div className="p-4 border-t border-line-200 bg-surface-50/50 flex flex-col gap-1">
          <span className="text-xs text-ink-600 truncate">{user.email}</span>
          <span className="text-[10px] text-ink-400 font-mono">ID: #{user.id}</span>
        </div>
      )}
    </aside>
  );
}
