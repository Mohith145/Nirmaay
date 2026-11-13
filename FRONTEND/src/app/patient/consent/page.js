"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, AlertCircle, ArrowRight, FileText, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { DisclaimerBanner } from "@/components/ui/DisclaimerBanner";
import { grantConsent } from "@/lib/api/consent";
import { useToast } from "@/context/ToastContext";

export default function PatientConsentPage() {
  const router = useRouter();
  const { addToast } = useToast();

  const [acceptedDisclaimer, setAcceptedDisclaimer] = useState(false);
  const [acceptedProcessing, setAcceptedProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const isFormValid = acceptedDisclaimer && acceptedProcessing;

  const handleGrantConsent = async (e) => {
    e.preventDefault();
    if (!isFormValid) {
      setError("Please check both consent acknowledgments before proceeding.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const consent = await grantConsent({ purpose: "screening" });
      if (typeof window !== "undefined") {
        localStorage.setItem("nirmay_active_consent_id", String(consent.id));
      }
      addToast("Consent granted successfully! Starting health intake.", "success");
      router.push("/patient/intake");
    } catch (err) {
      setError(err.message || "Failed to record consent. Please ensure you are logged in.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6 pb-12">
      <PageHeader
        title="Informed Screening Consent"
        description="Please read this disclosure carefully before beginning your oral health evaluation."
        backHref="/patient"
        backLabel="Back to Dashboard"
      />

      <DisclaimerBanner variant="alert" />

      <Card variant="default">
        <Card.Header>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-brand-600" />
            <Card.Title>Consent for Oral Cancer Early-Triage Screening</Card.Title>
          </div>
          <Card.Description>
            Document Reference: NIRMAY-CONSENT-V1 &middot; Purpose: Oral Cancer Triage Support
          </Card.Description>
        </Card.Header>

        <Card.Content className="space-y-4 text-xs sm:text-sm text-ink-900 leading-relaxed">
          <div className="p-4 rounded-xl bg-surface-50 border border-line-200 space-y-2">
            <h4 className="font-bold text-ink-900">1. Nature &amp; Purpose of this Service</h4>
            <p className="text-ink-600">
              Nirmay is a software research prototype designed to assist early identification of oral
              cavity risk factors and facilitate structured handoff to qualified oncologists or dental
              specialists. <strong>This service does not provide a definitive medical diagnosis.</strong>
            </p>
          </div>

          <div className="p-4 rounded-xl bg-surface-50 border border-line-200 space-y-2">
            <h4 className="font-bold text-ink-900">2. Data Minimization &amp; Image Retention</h4>
            <p className="text-ink-600">
              We collect only the lifestyle factors utilized by our clinical rules (age, tobacco habits,
              betel quid, and duration). Oral photos uploaded for screening are checked for quality and
              retained only when you authorize them to be shared with a reviewing clinician.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-surface-50 border border-line-200 space-y-2">
            <h4 className="font-bold text-ink-900">3. Right to Immediate Withdrawal</h4>
            <p className="text-ink-600">
              You maintain the unconditional right to withdraw your consent at any time from your patient
              profile. Upon withdrawal, processing stops immediately, active cases are flagged for
              deletion, and stored screening photos are permanently purged.
            </p>
          </div>

          <form onSubmit={handleGrantConsent} className="pt-4 flex flex-col gap-4">
            {error && (
              <div className="p-3 rounded-lg bg-emergency-bg border border-emergency/30 text-emergency text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-3 p-4 rounded-xl border border-brand-100 bg-brand-50/50">
              <Checkbox
                id="check-disclaimer"
                label="I understand that Nirmay is a triage screening aid and NOT a definitive cancer diagnosis."
                description="I will seek an in-person clinical exam and biopsy for any persistent mouth ulcer."
                checked={acceptedDisclaimer}
                onChange={(e) => setAcceptedDisclaimer(e.target.checked)}
              />

              <Checkbox
                id="check-processing"
                label="I agree to provide my lifestyle habits and oral photographs for clinical evaluation."
                description="I understand that I can withdraw this consent and request data deletion at any time."
                checked={acceptedProcessing}
                onChange={(e) => setAcceptedProcessing(e.target.checked)}
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button
                variant="secondary"
                size="md"
                type="button"
                onClick={() => router.push("/patient")}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={!isFormValid}
                isLoading={isLoading}
                icon={<ArrowRight className="w-4 h-4" />}
                iconPosition="right"
              >
                Grant Consent &amp; Start Intake
              </Button>
            </div>
          </form>
        </Card.Content>
      </Card>
    </div>
  );
}
