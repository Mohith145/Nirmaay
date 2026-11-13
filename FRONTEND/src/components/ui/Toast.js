import React from "react";
import clsx from "clsx";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

export function Toast({
  type = "info",
  message,
  onDismiss,
  className = "",
}) {
  const typeStyles = {
    success: "bg-surface-0 border-risk-low text-ink-900 border-l-4",
    error: "bg-surface-0 border-emergency text-ink-900 border-l-4",
    warning: "bg-surface-0 border-risk-med text-ink-900 border-l-4",
    info: "bg-surface-0 border-brand-600 text-ink-900 border-l-4",
  }[type] || "bg-surface-0 border-line-200 text-ink-900 border-l-4";

  const icon = {
    success: <CheckCircle2 className="w-5 h-5 text-risk-low flex-shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-emergency flex-shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-risk-med flex-shrink-0" />,
    info: <Info className="w-5 h-5 text-brand-600 flex-shrink-0" />,
  }[type];

  return (
    <div
      role="alert"
      className={clsx(
        "p-4 rounded-lg shadow-lg border border-line-200 flex items-start gap-3 text-sm",
        typeStyles,
        className
      )}
    >
      {icon}
      <div className="flex-1 font-medium">{message}</div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="text-ink-600 hover:text-ink-900 p-0.5 rounded transition-colors"
          aria-label="Dismiss toast"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
