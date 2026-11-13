import React from "react";
import clsx from "clsx";
import { Sparkles } from "lucide-react";

export function DemoBadge({
  label = "demo data",
  size = "md",
  className = "",
  showIcon = true,
}) {
  const sizeStyles = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3 py-1.5 text-sm",
  }[size] || "px-2.5 py-1 text-xs";

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full font-semibold uppercase tracking-wider bg-demo-bg text-demo border border-demo/30 select-none",
        sizeStyles,
        className
      )}
    >
      {showIcon && <Sparkles className="w-3 h-3 flex-shrink-0" />}
      <span>{label}</span>
    </span>
  );
}
