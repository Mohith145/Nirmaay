"use client";

import React from "react";
import Link from "next/link";
import { Activity, PhoneCall, ShieldCheck } from "lucide-react";
import { ROUTES } from "../../config/routes";
import { DisclaimerBanner } from "./DisclaimerBanner";
import { useI18n } from "../../context/I18nContext";

export function Footer() {
  const { t } = useI18n();

  return (
    <footer className="w-full bg-surface-0 border-t border-line-200 mt-auto py-10 text-ink-600 text-xs sm:text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-8">
        {/* Safety Disclaimer Banner */}
        <DisclaimerBanner variant="subtle" />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="flex flex-col gap-3 md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-brand-600 text-surface-0 flex items-center justify-center font-bold text-sm">
                <Activity className="w-4 h-4" />
              </div>
              <span className="font-bold text-ink-900 text-base">{t("app.name", "Nirmay")}</span>
            </div>
            <p className="text-xs text-ink-600 leading-relaxed max-w-md">
              {t(
                "footer.desc",
                "AI-assisted oral cancer early-screening, triage support, and clinical handoff system. Designed to expand accessible health intake and specialist consultation in rural and community health camps."
              )}
            </p>
            <div className="flex items-center gap-2 text-[11px] text-ink-400">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
              <span>
                {t(
                  "footer.rules_badge",
                  "Rules-based risk stratification with human clinician in the loop."
                )}
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col gap-2">
            <span className="font-semibold text-ink-900 uppercase text-xs tracking-wider">
              {t("footer.awareness", "AWARENESS")}
            </span>
            <Link href={ROUTES.MYTHS} className="hover:text-brand-600 transition-colors">
              {t("footer.myths", "Myths & Facts")}
            </Link>
            <Link href={ROUTES.SELF_EXAM} className="hover:text-brand-600 transition-colors">
              {t("footer.self_exam", "Step-by-Step Self-Exam")}
            </Link>
            <Link href={ROUTES.MODEL_CARD} className="hover:text-brand-600 transition-colors">
              {t("footer.model_card", "Model Transparency Card")}
            </Link>
            <Link href={ROUTES.ROADMAP} className="hover:text-brand-600 transition-colors">
              {t("footer.roadmap", "Platform Roadmap")}
            </Link>
          </div>

          {/* Emergency Helplines */}
          <div className="flex flex-col gap-2">
            <span className="font-semibold text-emergency uppercase text-xs tracking-wider flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5" />
              {t("footer.emergency_helplines", "Emergency Helplines")}
            </span>
            <p className="text-xs text-ink-600">
              {t(
                "footer.emergency_sub",
                "For emergency medical trauma, airway difficulty, or heavy bleeding:"
              )}
            </p>
            <span className="font-bold text-ink-900 text-sm">
              {t("footer.emergency_num", "Emergency: 112 / 108")}
            </span>
            <span className="text-xs text-ink-600">
              {t("footer.cancer_helpline", "National Cancer Helpline:")}{" "}
              <strong>1800-22-1951</strong>
            </span>
            <Link
              href={ROUTES.EMERGENCY}
              className="mt-1 text-emergency font-semibold hover:underline"
            >
              {t("footer.view_red_flags", "View emergency red flags →")}
            </Link>
          </div>
        </div>

        <div className="pt-6 border-t border-line-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ink-400">
          <span>
            &copy; {new Date().getFullYear()}{" "}
            {t("footer.copyright", "Nirmay Research Prototype. All rights reserved.")}
          </span>
          <span>{t("footer.colossus", "Colossus 3.0 · November 2026")}</span>
        </div>
      </div>
    </footer>
  );
}
