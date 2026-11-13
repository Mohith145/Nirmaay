"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  AlertTriangle,
  Cpu,
  Sparkles,
  Camera,
  Sun,
  Eye,
  CheckCircle,
  HelpCircle,
  RefreshCw,
} from "lucide-react";
import { AppShell } from "@/components/ui/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DemoBadge } from "@/components/ui/DemoBadge";
import { DisclaimerBanner } from "@/components/ui/DisclaimerBanner";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { getModelCard } from "@/lib/api/modelCard";
import { useI18n } from "@/context/I18nContext";

export default function ModelCardPage() {
  const [modelCard, setModelCard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { t } = useI18n();

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getModelCard();
      setModelCard(data);
    } catch (err) {
      setError("Unable to connect to model-card endpoint. Displaying offline specification.");
      // Fallback object matching backend specification
      setModelCard({
        status: "demo placeholder",
        model_available: false,
        scope: "Oral photo screening only",
        architecture: "TBD",
        input_size: "TBD",
        normalization: "TBD",
        calibration_temperature: "TBD",
        not_sure_threshold: "TBD",
        sensitivity_by_class: "TBD",
        disclaimer: "Screening aid, not diagnosis.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <AppShell showSidebar={false}>
      <div className="flex flex-col gap-8 max-w-4xl mx-auto pb-12">
        <PageHeader
          title={t("modelcard.title", "Model Card & Algorithmic Transparency")}
          description={t("modelcard.desc", "Technical disclosures, intended use, limitations, and ethical guardrails.")}
          actions={
            <Button
              variant="secondary"
              size="sm"
              onClick={loadData}
              icon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              {t("Refresh Status", "Refresh Status")}
            </Button>
          }
        />

        <DisclaimerBanner variant="alert" />

        {/* Live Backend Status */}
        <Card variant="default">
          <Card.Header>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-brand-600" />
                <Card.Title>{t("Live Service Model Status", "Live Service Model Status")}</Card.Title>
              </div>
              <DemoBadge label={t("Transparency Report", "Transparency Report")} />
            </div>
            <Card.Description>
              {t("Real-time response queried from backend GET /model-card", "Real-time response queried from backend GET /model-card")}
            </Card.Description>
          </Card.Header>
          <Card.Content>
            {isLoading ? (
              <div className="py-8 flex items-center justify-center gap-3">
                <Spinner size="md" />
                <span className="text-xs text-ink-600">{t("Checking model availability...", "Checking model availability...")}</span>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-surface-50 border border-line-200">
                  <div
                    className={`w-3.5 h-3.5 rounded-full ${
                      modelCard?.model_available ? "bg-risk-low" : "bg-risk-med"
                    }`}
                  />
                  <div className="flex flex-col flex-1">
                    <span className="text-sm font-bold text-ink-900">
                      {t("Model Available:", "Model Available:")}{" "}
                      <span className={modelCard?.model_available ? "text-risk-low" : "text-risk-med"}>
                        {modelCard?.model_available ? t("YES (Active Vision Model)", "YES (Active Vision Model)") : t("FALSE (Demo Placeholder)", "FALSE (Demo Placeholder)")}
                      </span>
                    </span>
                    <span className="text-xs text-ink-600">
                      {t("Status tag:", "Status tag:")} <strong>{modelCard?.status ? t(modelCard.status, modelCard.status) : t("demo placeholder", "demo placeholder")}</strong>
                    </span>
                  </div>
                  {!modelCard?.model_available && (
                    <Badge variant="risk-med">{t("Demo Placeholder Mode", "Demo Placeholder Mode")}</Badge>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg border border-line-200 bg-surface-0 flex justify-between">
                    <span className="text-ink-600">{t("Intended Scope:", "Intended Scope:")}</span>
                    <span className="font-semibold text-ink-900">{t(modelCard?.scope || "Oral photo screening only", modelCard?.scope || "Oral photo screening only")}</span>
                  </div>
                  <div className="p-3 rounded-lg border border-line-200 bg-surface-0 flex justify-between">
                    <span className="text-ink-600">{t("Architecture:", "Architecture:")}</span>
                    <span className="font-semibold text-ink-900">{t(modelCard?.architecture || "TBD / MobileNet", modelCard?.architecture || "TBD / MobileNet")}</span>
                  </div>
                  <div className="p-3 rounded-lg border border-line-200 bg-surface-0 flex justify-between">
                    <span className="text-ink-600">{t("Calibration Temperature:", "Calibration Temperature:")}</span>
                    <span className="font-semibold text-ink-900">{modelCard?.calibration_temperature || "TBD"}</span>
                  </div>
                  <div className="p-3 rounded-lg border border-line-200 bg-surface-0 flex justify-between">
                    <span className="text-ink-600">{t("Uncertainty Threshold:", "Uncertainty Threshold:")}</span>
                    <span className="font-semibold text-ink-900">{modelCard?.not_sure_threshold || "TBD"}</span>
                  </div>
                </div>

                {error && <p className="text-xs text-risk-med">{error}</p>}
              </div>
            )}
          </Card.Content>
        </Card>

        {/* Clinical Guardrails */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Rules vs Model */}
          <Card>
            <Card.Header>
              <Card.Title>{t("1. Rules Decide, AI Explains", "1. Rules Decide, AI Explains")}</Card.Title>
              <Card.Description>{t("Separation of clinical risk logic and AI perception", "Separation of clinical risk logic and AI perception")}</Card.Description>
            </Card.Header>
            <Card.Content className="text-xs text-ink-600 space-y-2 leading-relaxed">
              <p>
                <strong>{t("Hardcoded Deterministic Rules:", "Hardcoded Deterministic Rules:")}</strong>{" "}
                {t("All risk scores (Low, Medium, High), urgency levels (routine, soon, urgent), and emergency escalations are calculated strictly by audited deterministic rules in the rules engine.", "All risk scores (Low, Medium, High), urgency levels (routine, soon, urgent), and emergency escalations are calculated strictly by audited deterministic rules in the rules engine.")}
              </p>
              <p>
                <strong>{t("No LLM Diagnostics:", "No LLM Diagnostics:")}</strong>{" "}
                {t("Language models are restricted to explaining contributing factors in accessible words. An AI output can never escalate, downgrade, or create a diagnostic conclusion.", "Language models are restricted to explaining contributing factors in accessible words. An AI output can never escalate, downgrade, or create a diagnostic conclusion.")}
              </p>
            </Card.Content>
          </Card>

          {/* Photo Quality Gate */}
          <Card>
            <Card.Header>
              <Card.Title>{t("2. Mandatory Quality Gate", "2. Mandatory Quality Gate")}</Card.Title>
              <Card.Description>{t("Pre-screening validation checks", "Pre-screening validation checks")}</Card.Description>
            </Card.Header>
            <Card.Content className="text-xs text-ink-600 space-y-2 leading-relaxed">
              <p>
                <strong>{t("Blur & Lighting Filters:", "Blur & Lighting Filters:")}</strong>{" "}
                {t("The backend quality gate computes Laplacian variance and brightness histograms. Blurry or dark photos are refused with HTTP 422 before reaching any classifier.", "The backend quality gate computes Laplacian variance and brightness histograms. Blurry or dark photos are refused with HTTP 422 before reaching any classifier.")}
              </p>
              <p>
                <strong>{t("Uncertainty Fallback:", "Uncertainty Fallback:")}</strong>{" "}
                {t("If the model confidence falls below safe bounds or detects out-of-distribution patterns, it outputs \"Not sure, please see a doctor\".", "If the model confidence falls below safe bounds or detects out-of-distribution patterns, it outputs \"Not sure, please see a doctor\".")}
              </p>
            </Card.Content>
          </Card>
        </div>

        {/* Limitations & Bias Disclosures */}
        <Card variant="flat">
          <Card.Header>
            <Card.Title>{t("Limitations, Bias & Field Realities", "Limitations, Bias & Field Realities")}</Card.Title>
            <Card.Description>{t("Critical factors when evaluating oral images in field settings", "Critical factors when evaluating oral images in field settings")}</Card.Description>
          </Card.Header>
          <Card.Content className="space-y-4 text-xs sm:text-sm text-ink-600 leading-relaxed">
            <div className="flex items-start gap-3">
              <Sun className="w-5 h-5 text-risk-med flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-ink-900 block">{t("Lighting & Shadow Variations:", "Lighting & Shadow Variations:")}</strong>
                {t("Oral cavity photography is notoriously lighting-dependent. Shadows cast by teeth, tongue movement, and mobile flash reflections can confound image screeners.", "Oral cavity photography is notoriously lighting-dependent. Shadows cast by teeth, tongue movement, and mobile flash reflections can confound image screeners.")}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Eye className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-ink-900 block">{t("Skin Tone & Mucosal Pigmentation:", "Skin Tone & Mucosal Pigmentation:")}</strong>
                {t("Normal physiological pigmentation (melanoplakia) is frequent in diverse South Asian populations. The model must not mistake benign melanin deposits for malignant lesions.", "Normal physiological pigmentation (melanoplakia) is frequent in diverse South Asian populations. The model must not mistake benign melanin deposits for malignant lesions.")}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Camera className="w-5 h-5 text-demo flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-ink-900 block">{t("Camera Lens & Resolution Dispersion:", "Camera Lens & Resolution Dispersion:")}</strong>
                {t("Health workers in rural camps use varying Android smartphone sensors with wide-ranging focal lengths. Optical distortion must be validated across device tiers before clinical deployment.", "Health workers in rural camps use varying Android smartphone sensors with wide-ranging focal lengths. Optical distortion must be validated across device tiers before clinical deployment.")}
              </div>
            </div>
          </Card.Content>
        </Card>
      </div>
    </AppShell>
  );
}
