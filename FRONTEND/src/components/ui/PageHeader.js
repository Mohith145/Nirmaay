import React from "react";
import Link from "next/link";
import clsx from "clsx";
import { ArrowLeft } from "lucide-react";

export function PageHeader({
  title,
  description = null,
  backHref = null,
  backLabel = "Back",
  actions = null,
  badge = null,
  className = "",
}) {
  return (
    <div
      className={clsx(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-line-200 mb-6",
        className
      )}
    >
      <div className="flex flex-col gap-1.5">
        {backHref && (
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-600 hover:text-brand-600 transition-colors mb-1 min-h-[36px]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{backLabel}</span>
          </Link>
        )}
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-xl sm:text-2xl font-bold text-ink-900 tracking-tight">
            {title}
          </h1>
          {badge && <div>{badge}</div>}
        </div>
        {description && (
          <p className="text-sm text-ink-600 max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-3 flex-wrap flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
