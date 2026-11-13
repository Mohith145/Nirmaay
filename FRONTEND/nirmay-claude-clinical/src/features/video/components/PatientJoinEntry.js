"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useT } from "../../doctor/adapters";
import { btnPrimary, Card, inputCls } from "../../doctor/components/ui";

/**
 * For Codex's patient module. JOIN-ONLY: takes an existing Consultation ID and
 * routes to the shared room screen. It never creates a consultation.
 * Usage: import PatientJoinEntry from "@/features/video/components/PatientJoinEntry";
 */
export default function PatientJoinEntry() {
  const t = useT();
  const router = useRouter();
  const [id, setId] = useState("");
  const [err, setErr] = useState("");

  function onSubmit(e) {
    e.preventDefault();
    const v = id.trim();
    if (!v) return setErr(t("video.err.idRequired", "Enter the Consultation ID your doctor gave you."));
    router.push(`/consultation/${encodeURIComponent(v)}`);
  }
  return (
    <Card title={t("video.joinTitle", "Join a consultation")}>
      <form onSubmit={onSubmit} noValidate className="space-y-3">
        <div>
          <label htmlFor="cid" className="mb-1 block text-sm font-medium text-slate-800">{t("doctor.appointment.consultationId", "Consultation ID")}</label>
          <input id="cid" value={id} onChange={(e) => { setId(e.target.value); setErr(""); }} className={inputCls} autoComplete="off" aria-invalid={Boolean(err)} aria-describedby={err ? "cid-err" : undefined} />
          {err && <p id="cid-err" className="mt-1 text-sm text-red-700">{err}</p>}
        </div>
        <p className="text-xs text-slate-600">{t("video.joinHint", "Only your doctor can start a consultation. You will join once it is live.")}</p>
        <button type="submit" className={btnPrimary}>{t("video.join", "Join consultation")}</button>
      </form>
    </Card>
  );
}
