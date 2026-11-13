"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  QrCode,
  Users,
  Search,
  CheckCircle2,
  Printer,
  Copy,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { DemoBadge } from "@/components/ui/DemoBadge";
import { DisclaimerBanner } from "@/components/ui/DisclaimerBanner";
import { Spinner } from "@/components/ui/Spinner";
import { getQrCard } from "@/lib/api/demo";
import { useToast } from "@/context/ToastContext";

function CampModeContent() {
  const searchParams = useSearchParams();
  const initialPatientId = searchParams.get("patient_id") || "1";
  const { addToast } = useToast();

  const [patientIdInput, setPatientIdInput] = useState(initialPatientId);
  const [activePatientId, setActivePatientId] = useState(initialPatientId);
  const [qrData, setQrData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadQr() {
      setIsLoading(true);
      try {
        const data = await getQrCard(activePatientId);
        setQrData(data);
      } catch {
        // Fallback demo payload
        setQrData({
          patient_id: activePatientId,
          qr_payload: `nirmay://demo/card/${activePatientId}`,
          card_title: "Nirmay screening card (demo placeholder)",
          data_label: "demo data",
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadQr();
  }, [activePatientId]);

  const handleLookup = (e) => {
    e.preventDefault();
    if (patientIdInput) {
      setActivePatientId(patientIdInput);
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6 pb-12 print:p-0">
      <PageHeader
        title="Field Camp Mode &amp; QR Health Cards"
        description="Issue portable, privacy-preserving digital QR health cards for rural camp participants."
        backHref="/health-worker"
        backLabel="Back to Camp Workspace"
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => window.print()}
            icon={<Printer className="w-3.5 h-3.5" />}
            className="print:hidden"
          >
            Print Card
          </Button>
        }
      />

      <DisclaimerBanner variant="subtle" />

      {/* Participant Lookup */}
      <Card variant="default" className="print:hidden">
        <Card.Content>
          <form onSubmit={handleLookup} className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex-1 w-full">
              <Input
                placeholder="Enter Participant ID (e.g. 1, 2, 3)"
                value={patientIdInput}
                onChange={(e) => setPatientIdInput(e.target.value)}
              />
            </div>
            <Button type="submit" variant="primary" icon={<Search className="w-4 h-4" />}>
              Generate / Lookup QR Card
            </Button>
          </form>
        </Card.Content>
      </Card>

      {/* QR Health Card Display */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Spinner size="lg" />
          <span className="text-xs text-ink-600">Generating digital QR token...</span>
        </div>
      ) : (
        <div className="max-w-md mx-auto w-full">
          <Card variant="elevated" className="border-2 border-brand-600/40 p-6 flex flex-col items-center text-center gap-5 shadow-lg">
            <div className="w-full flex items-center justify-between border-b border-line-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-600 text-surface-0 flex items-center justify-center font-bold text-sm">
                  N
                </div>
                <span className="font-bold text-ink-900 text-sm">Nirmay Health Card</span>
              </div>
              <DemoBadge label="demo card" size="sm" />
            </div>

            {/* QR Simulation Visual */}
            <div className="p-6 rounded-2xl bg-surface-0 border-2 border-dashed border-brand-600/50 flex flex-col items-center justify-center gap-3 shadow-inner">
              <div className="w-44 h-44 rounded-xl bg-surface-50 border border-line-200 flex flex-col items-center justify-center p-3 relative">
                <QrCode className="w-36 h-36 text-ink-900 stroke-[1.5]" />
              </div>
              <span className="text-xs font-mono font-bold text-ink-900">
                Participant Token: #{qrData?.patient_id}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-sm font-bold text-ink-900">{qrData?.card_title}</span>
              <p className="text-xs text-ink-600 leading-relaxed max-w-xs">
                Carry this QR payload to any empanelled civil or oncology center for direct triage intake.
              </p>
            </div>

            <div className="w-full p-3 rounded-lg bg-surface-50 border border-line-200 text-left space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-400 block">
                QR Digital Payload
              </span>
              <code className="text-[11px] font-mono text-brand-700 block truncate">
                {qrData?.qr_payload}
              </code>
            </div>

            <div className="w-full pt-3 border-t border-line-200 flex items-center justify-between text-xs text-ink-600">
              <span className="flex items-center gap-1 text-risk-low font-semibold">
                <ShieldCheck className="w-4 h-4" /> Validated
              </span>
              <span>Camp Session 2026</span>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function HealthWorkerCampPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-ink-600">Loading camp mode...</div>}>
      <CampModeContent />
    </Suspense>
  );
}
