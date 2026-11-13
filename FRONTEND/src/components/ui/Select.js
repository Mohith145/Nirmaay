import React from "react";
import clsx from "clsx";
import { ChevronDown } from "lucide-react";

export function Select({
  label,
  error,
  helperText,
  id,
  options = [],
  className = "",
  containerClassName = "",
  required = false,
  placeholder = "Select an option",
  children,
  ...props
}) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className={clsx("w-full flex flex-col gap-1.5", containerClassName)}>
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-ink-900 flex items-center gap-1">
          {label}
          {required && <span className="text-emergency">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${selectId}-error` : helperText ? `${selectId}-help` : undefined}
          className={clsx(
            "w-full px-3.5 py-2.5 pr-10 min-h-touch rounded-lg text-sm bg-surface-0 border text-ink-900 appearance-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:border-brand-600 disabled:opacity-50 disabled:bg-surface-50 disabled:cursor-not-allowed",
            error ? "border-emergency text-emergency focus-visible:ring-emergency" : "border-line-200 hover:border-ink-400",
            className
          )}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.length > 0
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        <ChevronDown className="w-4 h-4 text-ink-600 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>
      {error && (
        <p id={`${selectId}-error`} className="text-xs text-emergency font-medium">
          {error}
        </p>
      )}
      {!error && helperText && (
        <p id={`${selectId}-help`} className="text-xs text-ink-600">
          {helperText}
        </p>
      )}
    </div>
  );
}
