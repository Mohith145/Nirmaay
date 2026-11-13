import React from "react";
import Link from "next/link";
import clsx from "clsx";
import { AlertOctagon, PhoneCall } from "lucide-react";
import { ROUTES } from "../../config/routes";

export function EmergencyBanner({
  message = "Severe bleeding, choking, or inability to swallow requires immediate emergency care.",
  phone = "112 / 108",
  className = "",
}) {
  return (
    <div
      role="alert"
      className={clsx(
        "bg-emergency-bg border-l-4 border-emergency p-4 rounded-r-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-ink-900 shadow-xs",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <AlertOctagon className="w-5 h-5 text-emergency flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-emergency block text-sm sm:inline mr-2">
            EMERGENCY WARNING:
          </span>
          <span className="text-sm font-medium">{message}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-auto">
        <a
          href="tel:112"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emergency text-surface-0 text-xs sm:text-sm font-semibold hover:opacity-90 transition-opacity min-h-touch"
        >
          <PhoneCall className="w-4 h-4" />
          <span>Call {phone}</span>
        </a>
        <Link
          href={ROUTES.EMERGENCY}
          className="inline-flex items-center px-3 py-1.5 rounded-lg border border-emergency text-emergency text-xs sm:text-sm font-semibold hover:bg-emergency/10 transition-colors min-h-touch"
        >
          Guidance
        </Link>
      </div>
    </div>
  );
}
