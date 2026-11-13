import React from "react";
import clsx from "clsx";
import { Check } from "lucide-react";

export function Checkbox({
  label,
  description,
  helperText,
  id,
  checked = false,
  onChange,
  disabled = false,
  className = "",
  containerClassName = "",
  ...props
}) {
  const checkboxId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
  const help = description || helperText;

  return (
    <label
      htmlFor={checkboxId}
      className={clsx(
        "flex items-start gap-3 cursor-pointer select-none group min-h-touch py-1",
        disabled && "cursor-not-allowed opacity-50",
        containerClassName
      )}
    >
      <div className="relative flex items-center justify-center mt-0.5">
        <input
          id={checkboxId}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="peer sr-only"
          {...props}
        />
        <div
          className={clsx(
            "w-5 h-5 rounded border transition-colors flex items-center justify-center border-line-200 bg-surface-0 peer-checked:bg-brand-600 peer-checked:border-brand-600 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-600 peer-focus-visible:ring-offset-2 group-hover:border-ink-400",
            className
          )}
        >
          {checked && <Check className="w-3.5 h-3.5 text-surface-0 stroke-[3]" />}
        </div>
      </div>
      {(label || help) && (
        <div className="flex flex-col">
          {label && <span className="text-sm font-medium text-ink-900 leading-tight">{label}</span>}
          {help && <span className="text-xs text-ink-600 mt-0.5">{help}</span>}
        </div>
      )}
    </label>
  );
}
