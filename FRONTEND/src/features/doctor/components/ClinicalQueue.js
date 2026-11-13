"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { useT, DOCTOR_ROLES } from "../adapters";
import { doctorApi } from "../api/doctorApi";
import { errorMessage, useAsync } from "../hooks/useAsync";
import RoleGate from "./RoleGate";
import { AiDisclaimer, Card, EmptyState, ErrorState, fmtDateTime, inputCls, LoadingState, PageHeader, PriorityBadge, StatusBadge } from "./ui";

const STATUSES = ["", "pending", "in_review", "reviewed", "follow_up"];
const PRIORITIES = ["", "urgent", "high", "routine"];

function Body() {
  const t = useT();
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQ(q.trim()), 300);
    return () => clearTimeout(id);
  }, [q]);

  const { data, error, loading, reload } = useAsync(
    () => doctorApi.listCases({ status, priority, q: debouncedQ }),
    [status, priority, debouncedQ]
  );
  const cases = Array.isArray(data) ? data : data?.items || [];
  const filtered = Boolean(status || priority || debouncedQ);

  return (
    <div className="space-y-4">
      <Card>
        <form role="search" onSubmit={(e) => e.preventDefault()} className="grid gap-3 sm:grid-cols-[1fr_180px_180px]">
          <label className="relative block">
            <span className="sr-only">{t("doctor.queue.search", "Search cases")}</span>
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" aria-hidden="true" />
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("doctor.queue.search", "Search cases")} className={`${inputCls} pl-9`} />
          </label>
          <label className="block">
            <span className="sr-only">{t("doctor.filter.status", "Status")}</span>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s ? t(`doctor.status.${s}`, s.replace(/_/g, " ")) : t("doctor.filter.allStatuses", "All statuses")}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="sr-only">{t("doctor.filter.priority", "Priority")}</span>
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className={inputCls}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{p ? t(`doctor.priority.${p}`, p) : t("doctor.filter.allPriorities", "All priorities")}</option>
              ))}
            </select>
          </label>
        </form>
      </Card>

      <AiDisclaimer />

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={errorMessage(error)} onRetry={reload} />
      ) : cases.length === 0 ? (
        <EmptyState
          title={filtered ? t("doctor.queue.noMatch", "No cases match these filters") : t("doctor.queue.empty", "No cases waiting for review")}
          hint={filtered ? t("doctor.queue.noMatchHint", "Clear a filter to see more cases.") : undefined}
        />
      ) : (
        <ul className="space-y-2" aria-label={t("doctor.reviewQueue", "Review queue")}>
          {cases.map((c) => (
            <li key={c.id}>
              <Link
                href={`/doctor/cases/${c.id}`}
                className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-teal-600 hover:bg-teal-50/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-700 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium text-slate-900">{c.patientName || c.patientRef || c.id}</span>
                  <span className="block text-xs text-slate-500">
                    {[c.age ? `${c.age} y` : null, c.source, fmtDateTime(c.submittedAt)].filter(Boolean).join(" · ")}
                  </span>
                  {c.aiFlag && <span className="mt-1 block text-xs text-amber-800">{t("doctor.aiFlagged", "AI-flagged for review")}</span>}
                </span>
                <span className="flex shrink-0 gap-2"><PriorityBadge priority={c.priority} /><StatusBadge status={c.status} /></span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function ClinicalQueue() {
  const t = useT();
  return (
    <RoleGate roles={DOCTOR_ROLES}>
      <PageHeader title={t("doctor.queue.title", "Clinical queue")} backHref="/doctor" backLabel={t("doctor.dashboard.title", "Doctor dashboard")} />
      <Body />
    </RoleGate>
  );
}
