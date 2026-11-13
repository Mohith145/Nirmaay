import React from "react";
import clsx from "clsx";

export function Input({
  label,
  error,
  helperText,
  id,
  type = "text",
  className = "",
  containerClassName = "",
  required = false,
  ...props
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className={clsx("w-full flex flex-col gap-1.5", containerClassName)}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-ink-900 flex items-center gap-1">
          {label}
          {required && <span className="text-emergency">*</span>}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-help` : undefined}
        className={clsx(
          "w-full px-3.5 py-2.5 min-h-touch rounded-lg text-sm bg-surface-0 border text-ink-900 transition-colors placeholder:text-ink-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:border-brand-600 disabled:opacity-50 disabled:bg-surface-50 disabled:cursor-not-allowed",
          error ? "border-emergency text-emergency focus-visible:ring-emergency" : "border-line-200 hover:border-ink-400",
          className
        )}
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} className="text-xs text-emergency font-medium">
          {error}
        </p>
      )}
      {!error && helperText && (
        <p id={`${inputId}-help`} className="text-xs text-ink-600">
          {helperText}
        </p>
      )}
    </div>
  );
}
