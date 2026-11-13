import React from "react";
import clsx from "clsx";
import { CheckCircle, AlertCircle, Info } from "lucide-react";

export function ReasonsList({
  reasons = [],
  title = "Contributing Factors & Rule Evidence",
  variant = "default",
  className = "",
}) {
  if (!reasons || reasons.length === 0) {
    return (
      <div className={clsx("p-4 rounded-lg bg-surface-50 border border-line-200 text-xs text-ink-600", className)}>
        No risk factors or rules identified for this assessment.
      </div>
    );
  }

  return (
    <div className={clsx("flex flex-col gap-2.5", className)}>
      {title && (
        <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-600 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-brand-600" />
          {title}
        </h4>
      )}
      <ul className="flex flex-col gap-2">
        {reasons.map((reason, idx) => (
          <li
            key={idx}
            className="flex items-start gap-2.5 p-2.5 rounded-lg bg-surface-50 border border-line-200 text-sm text-ink-900"
          >
            <AlertCircle className="w-4 h-4 text-risk-med flex-shrink-0 mt-0.5" />
            <span className="leading-snug">{reason}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
