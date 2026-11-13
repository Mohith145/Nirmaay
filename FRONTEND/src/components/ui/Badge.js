import React from "react";
import clsx from "clsx";

export function Badge({
  children,
  variant = "default",
  size = "md",
  className = "",
  icon = null,
}) {
  const sizeStyles = {
    sm: "px-2 py-0.5 text-xs font-medium",
    md: "px-2.5 py-1 text-xs font-semibold",
    lg: "px-3 py-1.5 text-sm font-semibold",
  }[size] || "px-2.5 py-1 text-xs font-semibold";

  const variantStyles = {
    default: "bg-surface-100 text-ink-900 border border-line-200",
    brand: "bg-brand-50 text-brand-700 border border-brand-100",
    "risk-low": "bg-risk-low-bg text-risk-low border border-risk-low/30",
    "risk-med": "bg-risk-med-bg text-risk-med border border-risk-med/30",
    "risk-high": "bg-risk-high-bg text-risk-high border border-risk-high/30",
    emergency: "bg-emergency-bg text-emergency border border-emergency/30 animate-pulse",
    demo: "bg-demo-bg text-demo border border-demo/30",
    info: "bg-info-bg text-info border border-info/30",
    outline: "bg-transparent text-ink-600 border border-line-200",
  }[variant] || "bg-surface-100 text-ink-900 border border-line-200";

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full select-none leading-none tracking-wide",
        sizeStyles,
        variantStyles,
        className
      )}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}
