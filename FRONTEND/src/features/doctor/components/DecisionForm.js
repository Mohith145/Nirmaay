"use client";
import { useRef, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useT } from "../adapters";
import { doctorApi } from "../api/doctorApi";
import { FALLBACK_DECISION_OPTIONS } from "../decisionConfig";
import { errorMessage } from "../hooks/useAsync";
import { btnPrimary, Card, inputCls } from "./ui";

export default function DecisionForm({ caseId, options, existing, onSubmitted }) {
  const t = useT();
  const opts = options?.length ? options : FALLBACK_DECISION_OPTIONS;
  const [form, setForm] = useState({
    decision: existing?.decision || "",
    notes: existing?.notes || "",
    followUp: Boolean(existing?.followUpDate),
    followUpDate: existing?.followUpDate || "",
    patientMessage: existing?.patientMessage || "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [done, setDone] = useState(false);
  const formRef = useRef(null);

  const set = (k) => (e) => {
    const v = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [k]: v }));
    setDone(false);
  };

  function validate() {
    const e = {};
    if (!form.decision) e.decision = t("doctor.err.decision", "Choose a decision.");
    if (form.notes.trim().length < 10) e.notes = t("doctor.err.notes", "Add clinical notes (at least 10 characters).");
    if (form.followUp && !form.followUpDate) e.followUpDate = t("doctor.err.followUpDate", "Choose a follow-up date.");
    return e;
  }

  async function onSubmit(ev) {
    ev.preventDefault();
    setServerError("");
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      formRef.current?.querySelector("[aria-invalid='true']")?.focus();
      return;
    }
    setSubmitting(true);
    try {
      // Entered values stay in state on failure so nothing is lost.
      const res = await doctorApi.submitDecision(caseId, {
        decision: form.decision,
        notes: form.notes.trim(),
        followUpDate: form.followUp ? form.followUpDate : null,
        patientMessage: form.patientMessage.trim() || null,
      });
      setDone(true);
      onSubmitted?.(res);
    } catch (err) {
      setServerError(errorMessage(err, t("doctor.err.submit", "The decision could not be submitted. Your entries are kept - please try again.")));
    } finally {
      setSubmitting(false);
    }
  }

  const err = (k) => (errors[k] ? `${k}-err` : undefined);
  return (
    <Card title={existing ? t("doctor.decision.update", "Update clinical decision") : t("doctor.decision.title", "Clinical decision")}>
      <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-4">
        <div>
          <label htmlFor="decision" className="mb-1 block text-sm font-medium text-slate-800">{t("doctor.decision.label", "Decision")} <span aria-hidden="true">*</span></label>
          <select id="decision" value={form.decision} onChange={set("decision")} className={inputCls} aria-required="true" aria-invalid={Boolean(errors.decision)} aria-describedby={err("decision")}>
            <option value="">{t("doctor.decision.choose", "Select...")}</option>
            {opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          {errors.decision && <p id="decision-err" className="mt-1 text-sm text-red-700">{errors.decision}</p>}
        </div>

        <div>
          <label htmlFor="notes" className="mb-1 block text-sm font-medium text-slate-800">{t("doctor.decision.notes", "Clinical notes")} <span aria-hidden="true">*</span></label>
          <textarea id="notes" rows={5} value={form.notes} onChange={set("notes")} className={`${inputCls} py-2`} aria-required="true" aria-invalid={Boolean(errors.notes)} aria-describedby={err("notes")} />
          {errors.notes && <p id="notes-err" className="mt-1 text-sm text-red-700">{errors.notes}</p>}
        </div>

        <div>
          <label className="flex min-h-[44px] items-center gap-3 text-sm text-slate-800">
            <input type="checkbox" checked={form.followUp} onChange={set("followUp")} className="h-5 w-5 rounded border-slate-400 text-teal-700" />
            {t("doctor.decision.followUp", "Schedule a follow-up")}
          </label>
          {form.followUp && (
            <div className="mt-1">
              <label htmlFor="followUpDate" className="mb-1 block text-sm font-medium text-slate-800">{t("doctor.decision.followUpDate", "Follow-up date")}</label>
              <input id="followUpDate" type="date" value={form.followUpDate} onChange={set("followUpDate")} className={inputCls} aria-invalid={Boolean(errors.followUpDate)} aria-describedby={err("followUpDate")} />
              {errors.followUpDate && <p id="followUpDate-err" className="mt-1 text-sm text-red-700">{errors.followUpDate}</p>}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="patientMessage" className="mb-1 block text-sm font-medium text-slate-800">{t("doctor.decision.patientMessage", "Message for the patient (optional)")}</label>
          <textarea id="patientMessage" rows={3} value={form.patientMessage} onChange={set("patientMessage")} className={`${inputCls} py-2`} />
        </div>

        {serverError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-900">{serverError}</p>}
        {done && (
          <p role="status" className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            {t("doctor.decision.saved", "Decision submitted.")}
          </p>
        )}

        <button type="submit" disabled={submitting} className={`${btnPrimary} w-full sm:w-auto`}>
          {submitting && <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" />}
          {t("doctor.decision.submit", "Submit decision")}
        </button>
      </form>
    </Card>
  );
}
