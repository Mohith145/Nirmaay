"use client";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, Inbox, Loader2, ShieldAlert, Info } from "lucide-react";
import { useT } from "../adapters";

export const cx = (...a) => a.filter(Boolean).join(" ");

const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700";
export const btnPrimary = cx(
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white",
  "transition-colors hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50",
  focus
);
export const btnSecondary = cx(
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800",
  "transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50",
  focus
);
export const btnDanger = cx(
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-red-700 px-4 text-sm font-semibold text-white",
  "transition-colors hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50",
  focus
);
export const inputCls = cx(
  "min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400",
  focus
);

export const humanize = (s = "") => String(s).replace(/[_-]+/g, " ").replace(/^\w/, (c) => c.toUpperCase());

export function fmtDateTime(v) {
  if (!v) return "-";
  const d = new Date(v);
  return Number.isNaN(d.getTime())
    ? String(v)
    : d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function Card({ title, action, children, className }) {
  return (
    <section className={cx("rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5", className)}>
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          {title && <h2 className="text-base font-semibold text-slate-900">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function PageHeader({ title, subtitle, backHref, backLabel, actions }) {
  return (
    <header className="mb-5">
      {backHref && (
        <Link href={backHref} className={cx("mb-2 inline-flex min-h-[44px] items-center gap-1 text-sm text-teal-800 hover:underline", focus)}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {backLabel}
        </Link>
      )}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </header>
  );
}

export function LoadingState({ label }) {
  const t = useT();
  return (
    <div role="status" aria-live="polite" className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
      <Loader2 className="h-5 w-5 motion-safe:animate-spin" aria-hidden="true" />
      {label || t("common.loading", "Loading...")}
    </div>
  );
}

export function EmptyState({ title, hint, action }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
      <Inbox className="h-8 w-8 text-slate-400" aria-hidden="true" />
      <p className="font-medium text-slate-800">{title}</p>
      {hint && <p className="max-w-md text-sm text-slate-600">{hint}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  const t = useT();
  return (
    <div role="alert" className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <span>{message || t("common.error", "Something went wrong.")}</span>
      </div>
      {onRetry && (
        <button type="button" onClick={onRetry} className={btnSecondary}>
          {t("common.retry", "Try again")}
        </button>
      )}
    </div>
  );
}

export function PermissionState({ reason }) {
  const t = useT();
  return (
    <div role="alert" className="mx-auto max-w-lg rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
      <ShieldAlert className="mx-auto h-8 w-8 text-amber-700" aria-hidden="true" />
      <h1 className="mt-2 text-lg font-semibold text-amber-900">{t("common.noAccess", "You don't have access to this page")}</h1>
      <p className="mt-1 text-sm text-amber-900">
        {reason === "signin"
          ? t("common.signInRequired", "Please sign in to continue.")
          : t("common.roleRequired", "This area is only available to authorised clinical staff.")}
      </p>
      <Link href="/" className={cx(btnSecondary, "mt-4")}>
        {t("common.home", "Back to home")}
      </Link>
    </div>
  );
}

const STATUS = {
  pending: "bg-amber-100 text-amber-900",
  in_review: "bg-sky-100 text-sky-900",
  reviewed: "bg-emerald-100 text-emerald-900",
  follow_up: "bg-violet-100 text-violet-900",
  scheduled: "bg-sky-100 text-sky-900",
  live: "bg-emerald-100 text-emerald-900",
  ended: "bg-slate-200 text-slate-800",
};
export function StatusBadge({ status }) {
  const t = useT();
  if (!status) return null;
  return (
    <span className={cx("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", STATUS[status] || "bg-slate-100 text-slate-800")}>
      {t(`doctor.status.${status}`, humanize(status))}
    </span>
  );
}

const PRIORITY = { urgent: "bg-red-100 text-red-900", high: "bg-orange-100 text-orange-900", routine: "bg-slate-100 text-slate-800" };
export function PriorityBadge({ priority }) {
  const t = useT();
  if (!priority) return null;
  return (
    <span className={cx("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", PRIORITY[priority] || "bg-slate-100 text-slate-800")}>
      {t(`doctor.priority.${priority}`, humanize(priority))}
    </span>
  );
}

/** AI output must never read as a confirmed diagnosis. */
export function AiDisclaimer() {
  const t = useT();
  return (
    <p className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
      <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      {t(
        "doctor.aiDisclaimer",
        "AI screening flags are decision-support only. They are not a diagnosis. The clinical decision is yours."
      )}
    </p>
  );
}

export function DemoBanner({ message }) {
  const t = useT();
  return (
    <div role="note" className="mb-4 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
      <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{message || t("common.demoData", "Demonstration data - not verified real-world results.")}</span>
    </div>
  );
}
