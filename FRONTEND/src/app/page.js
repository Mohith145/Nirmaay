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
  Info,
} from "lucide-react";
import { AppShell } from "@/components/ui/AppShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DisclaimerBanner } from "@/components/ui/DisclaimerBanner";
import { EmergencyBanner } from "@/components/ui/EmergencyBanner";
import { ROUTES } from "@/config/routes";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { ROLE_HOME_ROUTES } from "@/config/roles";

export default function LandingPage() {
  const { user, isAuthenticated } = useAuth();
  const { t } = useI18n();

  return (
    <AppShell showSidebar={false}>
      <div className="flex flex-col gap-12 sm:gap-16 pb-12">
        {/* Top Emergency Notice */}
        <EmergencyBanner message={t("emergency.banner_message", "Heavy bleeding, inability to swallow, or airway blockage requires emergency care.")} />

        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-50 via-surface-0 to-surface-50 border border-brand-100 p-8 sm:p-12 lg:p-16 shadow-xs">
          <div className="max-w-3xl flex flex-col gap-6">
            <div className="flex items-center gap-2">
              <Badge variant="brand" size="md" icon={<Sparkles className="w-3.5 h-3.5 text-brand-600" />}>
                {t("landing.badge_triage", "Clinical Triage Aid")}
              </Badge>
              <Badge variant="outline" size="md">
                {t("landing.badge_research", "Research Prototype")}
              </Badge>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-ink-900 tracking-tight leading-tight">
              {t("landing.hero_title", "Early Oral Cancer Screening & Clinical Handoff")}
            </h1>

            <p className="text-base sm:text-lg text-ink-600 leading-relaxed max-w-2xl">
              {t("landing.hero_desc", "Nirmay connects community health camps, rural clinics, and patients with oncology specialists through rules-based risk triage, oral photo quality screening, and structured clinician review.")}
            </p>

            {/* Disclaimer */}
            <DisclaimerBanner variant="alert" />

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              {isAuthenticated && user ? (
                <Link href={ROLE_HOME_ROUTES[user.role] || "/patient"}>
                  <Button
                    variant="primary"
                    size="lg"
                    icon={<ArrowRight className="w-4 h-4" />}
                    iconPosition="right"
                  >
                    {t("landing.btn_workspace", "Go to Your Workspace")}
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
                      {t("landing.btn_start_patient", "Start Patient Screening")}
                    </Button>
                  </Link>
                  <Link href={ROUTES.LOGIN}>
                    <Button variant="secondary" size="lg">
                      {t("landing.btn_signin_workspace", "Sign In to Workspace")}
                    </Button>
                  </Link>
                </>
              )}
              <Link href={ROUTES.SELF_EXAM}>
                <Button variant="outline" size="lg">
                  {t("landing.btn_learn_self_exam", "Learn Self-Exam")}
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* 4-Step Journey Explainer */}
        <section className="flex flex-col gap-6">
          <div className="text-center max-w-2xl mx-auto flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
              {t("landing.how_it_works_badge", "How Nirmay Works")}
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-ink-900">
              {t("landing.how_it_works_title", "One Continuous Patient-to-Doctor Workflow")}
            </h2>
            <p className="text-sm text-ink-600">
              {t("landing.how_it_works_desc", "Designed for transparency: every assessment cites contributing factors and requires human clinician review.")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Step 1 */}
            <Card variant="default" className="flex flex-col">
              <Card.Header>
                <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-base mb-2">
                  1
                </div>
                <Card.Title>{t("landing.step1_title", "Consent & Intake")}</Card.Title>
                <Card.Description>
                  {t("landing.step1_desc", "Informed consent in your language, followed by a 2-minute lifestyle and tobacco exposure assessment.")}
                </Card.Description>
              </Card.Header>
              <Card.Content className="mt-auto pt-0 text-xs text-ink-600">
                <span className="font-semibold text-ink-900 block mb-1">
                  {t("common.key_checks", "Key Checks:")}
                </span>
                {t("landing.step1_checks", "Tobacco (smoking & smokeless), betel quid, duration, and personal history.")}
              </Card.Content>
            </Card>

            {/* Step 2 */}
            <Card variant="default" className="flex flex-col">
              <Card.Header>
                <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-base mb-2">
                  2
                </div>
                <Card.Title>{t("landing.step2_title", "Symptoms & Red Flags")}</Card.Title>
                <Card.Description>
                  {t("landing.step2_desc", "Tracks ulcer duration (an ulcer > 3 weeks is a key signal) and checks immediate emergency red flags.")}
                </Card.Description>
              </Card.Header>
              <Card.Content className="mt-auto pt-0 text-xs text-ink-600">
                <span className="font-semibold text-ink-900 block mb-1">
                  {t("common.emergency_rule", "Emergency Rule:")}
                </span>
                {t("landing.step2_checks", "Severe bleeding or swallowing failure triggers immediate hospital escalation.")}
              </Card.Content>
            </Card>

            {/* Step 3 */}
            <Card variant="default" className="flex flex-col">
              <Card.Header>
                <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-base mb-2">
                  3
                </div>
                <Card.Title>{t("landing.step3_title", "Photo Quality Gate")}</Card.Title>
                <Card.Description>
                  {t("landing.step3_desc", "Checks blur, brightness, and mouth framing before running image screening with Grad-CAM focus overlay.")}
                </Card.Description>
              </Card.Header>
              <Card.Content className="mt-auto pt-0 text-xs text-ink-600">
                <span className="font-semibold text-ink-900 block mb-1">
                  {t("common.safe_fallback", "Safe Fallback:")}
                </span>
                {t("landing.step3_checks", "Blurry photos are politely refused with practical retake guidance.")}
              </Card.Content>
            </Card>

            {/* Step 4 */}
            <Card variant="default" className="flex flex-col">
              <Card.Header>
                <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-base mb-2">
                  4
                </div>
                <Card.Title>{t("landing.step4_title", "Clinician Review")}</Card.Title>
                <Card.Description>
                  {t("landing.step4_desc", "Flagged cases land in the doctor queue with a structured handoff bundle, reasons list, and video consult.")}
                </Card.Description>
              </Card.Header>
              <Card.Content className="mt-auto pt-0 text-xs text-ink-600">
                <span className="font-semibold text-ink-900 block mb-1">
                  {t("common.doctor_in_control", "Doctor In Control:")}
                </span>
                {t("landing.step4_checks", "Clinician confirms or overrides with a documented clinical reason.")}
              </Card.Content>
            </Card>
          </div>
        </section>

        {/* Role-Based Portals */}
        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl sm:text-2xl font-bold text-ink-900">
              {t("landing.workspaces_title", "Choose Your Workspace")}
            </h2>
            <p className="text-xs sm:text-sm text-ink-600">
              {t("landing.workspaces_desc", "Access role-specific interfaces tailored for field health workers, patients, and clinical teams.")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Patient Portal */}
            <Card variant="interactive" className="p-6 flex flex-col justify-between">
              <div className="flex flex-col gap-3">
                <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                  <HeartHandshake className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-ink-900">
                  {t("landing.ws_patient_title", "For Patients")}
                </h3>
                <p className="text-xs sm:text-sm text-ink-600 leading-relaxed">
                  {t("landing.ws_patient_desc", "Perform guided self-assessment, check lesion symptoms, upload photos, learn mouth self-exams, and track tobacco quitting.")}
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-line-200">
                <Link href={ROUTES.PATIENT_HOME}>
                  <Button variant="outline" size="sm" className="w-full">
                    {t("landing.ws_patient_btn", "Enter Patient Portal →")}
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
                <h3 className="text-lg font-bold text-ink-900">
                  {t("landing.ws_hw_title", "For Health Workers")}
                </h3>
                <p className="text-xs sm:text-sm text-ink-600 leading-relaxed">
                  {t("landing.ws_hw_desc", "Screen rural camp participants rapidly, assist with consent and intake, generate QR health cards, and route high-risk cases.")}
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-line-200">
                <Link href={ROUTES.HEALTH_WORKER_HOME}>
                  <Button variant="outline" size="sm" className="w-full">
                    {t("landing.ws_hw_btn", "Open Camp Mode →")}
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
                <h3 className="text-lg font-bold text-ink-900">
                  {t("landing.ws_doctor_title", "For Clinicians")}
                </h3>
                <p className="text-xs sm:text-sm text-ink-600 leading-relaxed">
                  {t("landing.ws_doctor_desc", "Review triage queues ordered by urgency and wait time, inspect Grad-CAM heatmaps, record clinical reviews, and host video calls.")}
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-line-200">
                <Link href={ROUTES.DOCTOR_HOME}>
                  <Button variant="outline" size="sm" className="w-full">
                    {t("landing.ws_doctor_btn", "Doctor Workspace →")}
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
                {t("landing.model_card_title", "Model Card & Clinical Safety Disclosures")}
              </h3>
              <p className="text-xs sm:text-sm text-ink-600 max-w-xl">
                {t("landing.model_card_desc", "We believe in full algorithmic transparency. Review our model card covering intended scope, dataset representation, lighting/skin-tone limitations, and honest placeholder disclosures.")}
              </p>
            </div>
          </div>
          <Link href={ROUTES.MODEL_CARD}>
            <Button variant="secondary" size="md">
              {t("landing.model_card_btn", "View Model Card")}
            </Button>
          </Link>
        </section>
      </div>
    </AppShell>
  );
}
