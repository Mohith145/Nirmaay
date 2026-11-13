import React from "react";
import clsx from "clsx";

export function Spinner({ size = "md", color = "brand", className = "" }) {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-6 h-6 border-2",
    lg: "w-8 h-8 border-3",
    xl: "w-12 h-12 border-4",
  }[size] || "w-6 h-6 border-2";

  const colorClasses = {
    brand: "border-brand-600 border-t-transparent",
    white: "border-surface-0 border-t-transparent",
    ink: "border-ink-600 border-t-transparent",
  }[color] || "border-brand-600 border-t-transparent";

  return (
    <div
      role="status"
      aria-label="Loading"
      className={clsx(
        "rounded-full animate-spin flex-shrink-0",
        sizeClasses,
        colorClasses,
        className
      )}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}
