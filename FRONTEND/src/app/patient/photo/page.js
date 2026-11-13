"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Camera,
  AlertCircle,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { FileDropzone } from "@/components/ui/FileDropzone";
import { HeatmapImage } from "@/components/ui/HeatmapImage";
import { DemoBadge } from "@/components/ui/DemoBadge";
import { DisclaimerBanner } from "@/components/ui/DisclaimerBanner";
import { screenPhoto } from "@/lib/api/photos";
import { useToast } from "@/context/ToastContext";

function PhotoScreeningForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const intakeId = searchParams.get("intake_id");
  const symptomId = searchParams.get("symptom_id");
  const { addToast } = useToast();

  const [selectedFile, setSelectedFile] = useState(null);
  const [sendToDoctor, setSendToDoctor] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [qualityRefusal, setQualityRefusal] = useState(null);
  const [photoResult, setPhotoResult] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleFileSelect = (file) => {
    setSelectedFile(file);
    setError(null);
    setQualityRefusal(null);
    setPhotoResult(null);

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleClear = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setError(null);
    setQualityRefusal(null);
    setPhotoResult(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError("Please capture or select an oral photo first.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setQualityRefusal(null);

    try {
      const result = await screenPhoto({
        file: selectedFile,
        send_to_doctor: sendToDoctor,
      });

      setPhotoResult(result);
      addToast("Oral photo analyzed by vision screener and quality gate!", "success");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      // Check if it's a 422 Quality Gate Refusal
      if (err.status === 422 || (err.details && (err.details.reason || err.details.retake_tip))) {
        setQualityRefusal({
          reason: err.details?.reason || err.message || "Photo rejected by quality gate",
          retakeTip: err.details?.retake_tip || "Ensure the mouth is well lit with direct torch light and hold camera still to avoid blur.",
        });
        addToast("Photo quality insufficient for reliable screening.", "warning");
      } else {
        setError(err.message || "Failed to process oral photo. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6 pb-12">
      <PageHeader
        title="Oral Photo Screening"
        description="Captures mouth/lesion images and verifies blur and lighting before analyzing visual features."
        backHref={`/patient/symptoms?intake_id=${intakeId || ""}`}
        backLabel="Back to Symptoms"
      />

      <DisclaimerBanner variant="alert" />

      {/* Result Display */}
      {photoResult ? (
        <div className="flex flex-col gap-6 animate-in fade-in duration-300">
          <Card variant="elevated" className="border-brand-600/30">
            <Card.Header>
              <div className="flex items-center justify-between">
                <Card.Title>Visual Screening Analysis</Card.Title>
                {photoResult.demo_placeholder && (
                  <DemoBadge label="demo placeholder model" />
                )}
              </div>
              <Card.Description>
                Image Screening #{photoResult.id} &middot; Status: <strong>{photoResult.status}</strong>
              </Card.Description>
            </Card.Header>
            <Card.Content className="space-y-6">
              {/* Heatmap & Photo Preview */}
              <HeatmapImage
                imageUrl={previewUrl}
                heatmapB64={photoResult.heatmap_b64}
                label={photoResult.label}
                confidence={photoResult.confidence}
                isDemo={photoResult.demo_placeholder}
              />

              <div className="p-4 rounded-xl bg-surface-50 border border-line-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs text-ink-600 block">AI Screening Flag</span>
                  <span className="text-lg font-bold text-ink-900 capitalize">
                    {photoResult.label || "Normal / Screening OK"}
                  </span>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-xs text-ink-600 block">Clinician Retained</span>
                  <span className="text-sm font-semibold text-brand-700">
                    {photoResult.retained_for_doctor ? "Yes (Shared for Review)" : "No (Local only)"}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-brand-50 border border-brand-100 text-xs text-ink-900 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1">
                  <strong>Clinical Notice on AI Vision:</strong>
                  <span>{photoResult.message || "This result is an assistive screener flag, not a biopsy or diagnostic confirmation."}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-line-200 flex items-center justify-between">
                <Button variant="secondary" onClick={() => setPhotoResult(null)} icon={<RotateCcw className="w-4 h-4" />}>
                  Retake Photo
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() =>
                    router.push(
                      `/patient/results?intake_id=${intakeId || ""}&symptom_id=${symptomId || ""}&photo_id=${photoResult.id}`
                    )
                  }
                  icon={<ArrowRight className="w-4 h-4" />}
                  iconPosition="right"
                >
                  Generate Case &amp; Handoff Summary
                </Button>
              </div>
            </Card.Content>
          </Card>
        </div>
      ) : (
        /* Upload Form */
        <Card variant="default">
          <Card.Header>
            <Card.Title>Capture or Upload Lesion Image</Card.Title>
            <Card.Description>
              Our automated quality gate verifies image sharpness, illumination, and framing before screening.
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              {error && (
                <div className="p-3 rounded-lg bg-emergency-bg border border-emergency/30 text-emergency text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Quality Gate Refusal Alert (422) */}
              {qualityRefusal && (
                <div className="p-5 rounded-xl bg-risk-med-bg border border-risk-med text-ink-900 space-y-2">
                  <div className="flex items-center gap-2 text-risk-med font-bold text-sm">
                    <ShieldAlert className="w-5 h-5" />
                    <span>Photo Refused by Quality Gate</span>
                  </div>
                  <p className="text-xs text-ink-900 font-semibold">{qualityRefusal.reason}</p>
                  <div className="p-3 rounded-lg bg-surface-0 border border-risk-med/30 text-xs text-ink-600">
                    <strong className="text-ink-900 block mb-1">💡 Retake Tip:</strong>
                    {qualityRefusal.retakeTip}
                  </div>
                </div>
              )}

              {/* Dropzone */}
              <FileDropzone
                label="Mouth / Lesion Photograph"
                selectedFile={selectedFile}
                onFileSelect={handleFileSelect}
                onClear={handleClear}
                instruction="Tap to capture photo with camera or browse image gallery"
                guidanceTips={[
                  "Ask someone to shine a smartphone torch directly into the mouth",
                  "Rest your hand against your cheek or chin to prevent blur",
                  "Frame the ulcer or sore in the center of the shot",
                ]}
              />

              {/* Retain for Doctor Checkbox */}
              <div className="p-4 rounded-xl border border-line-200 bg-surface-50">
                <Checkbox
                  id="sendToDoctor"
                  label="Retain this photo for reviewing doctor consultation"
                  description="When enabled, your reviewing clinician can inspect this photo and Grad-CAM heatmap in the clinical queue."
                  checked={sendToDoctor}
                  onChange={(e) => setSendToDoctor(e.target.checked)}
                />
              </div>

              <div className="pt-4 border-t border-line-200 flex items-center justify-between">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => router.push(`/patient/symptoms?intake_id=${intakeId || ""}`)}
                >
                  Back
                </Button>
                <div className="flex items-center gap-3">
                  {/* Option to skip photo if user cannot take one */}
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() =>
                      router.push(
                        `/patient/results?intake_id=${intakeId || ""}&symptom_id=${symptomId || ""}`
                      )
                    }
                  >
                    Skip Photo &rarr;
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={!selectedFile}
                    isLoading={isLoading}
                    icon={<Camera className="w-4 h-4" />}
                  >
                    Screen Photo
                  </Button>
                </div>
              </div>
            </form>
          </Card.Content>
        </Card>
      )}
    </div>
  );
}

export default function PatientPhotoPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-ink-600">Loading photo screener...</div>}>
      <PhotoScreeningForm />
    </Suspense>
  );
}
