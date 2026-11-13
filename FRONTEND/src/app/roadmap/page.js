"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  Sparkles,
  Clock,
  MapPin,
  FileText,
  HelpCircle,
  CreditCard,
  Building,
  Shield,
  Layers,
} from "lucide-react";
import { AppShell } from "@/components/ui/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DemoBadge } from "@/components/ui/DemoBadge";
import { Tabs } from "@/components/ui/Tabs";
import { DisclaimerBanner } from "@/components/ui/DisclaimerBanner";
import { Button } from "@/components/ui/Button";

export default function RoadmapPage() {
  const [activeTab, setActiveTab] = useState("implemented");

  const implementedFeatures = [
    {
      title: "Deterministic Clinical Rules Engine",
      desc: "Computes Low, Medium, and High risk using audited clinical rules without relying on unvalidated black-box predictions.",
      stage: "Live in Prototype",
    },
    {
      title: "Pre-Screening Photo Quality Gate",
      desc: "Laplacian variance and illumination histograms to reject blurry and underexposed mouth photos with 422.",
      stage: "Live in Prototype",
    },
    {
      title: "Clinician Case Queue & Override System",
      desc: "Triage queue sorted by emergency escalation and wait-time; clinicians confirm or override with recorded clinical reasons.",
      stage: "Live in Prototype",
    },
    {
      title: "Teleconsultation Jitsi Video Integration",
      desc: "Clinician initiates encrypted video room call for immediate patient and health-worker handoff consultations.",
      stage: "Live in Prototype",
    },
    {
      title: "Strict Consent Management & Data Purging",
      desc: "Full withdrawal workflow: deleting consent stops processing, marks case deletion, and purges retained photos.",
      stage: "Live in Prototype",
    },
    {
      title: "Plain-Language AI Explainer Service",
      desc: "Translates complex risk factors into accessible summaries with mandatory non-diagnostic disclaimers.",
      stage: "Live in Prototype",
    },
  ];

  const demoPreviewFeatures = [
    {
      id: "centers",
      title: "Nearby Specialized Cancer Centers Preview",
      desc: "Mock lookup of government tertiary centers, Regional Cancer Centres (RCCs), and district oncology units.",
      previewContent: (
        <div className="flex flex-col gap-2 mt-2">
          <div className="p-3 rounded-lg border border-line-200 bg-surface-50 flex items-start justify-between">
            <div>
              <span className="font-semibold text-ink-900 text-xs block">Kidwai Memorial Institute of Oncology</span>
              <span className="text-[11px] text-ink-600">Bengaluru, Karnataka &middot; 4.2 km &middot; Govt. Tertiary Centre</span>
            </div>
            <Badge variant="risk-low" size="sm">Govt. Empanelled</Badge>
          </div>
          <div className="p-3 rounded-lg border border-line-200 bg-surface-50 flex items-start justify-between">
            <div>
              <span className="font-semibold text-ink-900 text-xs block">District Civil Hospital Oncology Wing</span>
              <span className="text-[11px] text-ink-600">District HQ &middot; 12.8 km &middot; Biopsy & Screening Unit</span>
            </div>
            <Badge variant="brand" size="sm">District Level</Badge>
          </div>
        </div>
      ),
    },
    {
      id: "pmjay",
      title: "PM-JAY (Ayushman Bharat) Coverage Estimator",
      desc: "Mock verification of free diagnostics, biopsy coverage, and tertiary cancer care benefits.",
      previewContent: (
        <div className="p-3 rounded-lg border border-brand-100 bg-brand-50 flex flex-col gap-1.5 mt-2">
          <div className="flex items-center justify-between text-xs font-bold text-brand-700">
            <span>Ayushman Bharat Golden Card Entitlement</span>
            <span>Up to ₹5,00,000 / year</span>
          </div>
          <p className="text-[11px] text-ink-600">
            Covers surgical oncology, pre-operative biopsy, histopathology, radiation, and chemotherapy at empanelled hospitals.
          </p>
        </div>
      ),
    },
    {
      id: "test-prep",
      title: "Diagnostic Test Preparation Guidance",
      desc: "Clear preparation steps for follow-up endoscopy, punch biopsy, and contrast imaging.",
      previewContent: (
        <ul className="list-disc list-inside space-y-1 text-xs text-ink-600 mt-2 bg-surface-50 p-3 rounded-lg border border-line-200">
          <li><strong>Oral Biopsy:</strong> Avoid hot liquids and smoking for 4 hours prior. Local anaesthesia will be applied.</li>
          <li><strong>Upper GI Endoscopy:</strong> Fast for at least 6 to 8 hours before the scheduled exam.</li>
        </ul>
      ),
    },
    {
      id: "doctor-questions",
      title: "&ldquo;What the Doctor Will Ask&rdquo; Checklist",
      desc: "Structured preparation questions so patients and health workers arrive prepared for consultation.",
      previewContent: (
        <div className="p-3 rounded-lg border border-line-200 bg-surface-50 text-xs text-ink-900 space-y-1 mt-2">
          <p>&bull; How many days/weeks has the sore or white patch been present?</p>
          <p>&bull; Does it bleed during brushing or eating spicy food?</p>
          <p>&bull; Have you noticed any trouble opening your mouth widely?</p>
        </div>
      ),
    },
  ];

  const plannedFutureFeatures = [
    {
      title: "Sarvam & Bhashini Offline Voice Stack",
      desc: "Complete local speech-to-speech interaction in 12 Indian regional languages for low-literacy rural camp participants.",
      quarter: "Q1 2027",
    },
    {
      title: "Longitudinal Oral Lesion Growth Tracking",
      desc: "Visual side-by-side comparison of baseline photos with subsequent monthly checkups to detect spatial ulcer expansion.",
      quarter: "Q2 2027",
    },
    {
      title: "WhatsApp Direct Conversational Intake Bot",
      desc: "Thin bot client allowing patients to complete intake and upload photos over WhatsApp, linked to the same backend case record.",
      quarter: "Q2 2027",
    },
    {
      title: "ABDM Health ID (ABHA) Integration",
      desc: "Direct linkage to Ayushman Bharat Digital Mission health locker for secure health-record portability.",
      quarter: "Q3 2027",
    },
  ];

  return (
    <AppShell showSidebar={false}>
      <div className="flex flex-col gap-8 max-w-4xl mx-auto pb-12">
        <PageHeader
          title="Platform Roadmap & Innovation Previews"
          description="Transparent overview of implemented MVP systems, interactive demo prototypes, and future milestones."
          badge={<Badge variant="demo" icon={<Layers className="w-3.5 h-3.5" />}>Full Scope</Badge>}
        />

        <DisclaimerBanner variant="subtle" />

        {/* Tab Controls */}
        <Tabs
          tabs={[
            { id: "implemented", label: "Implemented MVP", icon: <CheckCircle2 className="w-4 h-4 text-risk-low" /> },
            { id: "demo-previews", label: "Interactive Demo Previews", icon: <Sparkles className="w-4 h-4 text-demo" /> },
            { id: "planned", label: "Future Architecture", icon: <Clock className="w-4 h-4 text-ink-600" /> },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        {/* Tab 1: Implemented MVP */}
        {activeTab === "implemented" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {implementedFeatures.map((feat, idx) => (
              <Card key={idx} variant="default" className="p-5 flex flex-col justify-between gap-3">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm sm:text-base text-ink-900">{feat.title}</span>
                    <Badge variant="risk-low" size="sm">Implemented</Badge>
                  </div>
                  <p className="text-xs text-ink-600 leading-relaxed">{feat.desc}</p>
                </div>
                <div className="pt-3 border-t border-line-200 text-[11px] font-semibold text-risk-low flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{feat.stage}</span>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Tab 2: Demo Previews */}
        {activeTab === "demo-previews" && (
          <div className="flex flex-col gap-6">
            <div className="p-4 rounded-xl bg-demo-bg/50 border border-demo/30 text-xs text-ink-900 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-demo flex-shrink-0" />
                <span>
                  The following interactive modules showcase upcoming assistive patient capabilities with simulated data.
                </span>
              </div>
              <DemoBadge label="mock data" size="sm" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {demoPreviewFeatures.map((feat) => (
                <Card key={feat.id} variant="default" className="p-5 flex flex-col justify-between">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-ink-900">{feat.title}</span>
                      <DemoBadge label="demo preview" size="sm" />
                    </div>
                    <p className="text-xs text-ink-600">{feat.desc}</p>
                    {feat.previewContent}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Planned Future Features */}
        {activeTab === "planned" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plannedFutureFeatures.map((feat, idx) => (
              <Card key={idx} variant="flat" className="p-5 flex flex-col justify-between gap-3">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-ink-900">{feat.title}</span>
                    <Badge variant="outline" size="sm">{feat.quarter}</Badge>
                  </div>
                  <p className="text-xs text-ink-600 leading-relaxed">{feat.desc}</p>
                </div>
                <div className="pt-3 border-t border-line-200 text-[11px] text-ink-400 font-medium">
                  Roadmap Milestone
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
