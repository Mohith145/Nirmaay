"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardList,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Info,
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
import { ExplainPanel } from "@/components/ui/ExplainPanel";
import { DisclaimerBanner } from "@/components/ui/DisclaimerBanner";
import { submitIntake } from "@/lib/api/intake";
import { useToast } from "@/context/ToastContext";

export default function PatientIntakePage() {
  const router = useRouter();
  const { addToast } = useToast();

  const [age, setAge] = useState("");
  const [tobacco, setTobacco] = useState("none");
  const [tobaccoYears, setTobaccoYears] = useState("");
  const [betelQuid, setBetelQuid] = useState(false);
  const [alcohol, setAlcohol] = useState("none");
  const [familyHistory, setFamilyHistory] = useState(false);
  const [priorOralLesion, setPriorOralLesion] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [intakeResult, setIntakeResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!age || Number(age) < 0 || Number(age) > 120) {
      setError("Please provide a valid age between 0 and 120.");
      return;
    }

    if (tobacco !== "none" && (!tobaccoYears || Number(tobaccoYears) < 0)) {
      setError("Please specify how many years you have consumed tobacco.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await submitIntake({
        age: Number(age),
        tobacco,
        tobacco_years: tobacco !== "none" ? Number(tobaccoYears) : null,
        betel_quid: betelQuid,
        alcohol,
        family_history: familyHistory,
        prior_oral_lesion: priorOralLesion,
      });

      setIntakeResult(result);
      addToast("Health intake analyzed by deterministic rules engine!", "success");
      // Scroll to top
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      if (err.message && err.message.toLowerCase().includes("consent")) {
        setError("Informed consent is required before health intake. Please grant consent first.");
        setTimeout(() => router.push("/patient/consent"), 2000);
      } else {
        setError(err.message || "Failed to analyze intake. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6 pb-12">
      <PageHeader
        title="2-Minute Health & Lifestyle Intake"
        description="Data-minimized questions to evaluate known exposure and clinical risk drivers."
        backHref="/patient"
        backLabel="Back to Dashboard"
      />

      <DisclaimerBanner variant="subtle" />

      {/* Result Display Section */}
      {intakeResult ? (
        <div className="flex flex-col gap-6 animate-in fade-in duration-300">
          <Card variant="elevated" className="border-brand-600/30">
            <Card.Header>
              <div className="flex items-center justify-between">
                <Card.Title>Intake Risk Assessment Result</Card.Title>
                <RiskBadge risk={intakeResult.risk_level} size="lg" />
              </div>
              <Card.Description>
                Calculated strictly by deterministic clinical rules &middot; Intake #{intakeResult.id}
              </Card.Description>
            </Card.Header>
            <Card.Content className="space-y-6">
              <div className="p-4 rounded-xl bg-surface-50 border border-line-200 flex items-center justify-between">
                <div>
                  <span className="text-xs text-ink-600 block">Calculated Risk Score</span>
                  <span className="text-2xl font-bold text-ink-900">{intakeResult.risk_score} points</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-ink-600 block">Recommended Clinical Action</span>
                  <span className="text-sm font-semibold text-brand-700">
                    {intakeResult.recommended_test?.test || "Oral Examination"}
                  </span>
                  <span className="text-xs text-ink-600 block">
                    Timeframe: {intakeResult.recommended_test?.timeframe || "Within 4 weeks"}
                  </span>
                </div>
              </div>

              {/* Contributing reasons */}
              <ReasonsList reasons={intakeResult.reasons} />

              {/* AI Plain Language Explanation */}
              <ExplainPanel result={intakeResult} />

              <div className="pt-4 border-t border-line-200 flex items-center justify-between">
                <Button variant="secondary" onClick={() => setIntakeResult(null)}>
                  Edit Answers
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => router.push(`/patient/symptoms?intake_id=${intakeResult.id}`)}
                  icon={<ArrowRight className="w-4 h-4" />}
                  iconPosition="right"
                >
                  Proceed to Symptoms Check
                </Button>
              </div>
            </Card.Content>
          </Card>
        </div>
      ) : (
        /* Questionnaire Form */
        <Card variant="default">
          <Card.Header>
            <Card.Title>Personal Health &amp; Exposure Form</Card.Title>
            <Card.Description>
              Takes approximately 2 minutes. All answers are confidential.
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <Form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {error && (
                <div className="p-3 rounded-lg bg-emergency-bg border border-emergency/30 text-emergency text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Age */}
              <Input
                label="Your Age (Years)"
                type="number"
                id="age"
                required
                min={0}
                max={120}
                placeholder="e.g. 45"
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />

              {/* Tobacco */}
              <Select
                label="Tobacco Consumption Habits"
                id="tobacco"
                required
                value={tobacco}
                onChange={(e) => setTobacco(e.target.value)}
                options={[
                  { value: "none", label: "None (Never or quit > 10 years ago)" },
                  { value: "smokeless", label: "Smokeless Tobacco (Gutkha, Khaini, Zarda, Masala)" },
                  { value: "smoking", label: "Smoking (Bidi, Cigarette, Hookah)" },
                  { value: "both", label: "Both Smoking & Smokeless Tobacco" },
                ]}
                helperText="Smokeless tobacco and areca nut are major risk factors in South Asia."
              />

              {/* Tobacco Duration */}
              {tobacco !== "none" && (
                <Input
                  label="How many years have you used tobacco?"
                  type="number"
                  id="tobaccoYears"
                  required
                  min={0}
                  max={90}
                  placeholder="e.g. 15"
                  value={tobaccoYears}
                  onChange={(e) => setTobaccoYears(e.target.value)}
                  helperText="Cumulative exposure duration heavily correlates with mucosal risk."
                />
              )}

              {/* Betel Quid / Paan */}
              <div className="p-4 rounded-xl border border-line-200 bg-surface-50">
                <Checkbox
                  id="betelQuid"
                  label="Do you chew Betel Quid (Paan) or Areca Nut (Supari)?"
                  description="Includes paan with or without tobacco, sweet supari, or pan masala."
                  checked={betelQuid}
                  onChange={(e) => setBetelQuid(e.target.checked)}
                />
              </div>

              {/* Alcohol */}
              <RadioGroup
                label="Alcohol Consumption"
                name="alcohol"
                value={alcohol}
                onChange={setAlcohol}
                options={[
                  { value: "none", label: "None / Abstinent" },
                  { value: "occasional", label: "Occasional (Social, 1-2 drinks per month)" },
                  { value: "regular", label: "Regular (Weekly or daily consumption)" },
                ]}
                helperText="Combined tobacco and alcohol usage synergistically elevates oral mucosal risk."
              />

              {/* History */}
              <div className="space-y-3">
                <div className="p-4 rounded-xl border border-line-200 bg-surface-50">
                  <Checkbox
                    id="familyHistory"
                    label="Family History of Head, Neck, or Oral Cancer?"
                    description="Immediate family (parent, sibling, grandparent) diagnosed with cancer."
                    checked={familyHistory}
                    onChange={(e) => setFamilyHistory(e.target.checked)}
                  />
                </div>

                <div className="p-4 rounded-xl border border-line-200 bg-surface-50">
                  <Checkbox
                    id="priorLesion"
                    label="Have you ever had a prior white/red mouth patch or biopsy?"
                    description="History of leukoplakia, erythroplakia, or oral submucous fibrosis (OSMF)."
                    checked={priorOralLesion}
                    onChange={(e) => setPriorOralLesion(e.target.checked)}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-line-200 flex items-center justify-between">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => router.push("/patient")}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isLoading}
                  icon={<ArrowRight className="w-4 h-4" />}
                  iconPosition="right"
                >
                  Analyze Risk Score
                </Button>
              </div>
            </Form>
          </Card.Content>
        </Card>
      )}
    </div>
  );
}
