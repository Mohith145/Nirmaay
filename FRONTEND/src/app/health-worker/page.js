"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  UserPlus,
  QrCode,
  ClipboardList,
  AlertTriangle,
  CheckCircle2,
  Activity,
  ArrowRight,
  Shield,
  Stethoscope,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { DisclaimerBanner } from "@/components/ui/DisclaimerBanner";
import { DemoBadge } from "@/components/ui/DemoBadge";
import { getCamp } from "@/lib/api/demo";
import { useAuth } from "@/context/AuthContext";

export default function HealthWorkerHomePage() {
  const { user } = useAuth();
  const [campData, setCampData] = useState(null);

  useEffect(() => {
    async function loadCampStats() {
      try {
        const data = await getCamp();
        setCampData(data);
      } catch {
        // Fallback
      }
    }
    loadCampStats();
  }, []);

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-12">
      <PageHeader
        title={`Camp Workspace: ${user?.full_name || "Health Worker"}`}
        description="Assisted patient registration, rapid screening camp triage, and doctor referral coordination."
        badge={<Badge variant="brand" icon={<Users className="w-3.5 h-3.5" />}>Camp Mode Active</Badge>}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/health-worker/intake">
              <Button variant="primary" size="sm" icon={<UserPlus className="w-4 h-4" />}>
                New Assisted Intake
              </Button>
            </Link>
            <Link href="/health-worker/camp">
              <Button variant="secondary" size="sm" icon={<QrCode className="w-4 h-4" />}>
                QR Health Cards
              </Button>
            </Link>
          </div>
        }
      />

      <DisclaimerBanner variant="subtle" />

      {/* Camp Operational Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Registered Attendees"
          value={campData?.registered ? String(campData.registered) : "48"}
          sublabel="Today's rural screening camp"
          icon={<Users className="w-5 h-5 text-brand-600" />}
          isDemo={true}
        />
        <StatCard
          label="Screened Participants"
          value={campData?.screened ? String(campData.screened) : "41"}
          sublabel="Completed intake & symptoms"
          icon={<CheckCircle2 className="w-5 h-5 text-risk-low" />}
          isDemo={true}
        />
        <StatCard
          label="Flagged for Specialist"
          value={campData?.referred ? String(campData.referred) : "5"}
          sublabel="Referred to oncologist queue"
          icon={<AlertTriangle className="w-5 h-5 text-risk-med" />}
          isDemo={true}
        />
      </div>

      {/* Main Action Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Assisted Intake Card */}
        <Card variant="interactive" className="p-6 flex flex-col justify-between">
          <div className="flex flex-col gap-3">
            <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <UserPlus className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-ink-900">Assisted Patient Intake</h3>
            <p className="text-xs sm:text-sm text-ink-600 leading-relaxed">
              Conduct rapid 2-minute oral cancer risk evaluations for rural community members who cannot
              readily navigate a smartphone independently.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-line-200">
            <Link href="/health-worker/intake">
              <Button variant="primary" size="md" className="w-full">
                Start Assisted Intake &rarr;
              </Button>
            </Link>
          </div>
        </Card>

        {/* QR Health Card & Camp View */}
        <Card variant="interactive" className="p-6 flex flex-col justify-between">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                <QrCode className="w-6 h-6" />
              </div>
              <DemoBadge label="demo data" />
            </div>
            <h3 className="text-lg font-bold text-ink-900">Camp Mode &amp; QR Health Cards</h3>
            <p className="text-xs sm:text-sm text-ink-600 leading-relaxed">
              Generate portable screening summary QR codes for camp attendees so they can carry their
              risk level and referral recommendation to district hospitals.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-line-200">
            <Link href="/health-worker/camp">
              <Button variant="secondary" size="md" className="w-full">
                Open Camp QR Cards &rarr;
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* Field Worker Guidelines */}
      <Card variant="flat">
        <Card.Header>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-brand-600" />
            <Card.Title>Camp Protocol: When to Urgently Escalate</Card.Title>
          </div>
        </Card.Header>
        <Card.Content className="text-xs text-ink-600 space-y-2">
          <p>
            &bull; <strong>Ulcers lasting longer than 3 weeks:</strong> Always tag as priority referral for clinical biopsy.
          </p>
          <p>
            &bull; <strong>Trismus (reduced mouth opening):</strong> Mark for immediate specialist evaluation of Oral Submucous Fibrosis (OSMF).
          </p>
          <p>
            &bull; <strong>Emergency Red Flags:</strong> Severe bleeding or swallowing blockage requires direct emergency transport to the nearest civil hospital.
          </p>
        </Card.Content>
      </Card>
    </div>
  );
}
