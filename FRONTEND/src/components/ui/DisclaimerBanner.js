import React from "react";
import clsx from "clsx";
import { ShieldAlert } from "lucide-react";
import { useI18n } from "../../context/I18nContext";

export function DisclaimerBanner({
  message,
  variant = "subtle",
  className = "",
  showIcon = true,
}) {
  const { t } = useI18n();
  const text =
    message ||
    t(
      "app.disclaimer",
      "Screening aid, not diagnosis. Always consult a qualified medical professional for definitive diagnosis."
    );

  const variantStyles = {
    subtle: "bg-surface-100 text-ink-600 border-line-200",
    alert: "bg-risk-med-bg text-ink-900 border-risk-med/30 font-medium",
    brand: "bg-brand-50 text-brand-700 border-brand-100",
  }[variant] || "bg-surface-100 text-ink-600 border-line-200";

  return (
    <div
      role="note"
      aria-label="Medical Disclaimer"
      className={clsx(
        "px-4 py-2.5 rounded-lg border text-xs sm:text-sm flex items-center gap-2.5",
        variantStyles,
        className
      )}
    >
      {showIcon && <ShieldAlert className="w-4 h-4 flex-shrink-0 text-brand-600" />}
      <p className="flex-1 leading-snug">{text}</p>
    </div>
  );
}
