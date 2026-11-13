"use client";
import Link from "next/link";
import { BarChart3, CalendarPlus, ClipboardList, Video } from "lucide-react";
import { useT, DOCTOR_ROLES } from "../adapters";
import { doctorApi } from "../api/doctorApi";
import { errorMessage, useAsync } from "../hooks/useAsync";
import RoleGate from "./RoleGate";
import {
  btnPrimary, btnSecondary, Card, EmptyState, ErrorState, fmtDateTime, LoadingState, PageHeader, PriorityBadge, StatusBadge,
} from "./ui";

function Stat({ label, value, tone }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${tone || "text-slate-900"}`}>{value}</p>
    </div>
  );
}

function Body() {
  const t = useT();
  const { data, error, loading, reload } = useAsync(() => doctorApi.dashboard(), []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={errorMessage(error)} onRetry={reload} />;

  const stats = data?.stats || {};
  const queue = data?.queuePreview || [];
  const appts = data?.upcomingAppointments || [];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.pendingReview !== undefined && <Stat label={t("doctor.stat.pending", "Pending review")} value={stats.pendingReview} tone="text-amber-700" />}
        {stats.urgent !== undefined && <Stat label={t("doctor.stat.urgent", "Urgent")} value={stats.urgent} tone="text-red-700" />}
        {stats.todayAppointments !== undefined && <Stat label={t("doctor.stat.today", "Consultations today")} value={stats.todayAppointments} />}
        {stats.reviewedToday !== undefined && <Stat label={t("doctor.stat.reviewed", "Reviewed today")} value={stats.reviewedToday} tone="text-emerald-700" />}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card
          title={t("doctor.reviewQueue", "Review queue")}
          action={<Link href="/doctor/queue" className="text-sm font-medium text-teal-800 hover:underline">{t("doctor.viewAll", "View all")}</Link>}
        >
          {queue.length === 0 ? (
            <EmptyState title={t("doctor.queue.empty", "No cases waiting for review")} />
          ) : (
            <ul className="divide-y divide-slate-100">
              {queue.map((c) => (
                <li key={c.id}>
                  <Link href={`/doctor/cases/${c.id}`} className="flex min-h-[44px] items-center justify-between gap-3 py-3 hover:bg-slate-50">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-slate-900">{c.patientName || c.patientRef || c.id}</span>
                      <span className="block text-xs text-slate-500">{fmtDateTime(c.submittedAt)}</span>
                    </span>
                    <span className="flex shrink-0 gap-2"><PriorityBadge priority={c.priority} /><StatusBadge status={c.status} /></span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title={t("doctor.upcoming", "Upcoming consultations")}>
          {appts.length === 0 ? (
            <EmptyState
              title={t("doctor.appointments.empty", "No consultations scheduled")}
              action={<Link href="/doctor/appointments/new" className={btnPrimary}>{t("doctor.newAppointment", "Schedule consultation")}</Link>}
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {appts.map((a) => (
                <li key={a.id || a.consultationId} className="flex min-h-[44px] items-center justify-between gap-3 py-3">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-slate-900">{a.patientName || a.patientRef}</span>
                    <span className="block text-xs text-slate-500">{fmtDateTime(a.scheduledAt)}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <StatusBadge status={a.status} />
                    <Link href={`/consultation/${a.consultationId}`} className={btnSecondary}>
                      <Video className="h-4 w-4" aria-hidden="true" />
                      {t("doctor.open", "Open")}
                    </Link>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card title={t("doctor.quickActions", "Quick actions")}>
        <div className="flex flex-wrap gap-2">
          <Link href="/doctor/queue" className={btnPrimary}><ClipboardList className="h-4 w-4" aria-hidden="true" />{t("doctor.openQueue", "Open clinical queue")}</Link>
          <Link href="/doctor/appointments/new" className={btnSecondary}><CalendarPlus className="h-4 w-4" aria-hidden="true" />{t("doctor.newAppointment", "Schedule consultation")}</Link>
          <Link href="/insights" className={btnSecondary}><BarChart3 className="h-4 w-4" aria-hidden="true" />{t("insights.title", "Insights")}</Link>
        </div>
      </Card>
    </div>
  );
}

export default function DoctorDashboard() {
  const t = useT();
  return (
    <RoleGate roles={DOCTOR_ROLES}>
      <PageHeader title={t("doctor.dashboard.title", "Doctor dashboard")} subtitle={t("doctor.dashboard.subtitle", "Cases awaiting review and upcoming consultations")} />
      <Body />
    </RoleGate>
  );
}
