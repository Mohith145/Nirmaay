"use client";

import React from "react";
import {
  AlertOctagon,
  PhoneCall,
  ShieldAlert,
  Hospital,
  Clock,
  ArrowRight,
  Ambulance,
  HeartPulse,
} from "lucide-react";
import { AppShell } from "@/components/ui/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DisclaimerBanner } from "@/components/ui/DisclaimerBanner";

export default function EmergencyPage() {
  const helplines = [
    {
      name: "All-in-One National Emergency",
      number: "112",
      description: "Immediate emergency police, fire, and ambulance response nationwide across India.",
      color: "bg-emergency text-surface-0 hover:bg-emergency/90",
      icon: <PhoneCall className="w-5 h-5" />,
    },
    {
      name: "Medical Ambulance Helpline",
      number: "108",
      description: "State medical emergency ambulance service and transport.",
      color: "bg-emergency text-surface-0 hover:bg-emergency/90",
      icon: <Ambulance className="w-5 h-5" />,
    },
    {
      name: "National Cancer Helpline",
      number: "1800-22-1951",
      description: "Toll-free guidance from Indian Cancer Society on oncology hospitals & financial support.",
      color: "bg-brand-600 text-surface-0 hover:bg-brand-700",
      icon: <HeartPulse className="w-5 h-5" />,
    },
    {
      name: "National Tobacco Quitline",
      number: "1800-11-2356",
      description: "Government toll-free counseling to quit smoking, gutkha, and betel nut.",
      color: "bg-surface-0 border border-line-200 text-ink-900 hover:bg-surface-50",
      icon: <PhoneCall className="w-5 h-5" />,
    },
  ];

  const redFlags = [
    {
      title: "Active or Massive Oral Bleeding",
      desc: "Bleeding from the mouth or throat that does not stop after 10 minutes of direct gentle pressure.",
    },
    {
      title: "Inability to Swallow Saliva or Fluids",
      desc: "Complete dysphagia or choking when attempting to swallow liquids or own saliva.",
    },
    {
      title: "Breathing Difficulty or Stridor",
      desc: "Noisy, wheezing breathing, or feeling of suffocation caused by tongue or throat swelling.",
    },
    {
      title: "Rapidly Expanding Neck or Jaw Mass",
      desc: "Sudden onset severe swelling that impairs airway, speech, or neck mobility.",
    },
  ];

  return (
    <AppShell showSidebar={false}>
      <div className="flex flex-col gap-8 max-w-4xl mx-auto pb-12">
        <PageHeader
          title="Emergency Guidance & Helplines"
          description="Immediate action instructions for acute or life-threatening symptoms."
          badge={<Badge variant="emergency">Urgent Care</Badge>}
        />

        {/* Emergency Alert Box */}
        <div className="p-6 rounded-2xl bg-emergency-bg border-2 border-emergency text-ink-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-emergency text-surface-0 flex-shrink-0 mt-1">
              <AlertOctagon className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-emergency">
                Are you or the patient experiencing acute distress?
              </h2>
              <p className="text-xs sm:text-sm text-ink-900 mt-1">
                Do not wait for an app screening. If airway blockage or severe bleeding is present, call
                emergency services immediately or proceed to the nearest hospital casualty.
              </p>
            </div>
          </div>
          <a
            href="tel:112"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emergency text-surface-0 font-bold text-base hover:opacity-90 shadow-md transition-opacity min-h-touch"
          >
            <PhoneCall className="w-5 h-5" />
            <span>Call 112 Now</span>
          </a>
        </div>

        {/* Verified Helplines Directory */}
        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-bold text-ink-900">Verified Emergency &amp; Support Helplines</h3>
            <p className="text-xs text-ink-600">
              Direct tap-to-call numbers verified for India. Free from all landlines and mobile phones.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {helplines.map((hl) => (
              <Card key={hl.number} variant="default" className="p-5 flex flex-col justify-between gap-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-ink-900 text-sm sm:text-base">{hl.name}</span>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-surface-100 text-ink-900">
                      {hl.number}
                    </span>
                  </div>
                  <p className="text-xs text-ink-600 leading-relaxed">{hl.description}</p>
                </div>

                <a
                  href={`tel:${hl.number.replace(/-/g, "")}`}
                  className={`inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl font-bold text-sm transition-colors shadow-xs min-h-touch ${hl.color}`}
                >
                  {hl.icon}
                  <span>Call {hl.number}</span>
                </a>
              </Card>
            ))}
          </div>
        </section>

        {/* Red Flag Symptoms Checklist */}
        <Card variant="flat">
          <Card.Header>
            <div className="flex items-center gap-2 text-emergency">
              <ShieldAlert className="w-5 h-5" />
              <Card.Title>Immediate Hospital Escalation Symptoms</Card.Title>
            </div>
            <Card.Description>
              Any of the following clinical signs supersedes routine screening and requires urgent in-person medical evaluation:
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {redFlags.map((flag, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-surface-0 border border-line-200 flex flex-col gap-1.5"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emergency-bg text-emergency font-bold text-xs flex items-center justify-center flex-shrink-0">
                      !
                    </span>
                    <strong className="text-sm text-ink-900">{flag.title}</strong>
                  </div>
                  <p className="text-xs text-ink-600 leading-relaxed pl-8">{flag.desc}</p>
                </div>
              ))}
            </div>
          </Card.Content>
        </Card>

        <DisclaimerBanner variant="subtle" />
      </div>
    </AppShell>
  );
}
