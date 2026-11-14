"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Check, ChevronLeft, ChevronRight, Clock3, Copy, Loader2, Stethoscope, Video } from "lucide-react";
import { useT, DOCTOR_ROLES } from "../adapters";
import { doctorApi } from "../api/doctorApi";
import { errorMessage, useAsync } from "../hooks/useAsync";
import RoleGate from "./RoleGate";
import { btnPrimary, btnSecondary, Card, ErrorState, fmtDateTime, inputCls, LoadingState, PageHeader } from "./ui";

const OPEN_MINUTES = 9 * 60;
const CLOSE_MINUTES = 17 * 60;

function localDateValue(date = new Date()) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function formatTimeValue(minutes) {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

function formatClock(minutes) {
  return new Date(2000, 0, 1, Math.floor(minutes / 60), minutes % 60)
    .toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function getTimeSlots(date, duration) {
  if (!date || !Number.isFinite(duration) || duration <= 0) return [];
  if (date < localDateValue()) return [];
  const latestStart = CLOSE_MINUTES - duration;
  const slots = [];
  for (let start = OPEN_MINUTES; start <= latestStart; start += duration) {
    const value = formatTimeValue(start);
    if (date === localDateValue() && new Date(`${date}T${value}`) <= new Date()) continue;
    slots.push({ value, label: `${formatClock(start)} – ${formatClock(start + duration)}` });
  }
  return slots;
}

function calendarMonthDays(month) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstWeekday = new Date(year, monthIndex, 1).getDay();
  const dayCount = new Date(year, monthIndex + 1, 0).getDate();
  return [...Array(firstWeekday).fill(null), ...Array.from({ length: dayCount }, (_, index) => new Date(year, monthIndex, index + 1))];
}

function FieldError({ errors, field }) {
  return errors[field] ? <p id={`${field}-err`} className="mt-1 text-sm text-red-700">{errors[field]}</p> : null;
}

/**
 * DOCTOR-ONLY. Creating an appointment is what creates the consultation (and
 * its Consultation ID). Patients have no equivalent screen anywhere.
 */
function Body() {
  const t = useT();
  const params = useSearchParams();
  const caseId = params.get("caseId") || "";

  const patients = useAsync(() => doctorApi.listPatients(), []);
  const [form, setForm] = useState({ patientId: caseId || "", date: "", time: "", duration: "20", reason: "" });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState("");
  const [created, setCreated] = useState(null);
  const [copied, setCopied] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const set = (k) => (e) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, [k]: value }));
    setErrors((current) => ({ ...current, [k]: undefined }));
  };
  const list = Array.isArray(patients.data) ? patients.data : patients.data?.items || [];
  const timeSlots = useMemo(() => getTimeSlots(form.date, Number(form.duration)), [form.date, form.duration]);
  const calendarDays = useMemo(() => calendarMonthDays(calendarMonth), [calendarMonth]);
  const monthLabel = calendarMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  useEffect(() => {
    if (form.time && !timeSlots.some((slot) => slot.value === form.time)) {
      setForm((current) => ({ ...current, time: "" }));
    }
  }, [form.time, timeSlots]);

  function validate() {
    const e = {};
    if (!form.patientId) e.patientId = t("doctor.err.patient", "Choose a patient.");
    if (!form.date) e.date = t("doctor.err.date", "Choose a date.");
    else if (form.date < localDateValue()) e.date = t("doctor.err.datePast", "Choose today or a future date.");
    if (!form.time) e.time = timeSlots.length
      ? t("doctor.err.time", "Choose an available time.")
      : t("doctor.err.noTimes", "No start times fit this duration on the selected date.");
    else if (!timeSlots.some((slot) => slot.value === form.time))
      e.time = t("doctor.err.past", "Choose a valid future time slot.");
    else if (new Date(`${form.date}T${form.time}`) <= new Date())
      e.time = t("doctor.err.past", "Choose a time in the future.");
    return e;
  }

  async function onSubmit(ev) {
    ev.preventDefault();
    setServerError("");
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      const res = await doctorApi.createAppointment({
        patientId: form.patientId,
        caseId: caseId || undefined,
        scheduledAt: new Date(`${form.date}T${form.time}`).toISOString(),
        durationMinutes: Number(form.duration) || 20,
        reason: form.reason.trim() || undefined,
      });
      if (!res?.consultationId) throw new Error(t("doctor.err.noConsultationId", "The server did not return a Consultation ID. The appointment was not confirmed."));
      setCreated(res);
    } catch (err) {
      setServerError(errorMessage(err, t("doctor.err.appointment", "The appointment could not be created. Please try again.")));
    } finally {
      setBusy(false);
    }
  }

  async function copyId() {
    try {
      await navigator.clipboard.writeText(created.consultationId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable; the ID stays visible for manual copy */
    }
  }

  if (created) {
    return (
      <Card title={t("doctor.appointment.created", "Consultation scheduled")}>
        <div role="status" className="space-y-4">
          <p className="text-sm text-slate-700">{fmtDateTime(created.scheduledAt)}</p>
          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{t("doctor.appointment.consultationId", "Consultation ID")}</p>
            <p className="mt-1 break-all font-mono text-lg font-semibold text-slate-900">{created.consultationId}</p>
            <button type="button" onClick={copyId} className={`${btnSecondary} mt-3`}>
              {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
              {copied ? t("common.copied", "Copied") : t("common.copy", "Copy")}
            </button>
          </div>
          <p className="text-sm text-slate-600">{t("doctor.appointment.shareHint", "The patient can join using this ID once you start the consultation. They cannot start it.")}</p>
          <div className="flex flex-wrap gap-2">
            <Link href={`/consultation/${encodeURIComponent(created.consultationId)}`} className={btnPrimary}>
              <Video className="h-4 w-4" aria-hidden="true" />{t("doctor.appointment.goToRoom", "Go to consultation")}
            </Link>
            <Link href="/doctor" className={btnSecondary}>{t("doctor.dashboard.title", "Doctor dashboard")}</Link>
          </div>
        </div>
      </Card>
    );
  }

  if (patients.loading) return <LoadingState />;
  if (patients.error) return <ErrorState message={errorMessage(patients.error)} onRetry={patients.reload} />;

  const d = (k) => (errors[k] ? `${k}-err` : undefined);

  return (
    <Card className="border-teal-100 shadow-md">
      <form onSubmit={onSubmit} noValidate className="space-y-6">
        <div className="rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50 via-white to-cyan-50 p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-700 text-white shadow-sm">
              <Stethoscope className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{t("doctor.appointment.formTitle", "Plan a patient consultation")}</h2>
              <p className="mt-1 text-sm text-slate-600">{t("doctor.appointment.hours", "Choose a date and a start time between 9:00 AM and 5:00 PM. Available times fit the selected appointment duration.")}</p>
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="patientId" className="mb-2 block text-sm font-semibold text-slate-800">{t("doctor.appointment.patient", "Patient")} <span className="text-red-700" aria-hidden="true">*</span></label>
          <select id="patientId" value={form.patientId} onChange={set("patientId")} className={`${inputCls} min-h-[52px] rounded-xl text-base shadow-sm`} aria-invalid={Boolean(errors.patientId)} aria-describedby={d("patientId")}>
            <option value="">{t("doctor.decision.choose", "Select...")}</option>
            {list.map((p) => <option key={p.id} value={p.id}>{p.name || p.id}</option>)}
          </select>
          <FieldError errors={errors} field="patientId" />
        </div>
        <div className="grid gap-6 lg:grid-cols-[minmax(300px,0.85fr)_minmax(0,1.15fr)]">
          <section aria-labelledby="date-heading" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 id="date-heading" className="text-sm font-semibold text-slate-900">{t("doctor.appointment.date", "Appointment date")} <span className="text-red-700" aria-hidden="true">*</span></h3>
                <p className="mt-1 text-sm text-slate-500">{form.date ? new Date(`${form.date}T00:00:00`).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" }) : t("doctor.appointment.pickDate", "Choose a day")}</p>
              </div>
              <CalendarDays className="h-5 w-5 shrink-0 text-brand-600" aria-hidden="true" />
            </div>
            <div className="mb-3 flex items-center justify-between">
              <p className="font-semibold text-slate-900" aria-live="polite">{monthLabel}</p>
              <div className="flex gap-1">
                <button type="button" aria-label={t("calendar.previousMonth", "Previous month")} disabled={calendarMonth.getFullYear() === new Date().getFullYear() && calendarMonth.getMonth() === new Date().getMonth()} onClick={() => setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-35">
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                </button>
                <button type="button" aria-label={t("calendar.nextMonth", "Next month")} onClick={() => setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100">
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-500" aria-hidden="true">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => <span key={day} className="py-2">{day}</span>)}
            </div>
            <div className="grid grid-cols-7 gap-1" role="group" aria-label={t("doctor.appointment.chooseDate", "Choose appointment date")}>
              {calendarDays.map((day, index) => {
                if (!day) return <span key={`blank-${index}`} aria-hidden="true" />;
                const value = localDateValue(day);
                const selected = form.date === value;
                const disabled = value < localDateValue();
                const today = value === localDateValue();
                return <button key={value} type="button" disabled={disabled} aria-pressed={selected} aria-label={day.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })} onClick={() => { setForm((current) => ({ ...current, date: value, time: "" })); setErrors((current) => ({ ...current, date: undefined, time: undefined })); }} className={`aspect-square min-h-9 rounded-full text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ${selected ? "bg-brand-600 font-semibold text-white shadow-sm" : today ? "border border-brand-600 font-semibold text-brand-700" : "text-slate-700 hover:bg-teal-50"} disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent`}>
                  {day.getDate()}
                </button>;
              })}
            </div>
            <FieldError errors={errors} field="date" />
          </section>

          <section className="space-y-5">
            <div>
              <label htmlFor="duration" className="mb-2 block text-sm font-semibold text-slate-800">{t("doctor.appointment.duration", "Appointment duration")}</label>
              <select id="duration" value={form.duration} onChange={set("duration")} className={`${inputCls} min-h-[48px] rounded-xl bg-white text-base shadow-sm`}>
                {[10, 15, 20, 30, 45, 60].map((m) => <option key={m} value={m}>{m} {t("doctor.appointment.minutes", "minutes")}</option>)}
              </select>
            </div>

            <div>
              <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">{t("doctor.appointment.time", "Available start time")} <span className="text-red-700" aria-hidden="true">*</span></h3>
                  <p className="mt-1 text-xs text-slate-500">{t("doctor.appointment.slotHint", "Each slot includes the full selected duration, within 9:00 AM–5:00 PM.")}</p>
                </div>
                <Clock3 className="h-5 w-5 text-brand-600" aria-hidden="true" />
              </div>
              {!form.date ? <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">{t("doctor.appointment.chooseDateFirst", "Choose a date to see available times.")}</p> : timeSlots.length === 0 ? <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{t("doctor.appointment.noSlots", "No times are available for this date and duration during working hours.")}</p> : <div role="group" aria-label={t("doctor.appointment.chooseTime", "Choose an available time")} aria-describedby={d("time")} className="grid max-h-[340px] grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
                {timeSlots.map((slot) => {
                  const selected = form.time === slot.value;
                  return <button key={slot.value} type="button" aria-pressed={selected} onClick={() => { setForm((current) => ({ ...current, time: slot.value })); setErrors((current) => ({ ...current, time: undefined })); }} className={`min-h-[62px] rounded-xl border px-2 py-2 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ${selected ? "border-brand-600 bg-brand-600 text-white shadow-sm" : "border-slate-200 bg-white text-slate-800 hover:border-brand-600 hover:bg-brand-50"}`}>
                    <span className="block text-sm font-semibold">{formatClock(Number(slot.value.slice(0, 2)) * 60 + Number(slot.value.slice(3)))}</span>
                    <span className={`mt-0.5 block text-xs ${selected ? "text-white/85" : "text-slate-500"}`}>{t("doctor.appointment.endsAt", "ends")} {formatClock(Number(slot.value.slice(0, 2)) * 60 + Number(slot.value.slice(3)) + Number(form.duration))}</span>
                  </button>;
                })}
              </div>}
              <FieldError errors={errors} field="time" />
            </div>
          </section>
        </div>
        <div>
          <label htmlFor="reason" className="mb-1 block text-sm font-medium text-slate-800">{t("doctor.appointment.reason", "Reason / notes (optional)")}</label>
          <textarea id="reason" rows={3} value={form.reason} onChange={set("reason")} className={`${inputCls} py-2`} />
        </div>
        {caseId && <p className="text-xs text-slate-500">{t("doctor.case.id", "Case ID")}: {caseId}</p>}
        {serverError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-900">{serverError}</p>}
        {form.date && form.time && <p className="rounded-xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm font-medium text-teal-900" aria-live="polite">
          {new Date(`${form.date}T00:00:00`).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })} · {timeSlots.find((slot) => slot.value === form.time)?.label} · {form.duration} {t("doctor.appointment.minutes", "minutes")}
        </p>}
        <button type="submit" disabled={busy} className={`${btnPrimary} min-h-[52px] w-full rounded-xl text-base shadow-md shadow-teal-900/15 sm:w-auto sm:px-7`}>
          {busy && <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" />}
          {!busy && <CalendarDays className="h-5 w-5" aria-hidden="true" />}
          {busy ? t("doctor.appointment.scheduling", "Scheduling...") : t("doctor.appointment.create", "Schedule consultation")}
        </button>
      </form>
    </Card>
  );
}

export default function AppointmentCreate() {
  const t = useT();
  return (
    <RoleGate roles={DOCTOR_ROLES}>
      <PageHeader title={t("doctor.newAppointment", "Schedule consultation")} subtitle={t("doctor.appointment.subtitle", "Only doctors can schedule and start consultations.")} backHref="/doctor" backLabel={t("doctor.dashboard.title", "Doctor dashboard")} />
      <Body />
    </RoleGate>
  );
}
