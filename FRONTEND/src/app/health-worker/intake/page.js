"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  UserPlus,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Stethoscope,
  Search,
  Camera,
  AlertTriangle,
  QrCode,
  Printer,
  RotateCcw,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import { Form } from "@/components/ui/Form";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { UrgencyBadge } from "@/components/ui/UrgencyBadge";
import { ReasonsList } from "@/components/ui/ReasonsList";
import { DisclaimerBanner } from "@/components/ui/DisclaimerBanner";
import { registerPatient, searchPatients } from "@/lib/api/patients";
import { submitIntake } from "@/lib/api/intake";
import { checkSymptoms } from "@/lib/api/symptoms";
import { screenPhoto } from "@/lib/api/photos";
import { createCase, getCaseHandoff } from "@/lib/api/cases";
import { useToast } from "@/context/ToastContext";
import { useI18n } from "@/context/I18nContext";

export default function HealthWorkerIntakePage() {
  const router = useRouter();
  const { addToast } = useToast();
  const { t } = useI18n();

  // Participant details
  const [patientName, setPatientName] = useState("");
  const [patientId, setPatientId] = useState(""); // Camp Token / ID
  const [age, setAge] = useState("");
  const [phone, setPhone] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [patientPassword, setPatientPassword] = useState("");
  const [gender, setGender] = useState("unspecified");
  const [assistedConsentGiven, setAssistedConsentGiven] = useState(true);

  // Existing patient search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  // Habit exposure
  const [tobacco, setTobacco] = useState("none");
  const [tobaccoYears, setTobaccoYears] = useState("");
  const [betelQuid, setBetelQuid] = useState(false);
  const [alcohol, setAlcohol] = useState("none");
  const [familyHistory, setFamilyHistory] = useState(false);
  const [priorOralLesion, setPriorOralLesion] = useState(false);

  // Symptoms & red flags
  const [hasUlcer, setHasUlcer] = useState(false);
  const [ulcerDays, setUlcerDays] = useState("");
  const [hasPatch, setHasPatch] = useState(false);
  const [hasLump, setHasLump] = useState(false);
  const [hasPain, setHasPain] = useState(false);
  const [hasDifficultySwallowing, setHasDifficultySwallowing] = useState(false);
  const [heavyBleeding, setHeavyBleeding] = useState(false);
  const [cannotSwallowFluids, setCannotSwallowFluids] = useState(false);

  // Photo
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  // Submission state & output
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [screeningResult, setScreeningResult] = useState(null);

  // Search existing patients debounced
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await searchPatients(searchQuery.trim(), 5);
        setSearchResults(res || []);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectExisting = (pt) => {
    setSelectedPatient(pt);
    setPatientName(pt.full_name);
    setPatientId(pt.camp_token || String(pt.id));
    if (pt.age) setAge(String(pt.age));
    if (pt.phone) setPhone(pt.phone);
    if (pt.gender) setGender(pt.gender);
    setSearchQuery("");
    setSearchResults([]);
    addToast(`Selected existing participant: ${pt.full_name}`, "info");
  };

  const handleClearSelection = () => {
    setSelectedPatient(null);
    setPatientName("");
    setPatientId("");
    setAge("");
    setPhone("");
    setPatientEmail("");
    setPatientPassword("");
    setGender("unspecified");
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!patientName.trim()) {
      setError("Please specify the participant's name.");
      return;
    }
    if (!age || Number(age) < 0 || Number(age) > 120) {
      setError("Please specify a valid participant age between 0 and 120.");
      return;
    }
    if (!assistedConsentGiven) {
      setError("Participant verbal or written consent must be obtained before clinical screening.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Resolve or Register Patient in Database
      let activePatient = selectedPatient;
      if (!activePatient) {
        activePatient = await registerPatient({
          full_name: patientName.trim(),
          age: Number(age),
          camp_token: patientId.trim() || undefined,
          phone: phone.trim() || undefined,
          email: patientEmail.trim() || undefined,
          password: patientPassword || undefined,
          gender: gender !== "unspecified" ? gender : undefined,
          consent_given: assistedConsentGiven,
        });
      }

      const activePatientId = activePatient.id;

      // Step 2: Submit Habit Intake Questionnaire
      const intakeRes = await submitIntake({
        patient_id: activePatientId,
        age: Number(age),
        tobacco,
        tobacco_years: tobacco !== "none" && tobaccoYears ? Number(tobaccoYears) : null,
        betel_quid: betelQuid,
        alcohol,
        family_history: familyHistory,
        prior_oral_lesion: priorOralLesion,
      });

      // Step 3: Submit Symptom Evaluation (if any symptoms or duration reported)
      let symptomRes = null;
      const symptomsList = [];
      if (hasUlcer) symptomsList.push("non_healing_ulcer");
      if (hasPatch) symptomsList.push("white_or_red_patch");
      if (hasLump) symptomsList.push("lump_or_swelling");
      if (hasPain) symptomsList.push("persistent_mouth_pain");
      if (hasDifficultySwallowing) symptomsList.push("difficulty_chewing_or_swallowing");

      if (symptomsList.length > 0 || heavyBleeding || cannotSwallowFluids || ulcerDays) {
        symptomRes = await checkSymptoms({
          patient_id: activePatientId,
          symptoms: symptomsList,
          duration_days: ulcerDays ? Number(ulcerDays) : null,
          heavy_bleeding: heavyBleeding,
          cannot_swallow_fluids: cannotSwallowFluids,
          severe_jaundice: false,
        });
      }

      // Step 4: Screen Photo (if captured)
      let photoRes = null;
      if (photoFile) {
        try {
          photoRes = await screenPhoto({
            file: photoFile,
            patient_id: activePatientId,
            send_to_doctor: true,
          });
        } catch (photoErr) {
          // If photo quality refused, we still complete the clinical case with clear notice
          console.warn("Photo screening warning:", photoErr.message);
        }
      }

      // Step 5: Save & Create Case linking Patient, Intake, Symptoms & Photo
      const caseRes = await createCase({
        patient_id: activePatientId,
        intake_id: intakeRes.id,
        symptom_id: symptomRes?.id || null,
        photo_id: photoRes?.id || null,
      });

      // Step 6: Fetch complete handoff bundle
      const handoff = await getCaseHandoff(caseRes.id);

      setScreeningResult({
        caseId: caseRes.id,
        patient: activePatient,
        intake: intakeRes,
        symptoms: symptomRes,
        photo: photoRes,
        handoff,
      });

      addToast("Participant screening completed and linked successfully!", "success");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Screening submission failed:", err);
      setError(err.message || "Failed to complete screening workflow. Please verify participant details.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedPatient(null);
    setPatientName("");
    setPatientId("");
    setAge("");
    setPhone("");
    setGender("unspecified");
    setTobacco("none");
    setTobaccoYears("");
    setBetelQuid(false);
    setAlcohol("none");
    setFamilyHistory(false);
    setPriorOralLesion(false);
    setHasUlcer(false);
    setUlcerDays("");
    setHasPatch(false);
    setHasLump(false);
    setHasPain(false);
    setHasDifficultySwallowing(false);
    setHeavyBleeding(false);
    setCannotSwallowFluids(false);
    setPhotoFile(null);
    setPhotoPreview(null);
    setScreeningResult(null);
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6 pb-12">
      <PageHeader
        title={t("Register & Screen Camp Participant")}
        description={t("Full health-worker-led oral cancer risk triage, habit evaluation, and clinical specialist referral.")}
        backHref="/health-worker"
        backLabel={t("Back to Camp Workspace")}
      />

      <DisclaimerBanner variant="subtle" />

      {screeningResult ? (
        /* Completed Screening Results Card */
        <Card variant="elevated" className="border-brand-600/30 overflow-hidden">
          <div className="bg-brand-50 border-b border-brand-100 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-brand-600 text-surface-0 flex items-center justify-center font-bold text-lg shadow-sm">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-700">
                  {t("Screening Completed & Case Created")}
                </span>
                <h2 className="text-xl font-extrabold text-ink-900">
                  {screeningResult.patient.full_name}
                </h2>
                <span className="text-xs text-ink-600">
                  {t("Token / ID:")} <strong>#{screeningResult.patient.camp_token || screeningResult.patient.id}</strong> &middot; {t("Age:")} {screeningResult.patient.age || "—"} &middot; {t("Case #")}{screeningResult.caseId}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <RiskBadge risk={screeningResult.handoff?.risk?.level || screeningResult.intake?.risk_level} size="lg" />
              {screeningResult.symptoms && (
                <UrgencyBadge urgency={screeningResult.symptoms.urgency} emergency={screeningResult.symptoms.emergency} size="lg" />
              )}
            </div>
          </div>

          <Card.Content className="space-y-6 p-6">
            {/* Urgent Alert if emergency */}
            {screeningResult.symptoms?.emergency && (
              <div className="p-4 rounded-xl bg-emergency-bg border-2 border-emergency text-emergency flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 flex-shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1 text-xs sm:text-sm">
                  <strong className="font-bold">{t("EMERGENCY ESCALATION FLAGGED")}</strong>
                  <p>{screeningResult.symptoms.action || t("Severe bleeding or acute airway obstruction requires immediate emergency transport.")}</p>
                </div>
              </div>
            )}

            {/* Contributing Factors */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-600">
                {t("Contributing Factors & Rule Evidence")}
              </span>
              <ReasonsList reasons={screeningResult.handoff?.risk?.reasons || screeningResult.intake?.reasons} />
            </div>

            {/* Referral timeframe & recommendation */}
            <div className="p-4 rounded-xl bg-surface-50 border border-line-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs sm:text-sm">
              <div>
                <span className="text-ink-600 block text-xs">{t("Recommended Action")}</span>
                <span className="font-bold text-ink-900 text-base">
                  {screeningResult.handoff?.recommended_test?.test || "Clinical Oral Examination"}
                </span>
              </div>
              <div className="sm:text-right">
                <span className="text-ink-600 block text-xs">{t("Target Referral Timeframe")}</span>
                <span className="font-semibold text-brand-700">
                  {screeningResult.handoff?.recommended_test?.timeframe || "Within 2-4 weeks"}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-6 border-t border-line-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <Button variant="secondary" onClick={resetForm} icon={<RotateCcw className="w-4 h-4" />}>
                {t("Screen Next Participant")}
              </Button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={() => window.print()}
                  icon={<Printer className="w-4 h-4" />}
                >
                  {t("Print Summary")}
                </Button>
                <Button
                  variant="primary"
                  onClick={() => router.push(`/health-worker/camp?patient_id=${screeningResult.patient.id}`)}
                  icon={<QrCode className="w-4 h-4" />}
                >
                  {t("Open Camp QR Health Card")}
                </Button>
              </div>
            </div>
          </Card.Content>
        </Card>
      ) : (
        /* Screening Form */
        <Form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {error && (
            <div className="p-4 rounded-xl bg-emergency-bg border border-emergency/30 text-emergency text-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Participant Registration & Identification */}
          <Card variant="default">
            <Card.Header>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-brand-600" />
                  <Card.Title>{t("1. Participant Identification & Registration")}</Card.Title>
                </div>
                {selectedPatient && (
                  <Button variant="ghost" size="sm" onClick={handleClearSelection} className="text-xs text-brand-600">
                    {t("Clear / Register New")}
                  </Button>
                )}
              </div>
              <Card.Description>
                {t("Register a new rural camp participant or search to select an existing attendee.")}
              </Card.Description>
            </Card.Header>
            <Card.Content className="space-y-4">
              {/* Existing Patient Quick Search */}
              <div className="relative">
                <Input
                  label={t("Search Existing Attendees (Optional)")}
                  placeholder={t("Search by name, token #, or ID...")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {isSearching && (
                  <div className="absolute right-3 top-9 text-xs text-ink-600">
                    {t("Searching...")}
                  </div>
                )}
                {searchResults.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-surface-0 border border-line-200 rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto">
                    {searchResults.map((pt) => (
                      <button
                        key={pt.id}
                        type="button"
                        onClick={() => handleSelectExisting(pt)}
                        className="w-full text-left p-3 hover:bg-brand-50 border-b border-line-100 flex items-center justify-between text-xs"
                      >
                        <span className="font-semibold text-ink-900">{pt.full_name}</span>
                        <span className="text-ink-600">
                          {t("Token:")} #{pt.camp_token || pt.id} {pt.age ? `· ${pt.age} yrs` : ""}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedPatient && (
                <div className="p-3 rounded-lg bg-brand-50 border border-brand-200 text-brand-700 text-xs flex items-center justify-between">
                  <span>{t("Selected Existing Participant:")} <strong>{selectedPatient.full_name} (ID: #{selectedPatient.id})</strong></span>
                  <span className="font-semibold">{t("Token:")} #{selectedPatient.camp_token || selectedPatient.id}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label={t("Participant Name / Tag")}
                  required
                  placeholder={t("e.g. Prithvi")}
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                />

                <Input
                  label={t("Patient ID / Token #")}
                  placeholder={t("e.g. 43")}
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  helperText={t("Camp slip token # or leave blank to auto-generate.")}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label={t("Age (Years)")}
                  type="text"
                  required
                  min={0}
                  max={120}
                  placeholder={t("e.g. 23")}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                />

                <Input
                  label={t("Phone Number (Optional)")}
                  type="tel"
                  placeholder={t("e.g. 9876543210")}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />

                <Select
                  label={t("Gender (Optional)")}
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  options={[
                    { value: "unspecified", label: t("Not Specified") },
                    { value: "male", label: t("Male") },
                    { value: "female", label: t("Female") },
                    { value: "other", label: t("Other") },
                  ]}
                />
              </div>

              {!selectedPatient && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label={t("Patient Login Email")}
                    type="email"
                    required
                    value={patientEmail}
                    onChange={(e) => setPatientEmail(e.target.value)}
                    helperText={t("The patient uses this email to view their screening results.")}
                  />
                  <Input
                    label={t("Temporary Patient Password")}
                    type="password"
                    required
                    minLength={8}
                    value={patientPassword}
                    onChange={(e) => setPatientPassword(e.target.value)}
                    helperText={t("At least 8 characters; share it securely with the patient.")}
                  />
                </div>
              )}

              <div className="p-4 rounded-xl border border-line-200 bg-surface-50 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-ink-900">{t("Informed Screening Consent")}</span>
                  <span className="text-[11px] text-ink-600">
                    {t("Participant has agreed to habits assessment and clinical evaluation.")}
                  </span>
                </div>
                <Checkbox
                  id="assistedConsent"
                  checked={assistedConsentGiven}
                  onChange={(e) => setAssistedConsentGiven(e.target.checked)}
                />
              </div>
            </Card.Content>
          </Card>

          {/* Section 2: Habit Exposure & Lifestyle Risk */}
          <Card variant="default">
            <Card.Header>
              <div className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-brand-600" />
                <Card.Title>{t("2. Tobacco, Paan & Habit Exposure")}</Card.Title>
              </div>
              <Card.Description>
                {t("Primary epidemiological risk factors driving oral malignancy.")}
              </Card.Description>
            </Card.Header>
            <Card.Content className="space-y-4">
              <Select
                label={t("Tobacco Consumption")}
                required
                value={tobacco}
                onChange={(e) => setTobacco(e.target.value)}
                options={[
                  { value: "none", label: t("None (Never or quit long ago)") },
                  { value: "smokeless", label: t("Smokeless (Gutkha, Khaini, Zarda, Masala)") },
                  { value: "smoking", label: t("Smoking (Bidi, Cigarette)") },
                  { value: "both", label: t("Both Smoking & Smokeless") },
                ]}
              />

              {tobacco !== "none" && (
                <Input
                  label={t("Years of Tobacco Consumption")}
                  type="number"
                  required
                  min={0}
                  max={90}
                  placeholder={t("e.g. 5")}
                  value={tobaccoYears}
                  onChange={(e) => setTobaccoYears(e.target.value)}
                />
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-line-200 bg-surface-50">
                  <Checkbox
                    id="betelQuid"
                    label={t("Areca Nut / Betel Quid / Paan")}
                    checked={betelQuid}
                    onChange={(e) => setBetelQuid(e.target.checked)}
                    helperText={t("Chewing areca nut with or without tobacco.")}
                  />
                </div>

                <Select
                  label={t("Alcohol Consumption")}
                  value={alcohol}
                  onChange={(e) => setAlcohol(e.target.value)}
                  options={[
                    { value: "none", label: t("None / Non-drinker") },
                    { value: "occasional", label: t("Occasional (Social)") },
                    { value: "regular", label: t("Regular (Weekly or daily)") },
                  ]}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-line-200 bg-surface-50">
                  <Checkbox
                    id="familyHistory"
                    label={t("Family History of Oral Cancer")}
                    checked={familyHistory}
                    onChange={(e) => setFamilyHistory(e.target.checked)}
                    helperText={t("First-degree biological relatives.")}
                  />
                </div>

                <div className="p-4 rounded-xl border border-line-200 bg-surface-50">
                  <Checkbox
                    id="priorLesion"
                    label={t("Previous Oral Biopsy or Patch")}
                    checked={priorOralLesion}
                    onChange={(e) => setPriorOralLesion(e.target.checked)}
                    helperText={t("History of leukoplakia or OSMF.")}
                  />
                </div>
              </div>
            </Card.Content>
          </Card>

          {/* Section 3: Clinical Symptoms & Red Flags */}
          <Card variant="default">
            <Card.Header>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-risk-med" />
                <Card.Title>{t("3. Oral Symptoms & Emergency Red Flags")}</Card.Title>
              </div>
              <Card.Description>
                {t("Critical clinical signals evaluated by deterministic safety rules.")}
              </Card.Description>
            </Card.Header>
            <Card.Content className="space-y-4">
              <div className="p-4 rounded-xl border border-line-200 bg-surface-50 space-y-3">
                <Checkbox
                  id="hasUlcer"
                  label={t("Persistent Oral Ulcer / Sore")}
                  checked={hasUlcer}
                  onChange={(e) => setHasUlcer(e.target.checked)}
                  helperText={t("Ulcers persisting > 3 weeks (21 days) represent high clinical priority.")}
                />

                {hasUlcer && (
                  <Input
                    label={t("Ulcer Duration in Days")}
                    type="number"
                    min={1}
                    max={365}
                    placeholder={t("e.g. 25")}
                    value={ulcerDays}
                    onChange={(e) => setUlcerDays(e.target.value)}
                    helperText={t("An ulcer lasting > 21 days immediately triggers biopsy recommendation.")}
                  />
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl border border-line-200 bg-surface-50">
                  <Checkbox
                    id="hasPatch"
                    label={t("White or Red Patch (Leukoplakia / Erythroplakia)")}
                    checked={hasPatch}
                    onChange={(e) => setHasPatch(e.target.checked)}
                  />
                </div>

                <div className="p-3.5 rounded-xl border border-line-200 bg-surface-50">
                  <Checkbox
                    id="hasLump"
                    label={t("Firm Lump or Swelling in Mouth / Neck")}
                    checked={hasLump}
                    onChange={(e) => setHasLump(e.target.checked)}
                  />
                </div>

                <div className="p-3.5 rounded-xl border border-line-200 bg-surface-50">
                  <Checkbox
                    id="hasPain"
                    label={t("Persistent Mouth Pain / Burning")}
                    checked={hasPain}
                    onChange={(e) => setHasPain(e.target.checked)}
                  />
                </div>

                <div className="p-3.5 rounded-xl border border-line-200 bg-surface-50">
                  <Checkbox
                    id="hasDiff"
                    label={t("Difficulty Chewing, Swallowing, or Restricted Opening")}
                    checked={hasDifficultySwallowing}
                    onChange={(e) => setHasDifficultySwallowing(e.target.checked)}
                  />
                </div>
              </div>

              {/* Acute Emergency Red Flags */}
              <div className="p-4 rounded-xl bg-emergency-bg/40 border border-emergency/30 space-y-3">
                <span className="text-xs font-bold text-emergency uppercase tracking-wider block">
                  {t("Immediate Escalation Red Flags")}
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Checkbox
                    id="heavyBleeding"
                    label={t("Active or Heavy Oral Bleeding")}
                    checked={heavyBleeding}
                    onChange={(e) => setHeavyBleeding(e.target.checked)}
                  />
                  <Checkbox
                    id="cannotSwallow"
                    label={t("Inability to Swallow Saliva or Fluids")}
                    checked={cannotSwallowFluids}
                    onChange={(e) => setCannotSwallowFluids(e.target.checked)}
                  />
                </div>
              </div>
            </Card.Content>
          </Card>

          {/* Section 4: Oral Lesion Photography */}
          <Card variant="default">
            <Card.Header>
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-brand-600" />
                <Card.Title>{t("4. Oral Lesion Photograph (Optional)")}</Card.Title>
              </div>
              <Card.Description>
                {t("Capture or upload a well-lit photo of the suspect mouth tissue for the quality gate and Grad-CAM screener.")}
              </Card.Description>
            </Card.Header>
            <Card.Content className="space-y-4">
              <input
                type="file"
                id="photoInput"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoSelect}
                className="block w-full text-xs text-ink-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
              />

              {photoPreview && (
                <div className="relative w-48 h-48 rounded-xl overflow-hidden border border-line-200">
                  <Image src={photoPreview} alt="Lesion Preview" width={192} height={192} unoptimized className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoFile(null);
                      setPhotoPreview(null);
                    }}
                    className="absolute top-2 right-2 bg-emergency text-surface-0 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow"
                  >
                    &times;
                  </button>
                </div>
              )}
            </Card.Content>
          </Card>

          {/* Action Submission */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <Button variant="secondary" onClick={() => router.push("/health-worker")}>
              {t("Cancel")}
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              icon={<ArrowRight className="w-4 h-4" />}
              iconPosition="right"
            >
              {t("Save & Complete Screening")}
            </Button>
          </div>
        </Form>
      )}
    </div>
  );
}
