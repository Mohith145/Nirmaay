"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Heart,
  ShieldCheck,
  ShieldAlert,
  ClipboardList,
  Activity,
  ArrowRight,
  FolderOpen,
  Calendar,
  User,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Info,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { UrgencyBadge } from "@/components/ui/UrgencyBadge";
import { ReasonsList } from "@/components/ui/ReasonsList";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { EmergencyBanner } from "@/components/ui/EmergencyBanner";
import { DisclaimerBanner } from "@/components/ui/DisclaimerBanner";
import { ROUTES } from "@/config/routes";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useI18n } from "@/context/I18nContext";
import { withdrawConsent } from "@/lib/api/consent";
import { listCases } from "@/lib/api/cases";
import { getQuitProgress } from "@/lib/api/quit";

export default function PatientHomePage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const { t } = useI18n();

  const [cases, setCases] = useState([]);
  const [isLoadingCases, setIsLoadingCases] = useState(true);
  const [hasConsent, setHasConsent] = useState(true);
  const [activeConsentId, setActiveConsentId] = useState(null);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [quitData, setQuitData] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedConsentId = localStorage.getItem("nirmay_active_consent_id");
      if (storedConsentId) {
        setActiveConsentId(storedConsentId);
      }
    }

    async function fetchData() {
      setIsLoadingCases(true);
      try {
        const loadedCases = await listCases();
        setCases(loadedCases || []);
      } catch (err) {
        console.warn("Could not load patient cases:", err.message);
        setCases([]);
      } finally {
        setIsLoadingCases(false);
      }

      try {
        const q = await getQuitProgress();
        setQuitData(q);
      } catch {
        // Ignore
      }
    }

    fetchData();
  }, []);

  const handleWithdrawConsent = async () => {
    setIsWithdrawing(true);
    try {
      if (activeConsentId) {
        await withdrawConsent(activeConsentId);
      }
      if (typeof window !== "undefined") {
        localStorage.removeItem("nirmay_active_consent_id");
      }
      setHasConsent(false);
      setActiveConsentId(null);
      setShowWithdrawModal(false);
      addToast(t("Consent withdrawn. Active cases flagged for deletion and photos purged."), "info", 5000);
      setCases([]);
    } catch (err) {
      addToast(err.message || t("Failed to withdraw consent."), "error");
    } finally {
      setIsWithdrawing(false);
    }
  };

  const latestCase = cases.length > 0 ? cases[0] : null;

  return (
    <div className="flex flex-col gap-6 pb-12 max-w-5xl mx-auto">
      <PageHeader
        title={`${t("Welcome,")} ${user?.full_name || user?.email || t("Patient")}`}
        description={t("Confidential patient portal to view clinical screening records, doctor reviews, and health advice.")}
        badge={
          hasConsent ? (
            <Badge variant="risk-low" icon={<ShieldCheck className="w-3.5 h-3.5" />}>
              {t("Consent Active")}
            </Badge>
          ) : (
            <Badge variant="risk-med" icon={<ShieldAlert className="w-3.5 h-3.5" />}>
              {t("Consent Withdrawn")}
            </Badge>
          )
        }
        actions={
          hasConsent && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowWithdrawModal(true)}
              className="text-xs text-ink-600 hover:text-emergency"
            >
              {t("Withdraw Consent")}
            </Button>
          )
        }
      />

      <DisclaimerBanner variant="subtle" />

      {/* Patient Profile & Identification Summary Card */}
      <Card variant="flat" className="p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-lg">
              <User className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-brand-700 uppercase tracking-wider">
                {t("Patient Record")}
              </span>
              <h2 className="text-base sm:text-lg font-bold text-ink-900">
                {user?.full_name || t("Patient")}
              </h2>
              <div className="flex items-center gap-2 text-xs text-ink-600 flex-wrap">
                <span>{t("Patient ID:")} <strong className="text-ink-900">#{user?.id}</strong></span>
                {user?.camp_token && (
                  <span>&middot; {t("Camp Token:")} <strong className="text-ink-900">#{user.camp_token}</strong></span>
                )}
                {user?.age && (
                  <span>&middot; {t("Age:")} <strong className="text-ink-900">{user.age} yrs</strong></span>
                )}
                <span>&middot; {user?.email}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" size="md">
              {t("Health-Worker Managed")}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Primary Screening Status & Results View */}
      {isLoadingCases ? (
        <Card variant="default">
          <Card.Content className="py-16 flex flex-col items-center justify-center gap-3">
            <Spinner size="lg" />
            <span className="text-xs text-ink-600">{t("Loading your clinical screening records...")}</span>
          </Card.Content>
        </Card>
      ) : latestCase ? (
        /* Display Latest Screening Result */
        <Card variant="elevated" className="border-brand-600/30 overflow-hidden">
          <div className="bg-brand-50 border-b border-brand-100 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-brand-600 text-surface-0 flex items-center justify-center font-bold text-lg shadow-sm">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-700">
                  {t("Latest Clinical Screening Outcome")}
                </span>
                <h3 className="text-xl font-extrabold text-ink-900">
                  {t("Screening Assessment #")}{latestCase.case_id}
                </h3>
                <span className="text-xs text-ink-600">
                  {t("Conducted by health worker")} &middot; {latestCase.status === "reviewed" ? t("Clinician Review Completed") : t("Pending Specialist Review")}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <RiskBadge risk={latestCase.risk?.level} size="lg" />
              {latestCase.symptoms && (
                <UrgencyBadge urgency={latestCase.symptoms.urgency} emergency={latestCase.emergency} size="lg" />
              )}
            </div>
          </div>

          <Card.Content className="space-y-6 p-6">
            {/* Urgent Alert if emergency */}
            {latestCase.emergency && (
              <div className="p-4 rounded-xl bg-emergency-bg border-2 border-emergency text-emergency flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 flex-shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1 text-xs sm:text-sm">
                  <strong className="font-bold">{t("EMERGENCY ESCALATION FLAGGED")}</strong>
                  <p>{latestCase.symptoms?.action || t("Immediate emergency hospital evaluation recommended.")}</p>
                </div>
              </div>
            )}

            {/* Doctor Review Status */}
            {latestCase.review ? (
              <div className="p-4 rounded-xl bg-surface-50 border border-brand-200 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-risk-low" />
                    {t("Oncology Specialist Review:")} {latestCase.review.decision === "confirm" ? t("Confirmed Assessment") : t("Overridden Assessment")}
                  </span>
                  <Badge variant="brand" size="sm">{t("Reviewed")}</Badge>
                </div>
                {latestCase.review.reason && (
                  <p className="text-xs text-ink-600 pl-5 italic">
                    &ldquo;{latestCase.review.reason}&rdquo;
                  </p>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-surface-50 border border-line-200 flex items-center justify-between text-xs text-ink-600">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-brand-600" />
                  <span>{t("Queued for oncology specialist review and triage confirmation.")}</span>
                </div>
                <Badge variant="outline" size="sm">{t("Queue Pending")}</Badge>
              </div>
            )}

            {/* Contributing Risk Factors */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-600">
                {t("Recorded Risk Factors & Habits")}
              </span>
              <ReasonsList reasons={latestCase.risk?.reasons} />
            </div>

            {/* Clinical Recommendation */}
            <div className="p-4 rounded-xl bg-surface-50 border border-line-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs sm:text-sm">
              <div>
                <span className="text-ink-600 block text-xs">{t("Recommended Action")}</span>
                <span className="font-bold text-ink-900 text-base">
                  {latestCase.recommended_test?.test || "Clinical Oral Examination"}
                </span>
              </div>
              <div className="sm:text-right">
                <span className="text-ink-600 block text-xs">{t("Target Referral Timeframe")}</span>
                <span className="font-semibold text-brand-700">
                  {latestCase.recommended_test?.timeframe || "Within 2-4 weeks"}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-line-200 flex items-center justify-between">
              <Link href="/patient/cases">
                <Button variant="outline" size="sm">
                  {t("View All Previous Records")}
                </Button>
              </Link>
              <Link href={`/patient/results?case_id=${latestCase.case_id}`}>
                <Button variant="primary" size="sm" icon={<ArrowRight className="w-4 h-4" />} iconPosition="right">
                  {t("View Full Clinical Handoff")}
                </Button>
              </Link>
            </div>
          </Card.Content>
        </Card>
      ) : (
        /* Empty State when no screening has been performed yet */
        <Card variant="default">
          <Card.Content className="py-16">
            <EmptyState
              title={t("No Screening Results Available Yet")}
              description={t("No screening results available yet. Your health worker will conduct your screening and your results will appear here once submitted.")}
              icon={<FolderOpen className="w-10 h-10 text-brand-600" />}
            />
          </Card.Content>
        </Card>
      )}

      {/* Supplementary Widgets: Quit Tobacco & Education */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quit Tobacco Tracker Widget */}
        <Card variant="interactive" className="p-6 flex flex-col justify-between">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-brand-50 text-emergency flex items-center justify-center">
                <Heart className="w-5 h-5" />
              </div>
              <Badge variant="risk-low">{t("Wellness Support")}</Badge>
            </div>
            <h3 className="text-base font-bold text-ink-900">{t("Quit Tobacco & Mucosal Recovery")}</h3>
            <p className="text-xs text-ink-600 leading-relaxed">
              {t("Track smoke-free streak days, money saved, and mucosal tissue healing milestones.")}
            </p>
            {quitData && quitData.set_up && (
              <div className="p-3 rounded-lg bg-surface-50 border border-line-200 flex items-center justify-between text-xs">
                <span>{t("Streak:")} <strong>{quitData.streak_days} {t("Days")}</strong></span>
                <span>{t("Money Saved:")} <strong className="text-risk-low">₹{quitData.money_saved}</strong></span>
              </div>
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-line-200">
            <Link href="/patient/quit">
              <Button variant="outline" size="sm" className="w-full">
                {t("Open Quit Tracker →")}
              </Button>
            </Link>
          </div>
        </Card>

        {/* Self-Exam Guide Widget */}
        <Card variant="interactive" className="p-6 flex flex-col justify-between">
          <div className="flex flex-col gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-ink-900">{t("Step-by-Step Self-Exam Habit")}</h3>
            <p className="text-xs text-ink-600 leading-relaxed">
              {t("Learn how to inspect the 5 critical anatomical zones of your mouth once every month between health worker checkups.")}
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-line-200">
            <Link href={ROUTES.SELF_EXAM}>
              <Button variant="outline" size="sm" className="w-full">
                {t("View Self-Exam Guide →")}
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* Consent Withdrawal Confirmation Modal */}
      <Modal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        title={t("Withdraw Screening Consent?")}
        description={t("This will remove your active screening record and queued specialist consultation.")}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowWithdrawModal(false)}>
              {t("Keep Consent Active")}
            </Button>
            <Button
              variant="danger"
              isLoading={isWithdrawing}
              onClick={handleWithdrawConsent}
            >
              {t("Withdraw & Purge Data")}
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-600 leading-relaxed">
          {t("In accordance with healthcare privacy requirements, withdrawing consent stops any in-progress screening review, marks your cases for deletion, and purges all uploaded screening photographs. You can grant consent again at your next camp.")}
        </p>
      </Modal>
    </div>
  );
}
