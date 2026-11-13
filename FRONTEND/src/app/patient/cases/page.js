"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FolderOpen, ArrowRight, ShieldCheck, HeartPulse } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { UrgencyBadge } from "@/components/ui/UrgencyBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { DisclaimerBanner } from "@/components/ui/DisclaimerBanner";
import { listCases } from "@/lib/api/cases";
import { useAuth } from "@/context/AuthContext";

export default function PatientCasesPage() {
  const { user } = useAuth();
  const [cases, setCases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadPatientCases() {
      setIsLoading(true);
      try {
        const result = await listCases();
        const caseList = Array.isArray(result) ? result : (result?.cases || []);
        setCases(caseList);
      } catch (err) {
        console.warn("Failed to load patient cases via listCases:", err);
        setCases([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadPatientCases();
  }, [user]);

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6 pb-12">
      <PageHeader
        title="My Screening History"
        description="View your past oral cancer screenings, risk assessments, and clinical recommendations conducted by your health worker."
        actions={
          <Link href="/patient">
            <Button variant="outline" size="sm">
              Back to My Dashboard
            </Button>
          </Link>
        }
      />

      <DisclaimerBanner variant="subtle" />

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Spinner size="lg" />
          <span className="text-xs text-ink-600 font-medium">Loading your screening records...</span>
        </div>
      ) : cases.length === 0 ? (
        <Card variant="default">
          <Card.Content>
            <EmptyState
              title="No Screening Results Available Yet"
              description="No screening results available yet. Your health worker will conduct your screening and your results will appear here once submitted."
              actionLabel="Return to Dashboard"
              onAction={() => (window.location.href = "/patient")}
              icon={<FolderOpen className="w-8 h-8 text-teal-600" />}
            />
          </Card.Content>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {cases.map((c) => (
            <Card
              key={c.case_id || c.id}
              variant="default"
              className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold flex-shrink-0">
                  #{c.case_id || c.id}
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-ink-900 text-sm">
                      Screening #{c.case_id || c.id}
                    </span>
                    <RiskBadge risk={c.risk?.risk_level || c.risk_level} size="sm" />
                    <UrgencyBadge
                      urgency={c.symptoms?.urgency || c.urgency || "routine"}
                      emergency={c.emergency}
                      size="sm"
                    />
                  </div>
                  <p className="text-xs text-ink-600 line-clamp-1 max-w-lg">
                    {c.summary_text || "Clinical assessment completed by authorized community health worker."}
                  </p>
                </div>
              </div>

              <Link href={`/patient/results?case_id=${c.case_id || c.id}`}>
                <Button
                  variant="outline"
                  size="sm"
                  icon={<ArrowRight className="w-3.5 h-3.5" />}
                  iconPosition="right"
                >
                  View Details
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
