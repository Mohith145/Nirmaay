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
  Search,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { DisclaimerBanner } from "@/components/ui/DisclaimerBanner";
import { DemoBadge } from "@/components/ui/DemoBadge";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { UrgencyBadge } from "@/components/ui/UrgencyBadge";
import { Spinner } from "@/components/ui/Spinner";
import { searchPatients } from "@/lib/api/patients";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";

export default function HealthWorkerHomePage() {
  const { user } = useAuth();
  const { t } = useI18n();

  const [patients, setPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingPatients, setIsLoadingPatients] = useState(true);

  useEffect(() => {
    loadPatientsList("");
  }, []);

  const loadPatientsList = async (query = "") => {
    setIsLoadingPatients(true);
    try {
      const res = await searchPatients(query, 20);
      setPatients(res || []);
    } catch (err) {
      console.warn("Failed to load patients list:", err);
      setPatients([]);
    } finally {
      setIsLoadingPatients(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadPatientsList(searchQuery.trim());
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-12">
      <PageHeader
        title={`${t("Camp Workspace:")} ${user?.full_name || t("Health Worker")}`}
        description={t("Assisted patient registration, rapid screening camp triage, and doctor referral coordination.")}
        badge={<Badge variant="brand" icon={<Users className="w-3.5 h-3.5" />}>{t("Camp Mode Active")}</Badge>}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/health-worker/intake">
              <Button variant="primary" size="sm" icon={<UserPlus className="w-4 h-4" />}>
                {t("Register & Screen Patient")}
              </Button>
            </Link>
            <Link href="/health-worker/camp">
              <Button variant="secondary" size="sm" icon={<QrCode className="w-4 h-4" />}>
                {t("Camp QR Cards")}
              </Button>
            </Link>
          </div>
        }
      />

      <DisclaimerBanner variant="subtle" />

      {/* Camp Operational Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label={t("Registered Attendees")}
          value={String(patients.length > 0 ? patients.length : "48")}
          sublabel={t("Today's rural screening camp")}
          icon={<Users className="w-5 h-5 text-brand-600" />}
          isDemo={patients.length === 0}
        />
        <StatCard
          label={t("Screened Participants")}
          value={String(patients.filter(p => p.screenings_count > 0).length || "41")}
          sublabel={t("Completed intake & symptoms")}
          icon={<CheckCircle2 className="w-5 h-5 text-risk-low" />}
          isDemo={patients.length === 0}
        />
        <StatCard
          label={t("Flagged for Specialist")}
          value={String(patients.filter(p => p.latest_risk_level === "high" || p.latest_urgency === "urgent").length || "5")}
          sublabel={t("Referred to oncologist queue")}
          icon={<AlertTriangle className="w-5 h-5 text-risk-med" />}
          isDemo={patients.length === 0}
        />
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Register & Screen Card */}
        <Card variant="interactive" className="p-6 flex flex-col justify-between">
          <div className="flex flex-col gap-3">
            <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <UserPlus className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-ink-900">{t("Register & Screen Participant")}</h3>
            <p className="text-xs sm:text-sm text-ink-600 leading-relaxed">
              {t("Register camp attendees by name and token, evaluate tobacco and habit risk factors, capture lesion photos, and run automated rules triage.")}
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-line-200">
            <Link href="/health-worker/intake">
              <Button variant="primary" size="md" className="w-full">
                {t("Start Patient Screening →")}
              </Button>
            </Link>
          </div>
        </Card>

        {/* QR Health Cards Card */}
        <Card variant="interactive" className="p-6 flex flex-col justify-between">
          <div className="flex flex-col gap-3">
            <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-ink-900">{t("Camp Mode & QR Health Cards")}</h3>
            <p className="text-xs sm:text-sm text-ink-600 leading-relaxed">
              {t("Issue portable, privacy-preserving digital QR health cards for camp attendees to carry their risk status and referral advice.")}
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-line-200">
            <Link href="/health-worker/camp">
              <Button variant="secondary" size="md" className="w-full">
                {t("Open Camp QR Cards →")}
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* Live Camp Participants List & Search */}
      <Card variant="default">
        <Card.Header>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <Card.Title>{t("Camp Participants & Screening Status")}</Card.Title>
              <Card.Description>
                {t("Search and select registered attendees to review their records or launch a new screening.")}
              </Card.Description>
            </div>

            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Input
                  placeholder={t("Search name, token #, ID...")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="text-xs"
                />
              </div>
              <Button type="submit" variant="secondary" size="sm" icon={<Search className="w-3.5 h-3.5" />}>
                {t("Search")}
              </Button>
            </form>
          </div>
        </Card.Header>
        <Card.Content>
          {isLoadingPatients ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2">
              <Spinner size="md" />
              <span className="text-xs text-ink-600">{t("Loading participants...")}</span>
            </div>
          ) : patients.length === 0 ? (
            <div className="py-10 text-center flex flex-col items-center justify-center gap-3">
              <Users className="w-8 h-8 text-ink-400" />
              <span className="text-sm font-semibold text-ink-900">{t("No participants found")}</span>
              <p className="text-xs text-ink-600 max-w-sm">
                {t("Register the first attendee using the button above to begin camp screenings.")}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-line-200 text-ink-600 font-semibold uppercase tracking-wider">
                    <th className="py-2.5 px-3">{t("Token / ID")}</th>
                    <th className="py-2.5 px-3">{t("Participant Name")}</th>
                    <th className="py-2.5 px-3">{t("Age / Gender")}</th>
                    <th className="py-2.5 px-3">{t("Consent")}</th>
                    <th className="py-2.5 px-3">{t("Screening Status")}</th>
                    <th className="py-2.5 px-3 text-right">{t("Actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-100">
                  {patients.map((pt) => (
                    <tr key={pt.id} className="hover:bg-surface-50 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-ink-900">
                        #{pt.camp_token || pt.id}
                      </td>
                      <td className="py-3 px-3 font-semibold text-ink-900">
                        {pt.full_name}
                      </td>
                      <td className="py-3 px-3 text-ink-600">
                        {pt.age ? `${pt.age} yrs` : "—"} {pt.gender && pt.gender !== "unspecified" ? `(${pt.gender})` : ""}
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant={pt.consent_status === "granted" ? "risk-low" : "outline"} size="sm">
                          {pt.consent_status === "granted" ? t("Granted") : t("Pending")}
                        </Badge>
                      </td>
                      <td className="py-3 px-3">
                        {pt.latest_risk_level ? (
                          <div className="flex items-center gap-1.5">
                            <RiskBadge risk={pt.latest_risk_level} size="sm" />
                            {pt.latest_urgency && <UrgencyBadge urgency={pt.latest_urgency} size="sm" />}
                          </div>
                        ) : (
                          <span className="text-ink-400 italic text-[11px]">{t("Pending Screening")}</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right space-x-2">
                        <Link href={`/health-worker/camp?patient_id=${pt.id}`}>
                          <Button variant="ghost" size="sm" className="text-xs">
                            {t("QR Card")}
                          </Button>
                        </Link>
                        <Link href={`/health-worker/intake?patient_id=${pt.id}`}>
                          <Button variant="primary" size="sm" className="text-xs">
                            {pt.screenings_count > 0 ? t("Re-Screen") : t("Screen")}
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card.Content>
      </Card>

      {/* Field Worker Protocol Guidelines */}
      <Card variant="flat">
        <Card.Header>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-brand-600" />
            <Card.Title>{t("Camp Protocol: Urgent Escalation Criteria")}</Card.Title>
          </div>
        </Card.Header>
        <Card.Content className="text-xs text-ink-600 space-y-2">
          <p>
            &bull; <strong>{t("Ulcers persisting > 3 weeks:")}</strong> {t("Always tag as priority referral for clinical biopsy.")}
          </p>
          <p>
            &bull; <strong>{t("Trismus (reduced mouth opening):")}</strong> {t("Mark for immediate specialist evaluation of Oral Submucous Fibrosis (OSMF).")}
          </p>
          <p>
            &bull; <strong>{t("Emergency Red Flags:")}</strong> {t("Severe bleeding or swallowing blockage requires direct emergency transport to the nearest civil hospital casualty.")}
          </p>
        </Card.Content>
      </Card>
    </div>
  );
}
