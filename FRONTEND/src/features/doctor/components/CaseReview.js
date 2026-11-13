"use client";
import Link from "next/link";
import { useState } from "react";
import { CalendarPlus, X } from "lucide-react";
import { useT, DOCTOR_ROLES } from "../adapters";
import { doctorApi } from "../api/doctorApi";
import { errorMessage, useAsync } from "../hooks/useAsync";
import DecisionForm from "./DecisionForm";
import RoleGate from "./RoleGate";
import { AiDisclaimer, btnSecondary, Card, ErrorState, fmtDateTime, LoadingState, PageHeader, PriorityBadge, StatusBadge } from "./ui";

function Field({ label, children }) {
  if (children === undefined || children === null || children === "") return null;
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-900">{children}</dd>
    </div>
  );
}

function ImageViewer({ image, onClose, label }) {
  if (!image) return null;
  return (
    <div role="dialog" aria-modal="true" aria-label={image.label || label} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onKeyDown={(e) => e.key === "Escape" && onClose()}>
      <button type="button" autoFocus onClick={onClose} aria-label="Close" className="absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
        <X className="h-5 w-5" aria-hidden="true" />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image.url} alt={image.label || label} className="max-h-full max-w-full rounded-lg object-contain" />
    </div>
  );
}

function Body({ caseId }) {
  const t = useT();
  const { data: c, error, loading, reload } = useAsync(() => doctorApi.getCase(caseId), [caseId]);
  const [viewing, setViewing] = useState(null);
  const [liveStatus, setLiveStatus] = useState(null);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={errorMessage(error)} onRetry={reload} />;
  if (!c) return <ErrorState message={t("doctor.case.notFound", "Case not found.")} />;

  const p = c.patient || {};
  const s = c.screening || {};
  const imgLabel = t("doctor.case.image", "Screening image");

  return (
    <>
      <PageHeader
        title={p.name || c.patientRef || `${t("doctor.case.title", "Case")} ${c.id}`}
        subtitle={`${t("doctor.case.id", "Case ID")}: ${c.id}`}
        backHref="/doctor/queue"
        backLabel={t("doctor.queue.title", "Clinical queue")}
        actions={
          <>
            <PriorityBadge priority={c.priority} />
            <StatusBadge status={liveStatus || c.status} />
            <Link href={`/doctor/appointments/new?caseId=${encodeURIComponent(c.id)}${p.id ? `&patientId=${encodeURIComponent(p.id)}` : ""}`} className={btnSecondary}>
              <CalendarPlus className="h-4 w-4" aria-hidden="true" />
              {t("doctor.newAppointment", "Schedule consultation")}
            </Link>
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-5">
          <Card title={t("doctor.case.patient", "Patient")}>
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Field label={t("doctor.case.age", "Age")}>{p.age}</Field>
              <Field label={t("doctor.case.sex", "Sex")}>{p.sex}</Field>
              <Field label={t("doctor.case.contact", "Contact")}>{p.contact}</Field>
              <Field label={t("doctor.case.submitted", "Submitted")}>{c.submittedAt && fmtDateTime(c.submittedAt)}</Field>
              <Field label={t("doctor.case.source", "Source")}>{c.source}</Field>
            </dl>
          </Card>

          <Card title={t("doctor.case.images", "Screening images")}>
            {(c.images || []).length === 0 ? (
              <p className="text-sm text-slate-600">{t("doctor.case.noImages", "No images were submitted with this case.")}</p>
            ) : (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {c.images.map((img, i) => (
                  <li key={img.id || i}>
                    <button type="button" onClick={() => setViewing(img)} className="group block w-full overflow-hidden rounded-lg border border-slate-200 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-700">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt={img.label || `${imgLabel} ${i + 1}`} loading="lazy" className="aspect-square w-full object-cover transition-transform motion-safe:group-hover:scale-105" />
                      <span className="block truncate px-2 py-1 text-xs text-slate-600">{img.label || `${imgLabel} ${i + 1}`}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title={t("doctor.case.clinical", "Clinical information")}>
            <dl className="space-y-4">
              <Field label={t("doctor.case.symptoms", "Reported symptoms")}>{c.clinical?.symptoms}</Field>
              <Field label={t("doctor.case.riskFactors", "Risk factors")}>{Array.isArray(c.clinical?.riskFactors) ? c.clinical.riskFactors.join(", ") : c.clinical?.riskFactors}</Field>
              <Field label={t("doctor.case.notes", "Notes")}>{c.clinical?.notes}</Field>
            </dl>
          </Card>

          <Card title={t("doctor.case.history", "Case history")}>
            {(c.history || []).length === 0 ? (
              <p className="text-sm text-slate-600">{t("doctor.case.noHistory", "No earlier activity on this case.")}</p>
            ) : (
              <ol className="space-y-3 border-l-2 border-slate-200 pl-4">
                {c.history.map((h, i) => (
                  <li key={i}>
                    <p className="text-sm text-slate-900">{h.event}</p>
                    <p className="text-xs text-slate-500">{fmtDateTime(h.date)}</p>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>

        <div className="space-y-5 lg:sticky lg:top-4 lg:self-start">
          <Card title={t("doctor.case.ai", "AI screening result")}>
            <div className="space-y-3">
              <dl className="space-y-3">
                <Field label={t("doctor.case.aiFlag", "Screening flag")}>{s.aiFlag ?? c.aiFlag ? t("doctor.aiFlagged", "AI-flagged for review") : t("doctor.aiNotFlagged", "Not flagged")}</Field>
                <Field label={t("doctor.case.aiNote", "Model note")}>{s.aiNote}</Field>
                {typeof s.confidence === "number" && <Field label={t("doctor.case.confidence", "Model confidence")}>{Math.round(s.confidence * 100)}%</Field>}
              </dl>
              <AiDisclaimer />
            </div>
          </Card>

          <DecisionForm caseId={c.id} options={c.decisionOptions} existing={c.decision} onSubmitted={(res) => res?.status && setLiveStatus(res.status)} />
        </div>
      </div>

      <ImageViewer image={viewing} onClose={() => setViewing(null)} label={imgLabel} />
    </>
  );
}

export default function CaseReview({ caseId }) {
  return (
    <RoleGate roles={DOCTOR_ROLES}>
      <Body caseId={caseId} />
    </RoleGate>
  );
}
