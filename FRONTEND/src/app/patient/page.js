"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Heart,
  ShieldCheck,
  ShieldAlert,
  ClipboardList,
  Camera,
  Activity,
  ArrowRight,
  FolderOpen,
  PlusCircle,
  AlertOctagon,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { EmergencyBanner } from "@/components/ui/EmergencyBanner";
import { DisclaimerBanner } from "@/components/ui/DisclaimerBanner";
import { ROUTES } from "@/config/routes";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { withdrawConsent } from "@/lib/api/consent";
import { getQuitProgress } from "@/lib/api/quit";

export default function PatientHomePage() {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [hasConsent, setHasConsent] = useState(false);
  const [activeConsentId, setActiveConsentId] = useState(null);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [quitData, setQuitData] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedConsentId = localStorage.getItem("nirmay_active_consent_id");
      if (storedConsentId) {
        setHasConsent(true);
        setActiveConsentId(storedConsentId);
      }
    }

    async function fetchQuit() {
      try {
        const q = await getQuitProgress();
        setQuitData(q);
      } catch {
        // Ignore
      }
    }
    fetchQuit();
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
      addToast("Consent withdrawn. Active cases flagged for deletion and photos purged.", "info", 5000);
    } catch (err) {
      addToast(err.message || "Failed to withdraw consent.", "error");
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-12 max-w-5xl mx-auto">
      <PageHeader
        title={`Welcome, ${user?.full_name || user?.email || "Patient"}`}
        description="Your confidential oral health screening, risk monitoring, and specialist referral portal."
        badge={
          hasConsent ? (
            <Badge variant="risk-low" icon={<ShieldCheck className="w-3.5 h-3.5" />}>
              Consent Active
            </Badge>
          ) : (
            <Badge variant="risk-med" icon={<ShieldAlert className="w-3.5 h-3.5" />}>
              Consent Pending
            </Badge>
          )
        }
        actions={
          <div className="flex items-center gap-2">
            {hasConsent && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowWithdrawModal(true)}
                className="text-xs text-ink-600 hover:text-emergency"
              >
                Withdraw Consent
              </Button>
            )}
            <Link href={hasConsent ? "/patient/intake" : "/patient/consent"}>
              <Button
                variant="primary"
                size="sm"
                icon={<PlusCircle className="w-4 h-4" />}
              >
                {hasConsent ? "New Screening" : "Grant Consent"}
              </Button>
            </Link>
          </div>
        }
      />

      <EmergencyBanner message="Emergency care is available 24/7. Airway obstruction or severe bleeding requires immediate medical attention." />

      {/* Primary Workflow Journey Card */}
      <Card variant="elevated" className="border-brand-600/30 overflow-hidden">
        <div className="bg-gradient-to-r from-brand-600 to-brand-700 p-6 text-surface-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wider font-semibold text-brand-100">
              Guided 3-Step Evaluation
            </span>
            <h2 className="text-xl sm:text-2xl font-bold">Start Your Oral Cavity Health Check</h2>
            <p className="text-xs sm:text-sm text-brand-100 max-w-xl">
              Takes approximately 3 minutes: health habit intake, symptom red flags, and automated photo screening.
            </p>
          </div>
          <Link href={hasConsent ? "/patient/intake" : "/patient/consent"}>
            <Button
              variant="secondary"
              size="lg"
              className="bg-surface-0 text-brand-700 hover:bg-surface-50 font-bold whitespace-nowrap shadow-md"
              icon={<ArrowRight className="w-4 h-4 text-brand-700" />}
              iconPosition="right"
            >
              {hasConsent ? "Begin 2-Minute Intake" : "Informed Consent & Start"}
            </Button>
          </Link>
        </div>

        <Card.Content className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-line-200 bg-surface-50 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                1
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xs text-ink-900">Health Intake</span>
                <span className="text-[11px] text-ink-600">Exposure habits, tobacco &amp; paan history</span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-line-200 bg-surface-50 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                2
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xs text-ink-900">Symptom Duration</span>
                <span className="text-[11px] text-ink-600">Ulcer persistence &gt; 3 weeks &amp; red flags</span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-line-200 bg-surface-50 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                3
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xs text-ink-900">Photo Screener</span>
                <span className="text-[11px] text-ink-600">Quality gate &amp; Grad-CAM focus overlay</span>
              </div>
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* Supporting Quick Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quit Tobacco Tracker Widget */}
        <Card variant="interactive" className="p-6 flex flex-col justify-between">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-brand-50 text-emergency flex items-center justify-center">
                <Heart className="w-5 h-5" />
              </div>
              <Badge variant="risk-low">Wellness Tracker</Badge>
            </div>
            <h3 className="text-base font-bold text-ink-900">Quit Tobacco &amp; Mucosal Recovery</h3>
            <p className="text-xs text-ink-600 leading-relaxed">
              Track smoke-free streak days, money saved, and mucosal tissue healing milestones.
            </p>
            {quitData && quitData.set_up && (
              <div className="p-3 rounded-lg bg-surface-50 border border-line-200 flex items-center justify-between text-xs">
                <span>Streak: <strong>{quitData.streak_days} Days</strong></span>
                <span>Money Saved: <strong className="text-risk-low">₹{quitData.money_saved}</strong></span>
              </div>
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-line-200">
            <Link href="/patient/quit">
              <Button variant="outline" size="sm" className="w-full">
                Open Quit Tracker &rarr;
              </Button>
            </Link>
          </div>
        </Card>

        {/* Screening Cases History Widget */}
        <Card variant="interactive" className="p-6 flex flex-col justify-between">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                <FolderOpen className="w-5 h-5" />
              </div>
              <Badge variant="brand">Case History</Badge>
            </div>
            <h3 className="text-base font-bold text-ink-900">My Clinical Handoff Records</h3>
            <p className="text-xs text-ink-600 leading-relaxed">
              View your past screening assessments, rule reasons, and doctor review status.
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-line-200">
            <Link href="/patient/cases">
              <Button variant="outline" size="sm" className="w-full">
                View Past Cases &rarr;
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      <DisclaimerBanner variant="subtle" />

      {/* Consent Withdrawal Confirmation Modal */}
      <Modal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        title="Withdraw Screening Consent?"
        description="This will permanently delete your active screening session and remove retained photos."
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowWithdrawModal(false)}>
              Keep Consent Active
            </Button>
            <Button
              variant="danger"
              isLoading={isWithdrawing}
              onClick={handleWithdrawConsent}
            >
              Withdraw &amp; Purge Data
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-600 leading-relaxed">
          In accordance with healthcare privacy requirements, withdrawing consent immediately stops
          any in-progress screening triage, marks your cases for deletion, and purges all uploaded
          screening photographs. You can grant consent again at any time.
        </p>
      </Modal>
    </div>
  );
}
