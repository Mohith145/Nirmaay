"use client";

import React from "react";
import Link from "next/link";
import {
  Activity,
  ShieldCheck,
  ClipboardList,
  AlertCircle,
  Camera,
  UserCheck,
  ArrowRight,
  PhoneCall,
  Sparkles,
  HeartHandshake,
  Users,
  Stethoscope,
  CheckCircle2,
  Clock3,
} from "lucide-react";
import { AppShell } from "@/components/ui/AppShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DisclaimerBanner } from "@/components/ui/DisclaimerBanner";
import { EmergencyBanner } from "@/components/ui/EmergencyBanner";
import { ROUTES } from "@/config/routes";
import { useAuth } from "@/context/AuthContext";
import { ROLE_HOME_ROUTES } from "@/config/roles";

export default function LandingPage() {
  const { user, isAuthenticated } = useAuth();

  return (
    <AppShell showSidebar={false}>
      <div className="flex flex-col gap-12 sm:gap-16 pb-12">
        {/* Top Emergency Notice */}
        <EmergencyBanner message="Heavy bleeding, inability to swallow, or airway blockage requires emergency care." />

        {/* Hero Section */}
        <section className="relative isolate overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-50 via-surface-0 to-surface-50 border border-brand-100 p-6 sm:p-10 lg:p-14 shadow-lg">
          <div className="pointer-events-none absolute -right-24 -top-28 -z-10 h-80 w-80 rounded-full bg-brand-100/70 blur-3xl" />
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)] lg:items-center">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-2">
              <Badge variant="brand" size="md" icon={<Sparkles className="w-3.5 h-3.5 text-brand-600" />}>
                Clinical Triage Aid
              </Badge>
              <Badge variant="outline" size="md">
                Research Prototype
              </Badge>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-ink-900 tracking-tight leading-tight">
              A clearer path from early concern to clinical review
            </h1>

            <p className="text-base sm:text-lg text-ink-600 leading-relaxed max-w-2xl">
              Start with consent, answer a few health questions, and get clear next steps. If a case
              needs attention, a clinician reviews it and helps plan what happens next.
            </p>

            {/* Disclaimer */}
            <DisclaimerBanner variant="alert" />

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              {isAuthenticated && user ? (
                <Link href={ROLE_HOME_ROUTES[user.role] || "/patient"}>
                  <Button
                    variant="primary"
                    size="lg"
                    icon={<ArrowRight className="w-4 h-4" />}
                    iconPosition="right"
                  >
                    Go to Your Workspace
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href={ROUTES.REGISTER}>
                    <Button
                      variant="primary"
                      size="lg"
                      icon={<ArrowRight className="w-4 h-4" />}
                      iconPosition="right"
                    >
                      Start a screening
                    </Button>
                  </Link>
                  <Link href={ROUTES.LOGIN}>
                    <Button variant="secondary" size="lg">
                      Sign in
                    </Button>
                  </Link>
                </>
              )}
              <Link href={ROUTES.SELF_EXAM}>
                <Button variant="outline" size="lg">
                    Learn how to check
                </Button>
              </Link>
            </div>
          </div>

          <aside className="rounded-3xl border border-line-200 bg-surface-0/90 p-5 shadow-xl backdrop-blur-sm sm:p-6" aria-label="What to expect">
            <div className="flex items-center justify-between gap-3 border-b border-line-200 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">What to expect</p>
                <h2 className="mt-1 text-lg font-bold text-ink-900">A guided, human-led process</h2>
              </div>
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                <Activity className="h-5 w-5" aria-hidden="true" />
              </div>
            </div>
            <ol className="mt-2 divide-y divide-line-200">
              <li className="flex gap-3 py-4">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-50 text-sm font-bold text-brand-700">1</span>
                <div><p className="text-sm font-semibold text-ink-900">You stay in control</p><p className="mt-0.5 text-xs leading-relaxed text-ink-600">Review the consent and choose your language before you begin.</p></div>
                <CheckCircle2 className="ml-auto mt-1 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
              </li>
              <li className="flex gap-3 py-4">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-50 text-sm font-bold text-brand-700">2</span>
                <div><p className="text-sm font-semibold text-ink-900">Share what you’re noticing</p><p className="mt-0.5 text-xs leading-relaxed text-ink-600">Answer a short set of questions; skip anything you’re unsure about.</p></div>
                <Clock3 className="ml-auto mt-1 h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
              </li>
              <li className="flex gap-3 py-4">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-50 text-sm font-bold text-brand-700">3</span>
                <div><p className="text-sm font-semibold text-ink-900">A clinician reviews flagged cases</p><p className="mt-0.5 text-xs leading-relaxed text-ink-600">The screening supports a conversation; it does not make a diagnosis.</p></div>
                <ShieldCheck className="ml-auto mt-1 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
              </li>
            </ol>
            <div className="mt-2 rounded-xl bg-surface-50 px-4 py-3 text-xs leading-relaxed text-ink-600">
              <span className="font-semibold text-ink-900">Need urgent help?</span> Heavy bleeding or trouble breathing or swallowing needs emergency care now.
            </div>
          </aside>
          </div>
        </section>

        {/* 4-Step Journey Explainer */}
        <section className="flex flex-col gap-6">
          <div className="text-center max-w-2xl mx-auto flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
              How Nirmay Works
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-ink-900">
              One Continuous Patient-to-Doctor Workflow
            </h2>
            <p className="text-sm text-ink-600">
              Designed for transparency: every assessment cites contributing factors and requires human clinician review.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Step 1 */}
            <Card variant="default" className="flex flex-col">
              <Card.Header>
                <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-base mb-2">
                  1
                </div>
                <Card.Title>Consent & Intake</Card.Title>
                <Card.Description>
                  Informed consent in your language, followed by a 2-minute lifestyle and tobacco exposure assessment.
                </Card.Description>
              </Card.Header>
              <Card.Content className="mt-auto pt-0 text-xs text-ink-600">
                <span className="font-semibold text-ink-900 block mb-1">Key Checks:</span>
                Tobacco (smoking & smokeless), betel quid, duration, and personal history.
              </Card.Content>
            </Card>

            {/* Step 2 */}
            <Card variant="default" className="flex flex-col">
              <Card.Header>
                <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-base mb-2">
                  2
                </div>
                <Card.Title>Symptoms & Red Flags</Card.Title>
                <Card.Description>
                  Tracks ulcer duration (an ulcer &gt; 3 weeks is a key signal) and checks immediate emergency red flags.
                </Card.Description>
              </Card.Header>
              <Card.Content className="mt-auto pt-0 text-xs text-ink-600">
                <span className="font-semibold text-ink-900 block mb-1">Emergency Rule:</span>
                Severe bleeding or swallowing failure triggers immediate hospital escalation.
              </Card.Content>
            </Card>

            {/* Step 3 */}
            <Card variant="default" className="flex flex-col">
              <Card.Header>
                <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-base mb-2">
                  3
                </div>
                <Card.Title>Photo Quality Gate</Card.Title>
                <Card.Description>
                  Checks blur, brightness, and mouth framing before running image screening with Grad-CAM focus overlay.
                </Card.Description>
              </Card.Header>
              <Card.Content className="mt-auto pt-0 text-xs text-ink-600">
                <span className="font-semibold text-ink-900 block mb-1">Safe Fallback:</span>
                Blurry photos are politely refused with practical retake guidance.
              </Card.Content>
            </Card>

            {/* Step 4 */}
            <Card variant="default" className="flex flex-col">
              <Card.Header>
                <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-base mb-2">
                  4
                </div>
                <Card.Title>Clinician Review</Card.Title>
                <Card.Description>
                  Flagged cases land in the doctor queue with a structured handoff bundle, reasons list, and video consult.
                </Card.Description>
              </Card.Header>
              <Card.Content className="mt-auto pt-0 text-xs text-ink-600">
                <span className="font-semibold text-ink-900 block mb-1">Doctor In Control:</span>
                Clinician confirms or overrides with a documented clinical reason.
              </Card.Content>
            </Card>
          </div>
        </section>

        {/* Role-Based Portals */}
        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl sm:text-2xl font-bold text-ink-900">
              Choose Your Workspace
            </h2>
            <p className="text-xs sm:text-sm text-ink-600">
              Access role-specific interfaces tailored for field health workers, patients, and clinical teams.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Patient Portal */}
            <Card variant="interactive" className="p-6 flex flex-col justify-between">
              <div className="flex flex-col gap-3">
                <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                  <HeartHandshake className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-ink-900">For Patients</h3>
                <p className="text-xs sm:text-sm text-ink-600 leading-relaxed">
                  Perform guided self-assessment, check lesion symptoms, upload photos, learn mouth self-exams, and track tobacco quitting.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-line-200">
                <Link href={ROUTES.PATIENT_HOME}>
                  <Button variant="outline" size="sm" className="w-full">
                    Enter Patient Portal &rarr;
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Health Worker Camp Mode */}
            <Card variant="interactive" className="p-6 flex flex-col justify-between">
              <div className="flex flex-col gap-3">
                <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-ink-900">For Health Workers</h3>
                <p className="text-xs sm:text-sm text-ink-600 leading-relaxed">
                  Screen rural camp participants rapidly, assist with consent and intake, generate QR health cards, and route high-risk cases.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-line-200">
                <Link href={ROUTES.HEALTH_WORKER_HOME}>
                  <Button variant="outline" size="sm" className="w-full">
                    Open Camp Mode &rarr;
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Doctor Workspace */}
            <Card variant="interactive" className="p-6 flex flex-col justify-between">
              <div className="flex flex-col gap-3">
                <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-ink-900">For Clinicians</h3>
                <p className="text-xs sm:text-sm text-ink-600 leading-relaxed">
                  Review triage queues ordered by urgency and wait time, inspect Grad-CAM heatmaps, record clinical reviews, and host video calls.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-line-200">
                <Link href={ROUTES.DOCTOR_HOME}>
                  <Button variant="outline" size="sm" className="w-full">
                    Doctor Workspace &rarr;
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </section>

        {/* Trust & Transparency Highlight */}
        <section className="rounded-xl bg-surface-0 border border-line-200 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-brand-50 text-brand-600 flex-shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-base font-bold text-ink-900">
                Model Card & Clinical Safety Disclosures
              </h3>
              <p className="text-xs sm:text-sm text-ink-600 max-w-xl">
                We believe in full algorithmic transparency. Review our model card covering
                intended scope, dataset representation, lighting/skin-tone limitations, and honest
                placeholder disclosures.
              </p>
            </div>
          </div>
          <Link href={ROUTES.MODEL_CARD}>
            <Button variant="secondary" size="md">
              View Model Card
            </Button>
          </Link>
        </section>
      </div>
    </AppShell>
  );
}
