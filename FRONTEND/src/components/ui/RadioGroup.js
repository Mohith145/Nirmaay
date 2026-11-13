import React from "react";
import clsx from "clsx";

export function RadioGroup({
  label,
  name,
  options = [],
  value,
  onChange,
  error,
  helperText,
  disabled = false,
  orientation = "vertical",
  className = "",
}) {
  return (
    <fieldset className={clsx("w-full flex flex-col gap-2", className)}>
      {label && <legend className="text-sm font-medium text-ink-900 mb-1">{label}</legend>}
      <div
        className={clsx(
          "gap-3",
          orientation === "horizontal" ? "flex flex-wrap items-center" : "flex flex-col"
        )}
      >
        {options.map((opt) => {
          const isSelected = value === opt.value;
          const optId = `${name}-${opt.value}`;
          return (
            <label
              key={opt.value}
              htmlFor={optId}
              className={clsx(
                "flex items-start gap-3 p-3 rounded-lg border cursor-pointer select-none transition-all min-h-touch",
                isSelected
                  ? "border-brand-600 bg-brand-50"
                  : "border-line-200 bg-surface-0 hover:bg-surface-50",
                (disabled || opt.disabled) && "cursor-not-allowed opacity-50"
              )}
            >
              <div className="relative flex items-center justify-center mt-0.5">
                <input
                  type="radio"
                  id={optId}
                  name={name}
                  value={opt.value}
                  checked={isSelected}
                  disabled={disabled || opt.disabled}
                  onChange={(e) => onChange && onChange(e.target.value)}
                  className="peer sr-only"
                />
                <div className="w-5 h-5 rounded-full border border-line-200 bg-surface-0 peer-checked:border-brand-600 flex items-center justify-center peer-focus-visible:ring-2 peer-focus-visible:ring-brand-600 peer-focus-visible:ring-offset-2">
                  {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-brand-600" />}
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-ink-900 leading-tight">{opt.label}</span>
                {opt.description && (
                  <span className="text-xs text-ink-600 mt-0.5">{opt.description}</span>
                )}
              </div>
            </label>
          );
        })}
      </div>
      {error && <p className="text-xs text-emergency font-medium mt-1">{error}</p>}
      {!error && helperText && <p className="text-xs text-ink-600 mt-1">{helperText}</p>}
    </fieldset>
  );
}
