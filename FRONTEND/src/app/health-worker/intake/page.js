"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  UserPlus,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { RadioGroup } from "@/components/ui/RadioGroup";
import { Checkbox } from "@/components/ui/Checkbox";
import { Form } from "@/components/ui/Form";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { ReasonsList } from "@/components/ui/ReasonsList";
import { DisclaimerBanner } from "@/components/ui/DisclaimerBanner";
import { grantConsent } from "@/lib/api/consent";
import { submitIntake } from "@/lib/api/intake";
import { useToast } from "@/context/ToastContext";

export default function HealthWorkerIntakePage() {
  const router = useRouter();
  const { addToast } = useToast();

  const [patientId, setPatientId] = useState("");
  const [patientName, setPatientName] = useState("");
  const [age, setAge] = useState("");
  const [tobacco, setTobacco] = useState("none");
  const [tobaccoYears, setTobaccoYears] = useState("");
  const [betelQuid, setBetelQuid] = useState(false);
  const [alcohol, setAlcohol] = useState("none");
  const [familyHistory, setFamilyHistory] = useState(false);
  const [priorOralLesion, setPriorOralLesion] = useState(false);

  const [assistedConsentGiven, setAssistedConsentGiven] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [intakeResult, setIntakeResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!age || Number(age) < 0 || Number(age) > 120) {
      setError("Please specify a valid participant age.");
      return;
    }

    if (!assistedConsentGiven) {
      setError("Participant verbal/written consent must be obtained before intake.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const numericPatientId = patientId ? Number(patientId) : 1; // Default to camp attendee #1 if unassigned

      // 1. Record assisted consent
      await grantConsent({
        patient_id: numericPatientId,
        purpose: "screening",
      });

      // 2. Submit oral intake
      const result = await submitIntake({
        patient_id: numericPatientId,
        age: Number(age),
        tobacco,
        tobacco_years: tobacco !== "none" ? Number(tobaccoYears) : null,
        betel_quid: betelQuid,
        alcohol,
        family_history: familyHistory,
        prior_oral_lesion: priorOralLesion,
      });

      setIntakeResult(result);
      addToast("Assisted screening intake recorded successfully!", "success");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err.message || "Failed to submit assisted intake.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6 pb-12">
      <PageHeader
        title="Assisted Camp Participant Intake"
        description="Record oral cancer habit exposure on behalf of screening camp participants."
        backHref="/health-worker"
        backLabel="Back to Camp Workspace"
      />

      <DisclaimerBanner variant="subtle" />

      {intakeResult ? (
        <Card variant="elevated" className="border-brand-600/30">
          <Card.Header>
            <div className="flex items-center justify-between">
              <Card.Title>Camp Participant Risk Result</Card.Title>
              <RiskBadge risk={intakeResult.risk_level} size="lg" />
            </div>
            <Card.Description>
              Participant: <strong>{patientName || `Patient #${patientId || 1}`}</strong> &middot; Intake #{intakeResult.id}
            </Card.Description>
          </Card.Header>
          <Card.Content className="space-y-6">
            <div className="p-4 rounded-xl bg-surface-50 border border-line-200 flex items-center justify-between">
              <div>
                <span className="text-xs text-ink-600 block">Risk Score</span>
                <span className="text-xl font-bold text-ink-900">{intakeResult.risk_score} points</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-ink-600 block">Camp Referral Timeframe</span>
                <span className="text-sm font-semibold text-brand-700">
                  {intakeResult.recommended_test?.test || "Oral Examination"}
                </span>
                <span className="text-xs text-ink-600 block">
                  {intakeResult.recommended_test?.timeframe || "Within 2-4 weeks"}
                </span>
              </div>
            </div>

            <ReasonsList reasons={intakeResult.reasons} />

            <div className="pt-4 border-t border-line-200 flex items-center justify-between">
              <Button variant="secondary" onClick={() => setIntakeResult(null)}>
                New Participant
              </Button>
              <Button
                variant="primary"
                onClick={() => router.push(`/health-worker/camp?patient_id=${patientId || 1}`)}
                icon={<ArrowRight className="w-4 h-4" />}
                iconPosition="right"
              >
                Generate Camp QR Health Card
              </Button>
            </div>
          </Card.Content>
        </Card>
      ) : (
        <Card variant="default">
          <Card.Header>
            <Card.Title>Participant Details &amp; Habits</Card.Title>
          </Card.Header>
          <Card.Content>
            <Form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {error && (
                <div className="p-3 rounded-lg bg-emergency-bg border border-emergency/30 text-emergency text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Participant Name / Tag"
                  type="text"
                  placeholder="e.g. Anand Gowda"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                />

                <Input
                  label="Patient ID / Token #"
                  type="number"
                  placeholder="e.g. 1"
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  helperText="Leave blank for automatic camp token assignment."
                />
              </div>

              <Input
                label="Age (Years)"
                type="number"
                required
                min={0}
                max={120}
                placeholder="e.g. 52"
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />

              <Select
                label="Tobacco Consumption"
                required
                value={tobacco}
                onChange={(e) => setTobacco(e.target.value)}
                options={[
                  { value: "none", label: "None (Never or quit long ago)" },
                  { value: "smokeless", label: "Smokeless (Gutkha, Khaini, Zarda)" },
                  { value: "smoking", label: "Smoking (Bidi, Cigarette)" },
                  { value: "both", label: "Both Smoking & Smokeless" },
                ]}
              />

              {tobacco !== "none" && (
                <Input
                  label="Years of Tobacco Consumption"
                  type="number"
                  required
                  min={0}
                  max={90}
                  placeholder="e.g. 20"
                  value={tobaccoYears}
                  onChange={(e) => setTobaccoYears(e.target.value)}
                />
              )}

              <div className="p-4 rounded-xl border border-line-200 bg-surface-50">
                <Checkbox
                  id="assistedBetel"
                  label="Chews Betel Quid (Paan) or Areca Nut (Supari)"
                  checked={betelQuid}
                  onChange={(e) => setBetelQuid(e.target.checked)}
                />
              </div>

              <RadioGroup
                label="Alcohol Habits"
                name="assistedAlcohol"
                value={alcohol}
                onChange={setAlcohol}
                options={[
                  { value: "none", label: "None / Abstinent" },
                  { value: "occasional", label: "Occasional (1-2 times/month)" },
                  { value: "regular", label: "Regular (Weekly or daily)" },
                ]}
              />

              <div className="p-4 rounded-xl border border-line-200 bg-surface-50 space-y-3">
                <Checkbox
                  id="assistedFamily"
                  label="Family History of Head/Neck or Oral Cancer"
                  checked={familyHistory}
                  onChange={(e) => setFamilyHistory(e.target.checked)}
                />
                <Checkbox
                  id="assistedLesion"
                  label="Prior Oral White/Red Patch or Biopsy"
                  checked={priorOralLesion}
                  onChange={(e) => setPriorOralLesion(e.target.checked)}
                />
              </div>

              {/* Assisted Consent Affirmation */}
              <div className="p-4 rounded-xl border border-brand-100 bg-brand-50/50">
                <Checkbox
                  id="assistedConsent"
                  label="Participant has provided verbal / written consent for screening"
                  description="Required by healthcare safety protocols before submitting intake data."
                  checked={assistedConsentGiven}
                  onChange={(e) => setAssistedConsentGiven(e.target.checked)}
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <Button variant="secondary" type="button" onClick={() => router.push("/health-worker")}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="lg" isLoading={isLoading}>
                  Record Assisted Intake
                </Button>
              </div>
            </Form>
          </Card.Content>
        </Card>
      )}
    </div>
  );
}
