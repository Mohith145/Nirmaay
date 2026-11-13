"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Activity,
  AlertOctagon,
  AlertCircle,
  ArrowRight,
  PhoneCall,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { Form } from "@/components/ui/Form";
import { UrgencyBadge } from "@/components/ui/UrgencyBadge";
import { ReasonsList } from "@/components/ui/ReasonsList";
import { EmergencyBanner } from "@/components/ui/EmergencyBanner";
import { DisclaimerBanner } from "@/components/ui/DisclaimerBanner";
import { checkSymptoms } from "@/lib/api/symptoms";
import { useToast } from "@/context/ToastContext";

function SymptomsForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const intakeId = searchParams.get("intake_id");
  const { addToast } = useToast();

  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [durationDays, setDurationDays] = useState("");
  const [heavyBleeding, setHeavyBleeding] = useState(false);
  const [cannotSwallow, setCannotSwallow] = useState(false);
  const [severeJaundice, setSevereJaundice] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [symptomResult, setSymptomResult] = useState(null);

  const symptomsList = [
    { id: "non_healing_ulcer", label: "Non-healing mouth ulcer or sore", desc: "A sore that has not healed despite mouthwashes or ointments" },
    { id: "white_or_red_patch", label: "White or velvety red patch", desc: "Persistent patch on the inside of cheek, tongue, or gums" },
    { id: "lump_or_swelling", label: "Lump or tissue thickening", desc: "Hardness or swelling in cheek, tongue, floor of mouth, or neck" },
    { id: "persistent_mouth_pain", label: "Persistent mouth or ear pain", desc: "Unexplained continuous burning or radiating ear pain" },
    { id: "difficulty_chewing_or_swallowing", label: "Difficulty chewing, swallowing, or moving tongue", desc: "Restricted tongue mobility or jaw opening (trismus)" },
    { id: "unexplained_loose_tooth", label: "Unexplained loose tooth or socket pain", desc: "Teeth becoming loose without underlying gum disease" },
  ];

  const handleToggleSymptom = (id) => {
    setSelectedSymptoms((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const result = await checkSymptoms({
        symptoms: selectedSymptoms,
        duration_days: durationDays ? Number(durationDays) : null,
        heavy_bleeding: heavyBleeding,
        cannot_swallow_fluids: cannotSwallow,
        severe_jaundice: severeJaundice,
      });

      setSymptomResult(result);
      if (result.emergency) {
        addToast("Emergency red flags detected. Immediate hospital care recommended.", "error", 6000);
      } else {
        addToast("Symptoms analyzed by deterministic urgency rules.", "success");
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err.message || "Failed to analyze symptoms. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6 pb-12">
      <PageHeader
        title="Symptoms & Duration Evaluation"
        description="Tracks ulcer duration (persistence > 3 weeks is a key signal) and immediate emergency red flags."
        backHref="/patient/intake"
        backLabel="Back to Intake"
      />

      <DisclaimerBanner variant="subtle" />

      {symptomResult ? (
        <div className="flex flex-col gap-6 animate-in fade-in duration-300">
          {symptomResult.emergency && (
            <EmergencyBanner
              message="Acute emergency criteria triggered. Do not wait for standard appointments. Seek emergency casualty care immediately."
              phone="112 / 108"
            />
          )}

          <Card variant="elevated" className={symptomResult.emergency ? "border-emergency" : "border-brand-600/30"}>
            <Card.Header>
              <div className="flex items-center justify-between">
                <Card.Title>Clinical Urgency Assessment</Card.Title>
                <UrgencyBadge
                  urgency={symptomResult.urgency}
                  emergency={symptomResult.emergency}
                  size="lg"
                />
              </div>
              <Card.Description>
                Deterministic Symptom Check #{symptomResult.id}
              </Card.Description>
            </Card.Header>
            <Card.Content className="space-y-6">
              <div className="p-4 rounded-xl bg-surface-50 border border-line-200 flex items-center justify-between">
                <div>
                  <span className="text-xs text-ink-600 block">Assigned Urgency Category</span>
                  <span className="text-xl font-bold text-ink-900 capitalize">
                    {symptomResult.emergency ? "Immediate Emergency" : symptomResult.urgency}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-ink-600 block">Recommended Action</span>
                  <span className="text-sm font-semibold text-brand-700">
                    {symptomResult.recommended_test?.test || "Specialist Evaluation"}
                  </span>
                  <span className="text-xs text-ink-600 block">
                    Timeframe: {symptomResult.recommended_test?.timeframe || "Within 1-2 weeks"}
                  </span>
                </div>
              </div>

              {/* Reasons */}
              <ReasonsList reasons={symptomResult.reasons} title="Symptom Urgency Factors" />

              <div className="pt-4 border-t border-line-200 flex items-center justify-between">
                <Button variant="secondary" onClick={() => setSymptomResult(null)}>
                  Edit Symptoms
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() =>
                    router.push(
                      `/patient/photo?intake_id=${intakeId || ""}&symptom_id=${symptomResult.id}`
                    )
                  }
                  icon={<ArrowRight className="w-4 h-4" />}
                  iconPosition="right"
                >
                  Proceed to Oral Photo Screener
                </Button>
              </div>
            </Card.Content>
          </Card>
        </div>
      ) : (
        <Card variant="default">
          <Card.Header>
            <Card.Title>Check Active Mouth Symptoms</Card.Title>
            <Card.Description>
              Select any signs present in your oral cavity, tongue, lips, or gums.
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <Form onSubmit={handleSubmit} className="flex flex-col gap-6">
              {error && (
                <div className="p-3 rounded-lg bg-emergency-bg border border-emergency/30 text-emergency text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Symptom Checkboxes */}
              <div className="space-y-3">
                <span className="text-sm font-semibold text-ink-900 block">
                  Select all symptoms you are currently experiencing:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {symptomsList.map((item) => {
                    const isChecked = selectedSymptoms.includes(item.id);
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleToggleSymptom(item.id)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          isChecked
                            ? "bg-brand-50 border-brand-600 text-brand-900"
                            : "bg-surface-0 border-line-200 hover:bg-surface-50"
                        }`}
                      >
                        <Checkbox
                          id={item.id}
                          label={item.label}
                          description={item.desc}
                          checked={isChecked}
                          onChange={() => handleToggleSymptom(item.id)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Duration */}
              <div className="flex flex-col gap-1.5">
                <Input
                  label="How many days has your most prominent symptom been present?"
                  type="number"
                  id="duration"
                  min={0}
                  max={3650}
                  placeholder="e.g. 25"
                  value={durationDays}
                  onChange={(e) => setDurationDays(e.target.value)}
                  helperText="An ulcer lasting longer than 21 days (3 weeks) requires urgent clinical biopsy rule evaluation."
                />
                {Number(durationDays) > 21 && (
                  <div className="p-3 rounded-lg bg-risk-med-bg border border-risk-med/40 text-ink-900 text-xs flex items-center gap-2">
                    <Clock className="w-4 h-4 text-risk-med flex-shrink-0" />
                    <span>
                      Ulcer persistent for &gt; 3 weeks is flagged by the rules engine for priority doctor review.
                    </span>
                  </div>
                )}
              </div>

              {/* Emergency Red Flags Box */}
              <div className="p-5 rounded-xl bg-emergency-bg/40 border border-emergency/30 space-y-3">
                <div className="flex items-center gap-2 text-emergency">
                  <AlertOctagon className="w-5 h-5" />
                  <span className="text-sm font-bold">Acute Emergency Checklist (Rule Escalate)</span>
                </div>
                <p className="text-xs text-ink-600">
                  Please check if you are experiencing any of these life-critical conditions:
                </p>

                <div className="space-y-2">
                  <Checkbox
                    id="bleeding"
                    label="Active, heavy, continuous bleeding from the mouth"
                    checked={heavyBleeding}
                    onChange={(e) => setHeavyBleeding(e.target.checked)}
                  />
                  <Checkbox
                    id="swallowing"
                    label="Complete inability to swallow liquids, water, or saliva"
                    checked={cannotSwallow}
                    onChange={(e) => setCannotSwallow(e.target.checked)}
                  />
                  <Checkbox
                    id="jaundice"
                    label="Severe jaundice (yellow eyes/skin) or acute breathlessness"
                    checked={severeJaundice}
                    onChange={(e) => setSevereJaundice(e.target.checked)}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-line-200 flex items-center justify-between">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => router.push("/patient")}
                >
                  Save &amp; Exit
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isLoading}
                  icon={<ArrowRight className="w-4 h-4" />}
                  iconPosition="right"
                >
                  Analyze Symptoms
                </Button>
              </div>
            </Form>
          </Card.Content>
        </Card>
      )}
    </div>
  );
}

export default function PatientSymptomsPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-ink-600">Loading symptoms...</div>}>
      <SymptomsForm />
    </Suspense>
  );
}
