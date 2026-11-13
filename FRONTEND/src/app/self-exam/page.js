"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Eye,
  CheckSquare,
  PlayCircle,
  Lightbulb,
  Camera,
  ArrowRight,
  Sparkles,
  ShieldAlert,
} from "lucide-react";
import { AppShell } from "@/components/ui/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DemoBadge } from "@/components/ui/DemoBadge";
import { DisclaimerBanner } from "@/components/ui/DisclaimerBanner";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/config/routes";

export default function SelfExamPage() {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      title: "Step 1: Lips & Gums",
      area: "Lower & Upper Labial Mucosa",
      instructions:
        "Look into a mirror with good light. Pull your lower lip down and inspect the inside pink tissue. Repeat with the upper lip. Check gums around both upper and lower teeth.",
      lookFor: "Persistent ulcers, white patches, firm nodules, or unexplained bleeding.",
      icon: "👄",
    },
    {
      title: "Step 2: Inside Cheeks (Buccal Mucosa)",
      area: "Right & Left Cheeks",
      instructions:
        "Use clean fingers to gently stretch the right cheek outward. Inspect the lining from the back molars to the corner of the lips. Repeat on the left side.",
      lookFor: "Rough white or red patches, leathery fibrous bands (trismus/submucous fibrosis), or indurated sores.",
      icon: "🔍",
    },
    {
      title: "Step 3: Roof of Mouth (Palate)",
      area: "Hard & Soft Palate",
      instructions:
        "Tilt your head back and open wide under a bright light source (torch or room lamp). Inspect the hard roof and soft palate towards the uvula.",
      lookFor: "Discoloration, red velvety patches (erythroplakia), or unexplained swelling.",
      icon: "💡",
    },
    {
      title: "Step 4: Tongue & Floor of Mouth",
      area: "Lateral Tongue & Floor",
      instructions:
        "Stick your tongue straight out. Move it to the right to inspect the left lateral border, then move to the left. Finally, touch the roof of your mouth with your tongue tip to inspect the floor beneath.",
      lookFor:
        "The lateral border and floor of mouth are the highest risk zones. Check for non-healing ulcers, firmness, or red sores.",
      icon: "👅",
    },
    {
      title: "Step 5: Neck & Jawline Lymph Nodes",
      area: "Submandibular & Cervical Lymph Nodes",
      instructions:
        "Gently roll the tips of your fingers along both sides of your jawline, under your chin, and down both sides of your neck.",
      lookFor: "Firm, painless, enlarged lumps or asymmetry that has persisted for several weeks.",
      icon: "✋",
    },
  ];

  return (
    <AppShell showSidebar={false}>
      <div className="flex flex-col gap-8 max-w-4xl mx-auto pb-12">
        <PageHeader
          title="Step-by-Step Oral Self-Examination Guide"
          description="Learn how to inspect the 5 critical anatomical zones of your mouth once every month."
          badge={<Badge variant="brand">2-Minute Monthly Habit</Badge>}
        />

        <DisclaimerBanner variant="subtle" />

        {/* Video Tutorial Placeholder */}
        <Card variant="default">
          <Card.Header>
            <div className="flex items-center justify-between">
              <Card.Title>Oral Examination Video Tutorial</Card.Title>
              <DemoBadge label="Demo Content" />
            </div>
            <Card.Description>
              Demonstrates proper tongue traction, cheek retraction, and smartphone camera lighting.
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <div className="relative aspect-video rounded-xl overflow-hidden bg-ink-900/90 text-surface-0 flex flex-col items-center justify-center p-6 text-center shadow-inner">
              <div className="w-16 h-16 rounded-full bg-brand-600/80 hover:bg-brand-600 text-surface-0 flex items-center justify-center cursor-pointer transition-transform hover:scale-110 mb-3 shadow-lg">
                <PlayCircle className="w-8 h-8" />
              </div>
              <span className="text-sm font-semibold">Video: How to Examine Your Mouth in 2 Minutes</span>
              <span className="text-xs text-ink-400 mt-1">
                Demo placeholder video simulation &middot; 2:45 duration
              </span>
            </div>
          </Card.Content>
        </Card>

        {/* Interactive Step Navigator */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step Selector List */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-600 px-1 mb-1">
              Examination Steps
            </span>
            {steps.map((st, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveStep(idx)}
                className={`p-3 rounded-xl border text-left transition-all min-h-touch flex items-center gap-3 ${
                  activeStep === idx
                    ? "bg-brand-50 border-brand-600 text-brand-700 shadow-xs font-semibold"
                    : "bg-surface-0 border-line-200 text-ink-900 hover:bg-surface-50"
                }`}
              >
                <span className="text-xl flex-shrink-0">{st.icon}</span>
                <div className="flex flex-col truncate">
                  <span className="text-xs font-bold">{st.title}</span>
                  <span className="text-[11px] text-ink-600 truncate">{st.area}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Active Step Detail Card */}
          <div className="md:col-span-2">
            <Card variant="default" className="h-full flex flex-col justify-between p-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-line-200 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{steps[activeStep].icon}</span>
                    <h3 className="text-lg font-bold text-ink-900">{steps[activeStep].title}</h3>
                  </div>
                  <Badge variant="outline">{steps[activeStep].area}</Badge>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink-600">
                    How to inspect:
                  </span>
                  <p className="text-sm text-ink-900 leading-relaxed">
                    {steps[activeStep].instructions}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-risk-med-bg/60 border border-risk-med/30 flex flex-col gap-1">
                  <span className="text-xs font-bold text-risk-med flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4" />
                    What to look for:
                  </span>
                  <p className="text-xs text-ink-900 leading-relaxed font-medium">
                    {steps[activeStep].lookFor}
                  </p>
                </div>
              </div>

              <div className="pt-6 border-t border-line-200 flex items-center justify-between mt-6">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={activeStep === 0}
                  onClick={() => setActiveStep(activeStep - 1)}
                >
                  &larr; Previous Step
                </Button>
                {activeStep < steps.length - 1 ? (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setActiveStep(activeStep + 1)}
                  >
                    Next Step &rarr;
                  </Button>
                ) : (
                  <Link href={ROUTES.PATIENT_INTAKE}>
                    <Button variant="primary" size="sm" icon={<ArrowRight className="w-4 h-4" />}>
                      Take Free Assessment
                    </Button>
                  </Link>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Practical Photo Tips */}
        <Card variant="flat">
          <Card.Header>
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-brand-600" />
              <Card.Title>Tips for Capturing Clear Photos for the Screener</Card.Title>
            </div>
            <Card.Description>
              A blurry or dark photo will be rejected by our quality gate. Follow these simple tips:
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-ink-900">
              <div className="p-3.5 rounded-xl bg-surface-0 border border-line-200 flex flex-col gap-1.5">
                <Lightbulb className="w-4 h-4 text-brand-600" />
                <strong className="text-ink-900">Bright, Direct Lighting:</strong>
                <span className="text-ink-600">
                  Ask someone to shine a phone torch directly into the mouth while you take the photo.
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-surface-0 border border-line-200 flex flex-col gap-1.5">
                <Camera className="w-4 h-4 text-brand-600" />
                <strong className="text-ink-900">Steady Focus:</strong>
                <span className="text-ink-600">
                  Rest your hand on your cheek or jaw to prevent hand tremor and camera motion blur.
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-surface-0 border border-line-200 flex flex-col gap-1.5">
                <Eye className="w-4 h-4 text-brand-600" />
                <strong className="text-ink-900">Frame the Lesion:</strong>
                <span className="text-ink-600">
                  Center the sore or patch with 1 cm of surrounding normal tissue visible for context.
                </span>
              </div>
            </div>
          </Card.Content>
        </Card>
      </div>
    </AppShell>
  );
}
