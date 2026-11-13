"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shield,
  UserCog,
  Users,
  Activity,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { DemoBadge } from "@/components/ui/DemoBadge";
import { DisclaimerBanner } from "@/components/ui/DisclaimerBanner";
import { Spinner } from "@/components/ui/Spinner";
import { ROUTES } from "@/config/routes";
import { getFunnel, getCamp, getHotspots } from "@/lib/api/demo";

export default function AdminDashboardPage() {
  const [funnel, setFunnel] = useState(null);
  const [camp, setCamp] = useState(null);
  const [hotspots, setHotspots] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [funnelData, campData, hotspotsData] = await Promise.allSettled([
        getFunnel(),
        getCamp(),
        getHotspots(),
      ]);

      if (funnelData.status === "fulfilled") setFunnel(funnelData.value);
      if (campData.status === "fulfilled") setCamp(campData.value);
      if (hotspotsData.status === "fulfilled") setHotspots(hotspotsData.value);
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Administrative & Operational Dashboard"
        description="Platform oversight, staff account administration, and operational metrics."
        badge={<Badge variant="brand" icon={<Shield className="w-3.5 h-3.5" />}>Admin Portal</Badge>}
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={loadData}
              icon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Refresh Data
            </Button>
            <Link href={ROUTES.ADMIN_STAFF}>
              <Button
                variant="primary"
                size="sm"
                icon={<UserCog className="w-4 h-4" />}
              >
                Provision Staff Account
              </Button>
            </Link>
          </div>
        }
      />

      <DisclaimerBanner variant="subtle" />

      {/* Quick Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Screened"
          value={camp?.registered ? String(camp.registered) : "48"}
          sublabel="Seeded screening participants"
          icon={<Users className="w-5 h-5" />}
          isDemo={true}
        />
        <StatCard
          label="Intakes Completed"
          value={camp?.screened ? String(camp.screened) : "41"}
          sublabel="85% completion rate"
          icon={<Activity className="w-5 h-5" />}
          isDemo={true}
        />
        <StatCard
          label="Referred to Doctor"
          value={camp?.referred ? String(camp.referred) : "5"}
          sublabel="Urgent & high risk cases"
          icon={<AlertTriangle className="w-5 h-5 text-risk-med" />}
          isDemo={true}
        />
        <StatCard
          label="Clinical Reviews Done"
          value={funnel?.stages ? String(funnel.stages[3]?.count || 21) : "21"}
          sublabel="Completed clinician reviews"
          icon={<CheckCircle2 className="w-5 h-5 text-risk-low" />}
          isDemo={true}
        />
      </div>

      {/* Management Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Staff Provisioning Card */}
        <Card variant="interactive" className="p-6 flex flex-col justify-between">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                <UserCog className="w-6 h-6" />
              </div>
              <Badge variant="brand">Privileged Route</Badge>
            </div>
            <h3 className="text-lg font-bold text-ink-900">Staff Account Provisioning</h3>
            <p className="text-xs sm:text-sm text-ink-600 leading-relaxed">
              Create and provision verified healthcare staff accounts: Clinicians, Field Health Workers,
              and System Administrators with secure admin JWT credentials.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-line-200">
            <Link href={ROUTES.ADMIN_STAFF}>
              <Button variant="primary" size="md" className="w-full">
                Open Staff Management &rarr;
              </Button>
            </Link>
          </div>
        </Card>

        {/* Global Analytics Preview */}
        <Card variant="interactive" className="p-6 flex flex-col justify-between">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                <BarChart3 className="w-6 h-6" />
              </div>
              <DemoBadge label="demo data" />
            </div>
            <h3 className="text-lg font-bold text-ink-900">Field Camp &amp; Hotspots Analytics</h3>
            <p className="text-xs sm:text-sm text-ink-600 leading-relaxed">
              Inspect district-level oral lesion screening trends, high-incidence clusters, and camp
              referral conversion funnels.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-line-200">
            <Link href={ROUTES.INSIGHTS}>
              <Button variant="secondary" size="md" className="w-full">
                View Global Insights &rarr;
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* Operational Audit Notice */}
      <Card variant="flat">
        <Card.Content className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1 text-xs text-ink-600">
            <strong className="text-ink-900">Security &amp; Audit Trail Active:</strong>
            <span>
              All administrative actions (staff creation, role modification, consent withdrawals) are
              logged in the append-only database audit log table with caller ID and timestamp.
            </span>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}
