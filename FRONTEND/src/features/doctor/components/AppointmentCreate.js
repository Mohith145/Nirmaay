"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Check, Copy, Loader2, Video } from "lucide-react";
import { useT, DOCTOR_ROLES } from "../adapters";
import { doctorApi } from "../api/doctorApi";
import { errorMessage, useAsync } from "../hooks/useAsync";
import RoleGate from "./RoleGate";
import { btnPrimary, btnSecondary, Card, ErrorState, fmtDateTime, inputCls, LoadingState, PageHeader } from "./ui";

/**
 * DOCTOR-ONLY. Creating an appointment is what creates the consultation (and
 * its Consultation ID). Patients have no equivalent screen anywhere.
 */
function Body() {
  const t = useT();
  const params = useSearchParams();
  const caseId = params.get("caseId") || "";
  const presetPatient = params.get("patientId") || "";

  const patients = useAsync(() => doctorApi.listPatients(), []);
  const [form, setForm] = useState({ patientId: presetPatient, date: "", time: "", duration: "20", reason: "" });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState("");
  const [created, setCreated] = useState(null);
  const [copied, setCopied] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const list = Array.isArray(patients.data) ? patients.data : patients.data?.items || [];

  function validate() {
    const e = {};
    if (!form.patientId) e.patientId = t("doctor.err.patient", "Choose a patient.");
    if (!form.date) e.date = t("doctor.err.date", "Choose a date.");
    if (!form.time) e.time = t("doctor.err.time", "Choose a time.");
    if (form.date && form.time && new Date(`${form.date}T${form.time}`) < new Date(Date.now() - 60000))
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

  const E = ({ k }) => (errors[k] ? <p id={`${k}-err`} className="mt-1 text-sm text-red-700">{errors[k]}</p> : null);
  const d = (k) => (errors[k] ? `${k}-err` : undefined);

  return (
    <Card>
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <div>
          <label htmlFor="patientId" className="mb-1 block text-sm font-medium text-slate-800">{t("doctor.appointment.patient", "Patient")} <span aria-hidden="true">*</span></label>
          <select id="patientId" value={form.patientId} onChange={set("patientId")} className={inputCls} aria-invalid={Boolean(errors.patientId)} aria-describedby={d("patientId")}>
            <option value="">{t("doctor.decision.choose", "Select...")}</option>
            {list.map((p) => <option key={p.id} value={p.id}>{p.name || p.id}</option>)}
          </select>
          <E k="patientId" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="date" className="mb-1 block text-sm font-medium text-slate-800">{t("doctor.appointment.date", "Date")} <span aria-hidden="true">*</span></label>
            <input id="date" type="date" value={form.date} onChange={set("date")} className={inputCls} aria-invalid={Boolean(errors.date)} aria-describedby={d("date")} />
            <E k="date" />
          </div>
          <div>
            <label htmlFor="time" className="mb-1 block text-sm font-medium text-slate-800">{t("doctor.appointment.time", "Time")} <span aria-hidden="true">*</span></label>
            <input id="time" type="time" value={form.time} onChange={set("time")} className={inputCls} aria-invalid={Boolean(errors.time)} aria-describedby={d("time")} />
            <E k="time" />
          </div>
          <div>
            <label htmlFor="duration" className="mb-1 block text-sm font-medium text-slate-800">{t("doctor.appointment.duration", "Duration (min)")}</label>
            <select id="duration" value={form.duration} onChange={set("duration")} className={inputCls}>
              {["10", "15", "20", "30", "45", "60"].map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="reason" className="mb-1 block text-sm font-medium text-slate-800">{t("doctor.appointment.reason", "Reason / notes (optional)")}</label>
          <textarea id="reason" rows={3} value={form.reason} onChange={set("reason")} className={`${inputCls} py-2`} />
        </div>
        {caseId && <p className="text-xs text-slate-500">{t("doctor.case.id", "Case ID")}: {caseId}</p>}
        {serverError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-900">{serverError}</p>}
        <button type="submit" disabled={busy} className={btnPrimary}>
          {busy && <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" />}
          {t("doctor.appointment.create", "Schedule consultation")}
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
