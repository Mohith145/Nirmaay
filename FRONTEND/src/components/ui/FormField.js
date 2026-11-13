import React from "react";
import clsx from "clsx";

export function FormField({
  label,
  error,
  helperText,
  required = false,
  children,
  id,
  className = "",
}) {
  return (
    <div className={clsx("flex flex-col gap-1.5 w-full", className)}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-ink-900 flex items-center gap-1">
          {label}
          {required && <span className="text-emergency">*</span>}
        </label>
      )}
      {children}
      {error && <p className="text-xs text-emergency font-medium">{error}</p>}
      {!error && helperText && <p className="text-xs text-ink-600">{helperText}</p>}
    </div>
  );
}
