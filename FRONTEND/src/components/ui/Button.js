import React from "react";
import clsx from "clsx";
import { Spinner } from "./Spinner";

export function Button({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled = false,
  icon = null,
  iconPosition = "left",
  type = "button",
  className = "",
  onClick,
  ...props
}) {
  const baseStyles =
    "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none min-h-touch";

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs min-h-[36px]",
    md: "px-4 py-2.5 text-sm min-h-touch",
    lg: "px-6 py-3.5 text-base min-h-[50px]",
  }[size] || "px-4 py-2.5 text-sm min-h-touch";

  const variantStyles = {
    primary: "bg-brand-600 text-surface-0 hover:bg-brand-700 active:bg-brand-700 shadow-sm",
    secondary: "bg-surface-0 text-ink-900 border border-line-200 hover:bg-surface-50 active:bg-surface-100 shadow-sm",
    outline: "border border-brand-600 text-brand-600 bg-transparent hover:bg-brand-50 active:bg-brand-100",
    danger: "bg-emergency text-surface-0 hover:bg-emergency-bg hover:text-emergency border border-transparent shadow-sm",
    ghost: "bg-transparent text-ink-900 hover:bg-surface-100 active:bg-line-200",
    subtle: "bg-brand-50 text-brand-700 hover:bg-brand-100 active:bg-brand-100",
  }[variant] || "bg-brand-600 text-surface-0";

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={clsx(baseStyles, sizeStyles, variantStyles, className)}
      {...props}
    >
      {isLoading ? (
        <span className="inline-flex items-center gap-2">
          <Spinner size="sm" color={variant === "primary" || variant === "danger" ? "white" : "brand"} />
          <span>{children}</span>
        </span>
      ) : (
        <span className="inline-flex items-center gap-2">
          {icon && iconPosition === "left" && <span className="flex-shrink-0">{icon}</span>}
          <span>{children}</span>
          {icon && iconPosition === "right" && <span className="flex-shrink-0">{icon}</span>}
        </span>
      )}
    </button>
  );
}
