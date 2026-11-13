"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FileText,
  AlertCircle,
  CheckCircle2,
  Printer,
  Calendar,
  HelpCircle,
  User,
  ShieldCheck,
  Stethoscope,
  ArrowRight,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { UrgencyBadge } from "@/components/ui/UrgencyBadge";
import { ReasonsList } from "@/components/ui/ReasonsList";
import { DisclaimerBanner } from "@/components/ui/DisclaimerBanner";
import { EmergencyBanner } from "@/components/ui/EmergencyBanner";
import { Spinner } from "@/components/ui/Spinner";
import { createCase, getCaseHandoff } from "@/lib/api/cases";
import { useToast } from "@/context/ToastContext";

function ResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const intakeId = searchParams.get("intake_id");
  const symptomId = searchParams.get("symptom_id");
  const photoId = searchParams.get("photo_id");
  const existingCaseId = searchParams.get("case_id");

  const { addToast } = useToast();

  const [caseBundle, setCaseBundle] = useState(null);
  const [caseId, setCaseId] = useState(existingCaseId || null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function initCase() {
      setIsLoading(true);
      setError(null);
      try {
        let activeId = existingCaseId;

        // If no existing case ID, create unified case from intake, symptoms, and photo
        if (!activeId && intakeId) {
          const created = await createCase({
            intake_id: Number(intakeId),
            symptom_id: symptomId ? Number(symptomId) : null,
            photo_id: photoId ? Number(photoId) : null,
          });
          activeId = created.id;
          setCaseId(created.id);
          addToast(`Case #${created.id} established and routed for clinical handoff!`, "success");
        }

        if (activeId) {
          const handoff = await getCaseHandoff(activeId);
          setCaseBundle(handoff);
        } else {
          setError("No active intake found. Please complete the health intake first.");
        }
      } catch (err) {
        setError(err.message || "Unable to generate case summary. Please check your network.");
      } finally {
        setIsLoading(false);
      }
    }

    initCase();
  }, [intakeId, symptomId, photoId, existingCaseId, addToast]);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <span className="text-sm text-ink-600 font-medium">Assembling clinical handoff bundle...</span>
      </div>
    );
  }

  if (error || !caseBundle) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 rounded-xl bg-surface-0 border border-line-200 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-emergency mx-auto" />
        <h3 className="text-lg font-bold text-ink-900">Case Handoff Unavailable</h3>
        <p className="text-xs sm:text-sm text-ink-600 leading-relaxed">{error || "Case record could not be loaded."}</p>
        <Link href="/patient/intake">
          <Button variant="primary">Start Health Intake</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6 pb-12 print:p-0 print:max-w-none">
      <PageHeader
        title={`Clinical Handoff & Triage Summary — Case #${caseBundle.case_id}`}
        description="Structured record ready for physician or dental specialist consultation."
        actions={
          <div className="flex items-center gap-2 print:hidden">
            <Button
              variant="secondary"
              size="sm"
              onClick={handlePrint}
              icon={<Printer className="w-3.5 h-3.5" />}
            >
              Print Summary
            </Button>
            <Link href="/patient/cases">
              <Button variant="outline" size="sm">
                View All Cases
              </Button>
            </Link>
          </div>
        }
      />

      <DisclaimerBanner variant="alert" />

      {caseBundle.emergency && (
        <EmergencyBanner
          message="Immediate hospital escalation requested by clinical rules. Present to hospital casualty or call emergency services."
          phone="112 / 108"
        />
      )}

      {/* Case Overview Summary Card */}
      <Card variant="elevated">
        <Card.Header className="bg-surface-50">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <Card.Title>Case Record #{caseBundle.case_id}</Card.Title>
                <span className="text-xs text-ink-600">
                  Patient ID: #{caseBundle.patient?.id || "N/A"} &middot; Status: <strong className="uppercase">{caseBundle.status}</strong>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <RiskBadge risk={caseBundle.risk?.risk_level} size="md" />
              <UrgencyBadge
                urgency={caseBundle.symptoms?.urgency || "routine"}
                emergency={caseBundle.emergency}
                size="md"
              />
            </div>
          </div>
        </Card.Header>

        <Card.Content className="space-y-6">
          {/* Structured Text Summary */}
          <div className="p-4 rounded-xl bg-surface-50 border border-line-200 space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-600">
              Structured Handoff Text for Clinician:
            </span>
            <p className="text-sm text-ink-900 leading-relaxed font-mono bg-surface-0 p-3 rounded-lg border border-line-200">
              {caseBundle.summary_text}
            </p>
          </div>

          {/* Recommended Next Step */}
          <div className="p-4 rounded-xl bg-brand-50 border border-brand-100 flex items-start gap-3">
            <Stethoscope className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-brand-700 uppercase tracking-wider">
                Recommended Action &amp; Test Timeframe
              </span>
              <span className="text-sm font-bold text-ink-900">
                {caseBundle.recommended_test?.test || "Clinical Oral Cavity Examination"}
              </span>
              <span className="text-xs text-ink-600">
                Suggested timeframe: <strong>{caseBundle.recommended_test?.timeframe || "Within 2-4 weeks"}</strong>
              </span>
            </div>
          </div>

          {/* Risk Factors & Rule Reasons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-line-200 bg-surface-0 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-600 block">
                Habit Exposure Profile
              </span>
              <ul className="text-xs text-ink-900 space-y-1.5">
                <li><strong>Age:</strong> {caseBundle.patient?.age || "N/A"} years</li>
                <li><strong>Tobacco:</strong> {caseBundle.patient?.tobacco || "None"} ({caseBundle.patient?.tobacco_years || 0} years)</li>
                <li><strong>Betel Quid (Paan):</strong> {caseBundle.patient?.betel_quid ? "Yes" : "No"}</li>
                <li><strong>Alcohol:</strong> {caseBundle.patient?.alcohol || "None"}</li>
                <li><strong>Family History:</strong> {caseBundle.patient?.family_history ? "Positive" : "None"}</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl border border-line-200 bg-surface-0 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-600 block">
                Reported Symptoms &amp; Duration
              </span>
              {caseBundle.symptoms ? (
                <ul className="text-xs text-ink-900 space-y-1.5">
                  <li><strong>Duration:</strong> {caseBundle.symptoms.duration_days ? `${caseBundle.symptoms.duration_days} days` : "Not specified"}</li>
                  <li><strong>Symptoms:</strong> {caseBundle.symptoms.symptoms?.join(", ") || "None selected"}</li>
                  <li><strong>Emergency Flags:</strong> {caseBundle.emergency ? "Yes (Emergency)" : "None"}</li>
                </ul>
              ) : (
                <span className="text-xs text-ink-600">No symptom check linked to this case.</span>
              )}
            </div>
          </div>

          {/* Photo Screening Details */}
          {caseBundle.photo && (
            <div className="p-4 rounded-xl border border-line-200 bg-surface-0 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-600 block">
                Oral Photo Screener Findings
              </span>
              <div className="flex items-center justify-between text-xs">
                <span>AI Screener Flag: <strong className="text-ink-900 capitalize">{caseBundle.photo.label || "Normal"}</strong></span>
                <span>Quality Gate Status: <strong className="text-risk-low">{caseBundle.photo.status}</strong></span>
              </div>
            </div>
          )}

          {/* What the Doctor Will Ask Checklist */}
          <div className="p-5 rounded-xl bg-surface-50 border border-line-200 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-900 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-brand-600" />
              Checklist: What Your Doctor Will Likely Ask
            </span>
            <ul className="text-xs text-ink-600 space-y-1.5 list-disc list-inside">
              <li>How long have you noticed the ulcer, lump, or white/red sore?</li>
              <li>Does it burn when eating spicy food or brush contact?</li>
              <li>Do you experience restricted mouth opening (cannot insert 3 fingers vertically)?</li>
              <li>Have you noticed any swelling or firm lumps on either side of your neck?</li>
            </ul>
          </div>

          <div className="pt-4 border-t border-line-200 flex flex-wrap items-center justify-between gap-3 print:hidden">
            <Link href="/patient">
              <Button variant="secondary">Return to Dashboard</Button>
            </Link>
            <Link href="/patient/quit">
              <Button variant="outline">Quit Tobacco Tracker</Button>
            </Link>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}

export default function PatientResultsPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-ink-600">Loading results...</div>}>
      <ResultsContent />
    </Suspense>
  );
}
