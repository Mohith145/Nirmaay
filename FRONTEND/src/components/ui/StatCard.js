import React from "react";
import clsx from "clsx";
import { DemoBadge } from "./DemoBadge";

export function StatCard({
  label,
  value,
  sublabel,
  icon = null,
  trend = null,
  isDemo = false,
  className = "",
}) {
  return (
    <div
      className={clsx(
        "p-5 rounded-xl bg-surface-0 border border-line-200 shadow-xs flex flex-col justify-between gap-3 relative",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-ink-600">
          {label}
        </span>
        <div className="flex items-center gap-1.5">
          {isDemo && <DemoBadge size="sm" />}
          {icon && (
            <div className="p-2 rounded-lg bg-brand-50 text-brand-600 flex-shrink-0">
              {icon}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-bold text-ink-900 tracking-tight">
          {value}
        </span>
        {trend && (
          <span
            className={clsx(
              "text-xs font-semibold",
              trend > 0 ? "text-risk-low" : trend < 0 ? "text-emergency" : "text-ink-600"
            )}
          >
            {trend > 0 ? `+${trend}%` : `${trend}%`}
          </span>
        )}
      </div>

      {sublabel && <p className="text-xs text-ink-600">{sublabel}</p>}
    </div>
  );
}
