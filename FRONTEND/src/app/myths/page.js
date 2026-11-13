"use client";

import React, { useState } from "react";
import { HelpCircle, CheckCircle2, XCircle, ChevronDown, ChevronUp, BookOpen } from "lucide-react";
import { AppShell } from "@/components/ui/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DisclaimerBanner } from "@/components/ui/DisclaimerBanner";
import { useI18n } from "@/context/I18nContext";

export default function MythsPage() {
  const [openIdx, setOpenIdx] = useState(0);
  const { t } = useI18n();

  const mythsList = [
    {
      myth: "Smokeless tobacco (gutkha, khaini, zarda) and paan are safer than smoking cigarettes.",
      fact: "In India and South Asia, smokeless tobacco and areca nut (supari) are the leading cause of oral squamous cell carcinoma (SCC). Betel quid with tobacco exposes oral mucosa directly to potent carcinogens (tobacco-specific nitrosamines), drastically elevating oral cavity cancer risk.",
      tags: ["Tobacco & Paan", "Risk Drivers"],
    },
    {
      myth: "If a mouth ulcer or red sore does not hurt, it cannot be serious.",
      fact: "Early oral cancers are often completely painless. Many patients delay seeking care because the lesion doesn't cause severe pain initially. Any oral sore, ulcer, or red patch that persists for more than 3 weeks without healing must be evaluated by a healthcare professional.",
      tags: ["Symptoms", "Early Detection"],
    },
    {
      myth: "Taking a tissue biopsy will make the cancer spread or worsen.",
      fact: "A biopsy does not spread cancer. A small tissue biopsy examined by a pathologist is the single definitive gold standard required to determine if a lesion is benign, precancerous, or malignant, allowing timely cure while lesions are small.",
      tags: ["Diagnosis", "Biopsy"],
    },
    {
      myth: "White or red patches in the mouth will disappear on their own.",
      fact: "White patches (leukoplakia) and velvety red patches (erythroplakia) are well-recognized potentially malignant disorders (OPMD). Red patches in particular carry a high rate of dysplasia. They must be professionally examined and biopsied if persistent.",
      tags: ["Lesions", "Precancer"],
    },
    {
      myth: "Oral cancer only affects elderly individuals.",
      fact: "While risk rises with age, habit initiation with flavoured areca nut, pan masala, and gutkha at young ages has caused a marked surge in oral precancers and submucous fibrosis (OSMF) among young adults aged 18 to 35.",
      tags: ["Demographics", "Youth Risk"],
    },
    {
      myth: "Sharp teeth or ill-fitting dentures cannot trigger cancer.",
      fact: "Chronic mechanical mucosal trauma from sharp tooth cusps, fractured restorations, or unstable dentures creates persistent non-healing ulcers. Combined with tobacco or alcohol, chronic irritation acts as a major co-carcinogen.",
      tags: ["Dental Health", "Oral Irritation"],
    },
  ];

  return (
    <AppShell showSidebar={false}>
      <div className="flex flex-col gap-8 max-w-4xl mx-auto pb-12">
        <PageHeader
          title={t("myths.title", "Oral Cancer Awareness & Common Myths")}
          description={t("myths.desc", "Evidence-based facts to debunk prevalent misconceptions and encourage early consultation.")}
          badge={<Badge variant="brand" icon={<BookOpen className="w-3.5 h-3.5" />}>{t("Patient Education", "Patient Education")}</Badge>}
        />

        <DisclaimerBanner variant="subtle" />

        <div className="flex flex-col gap-4">
          {mythsList.map((item, idx) => {
            const isOpen = openIdx === idx;
            return (
              <Card
                key={idx}
                variant="default"
                className="overflow-hidden border border-line-200 transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full p-5 text-left flex items-start justify-between gap-4 hover:bg-surface-50 transition-colors min-h-touch"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emergency-bg text-emergency flex items-center justify-center flex-shrink-0 mt-0.5">
                      <XCircle className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold uppercase tracking-wider text-emergency">
                          {t("Myth #", "Myth #")}{idx + 1}
                        </span>
                        {item.tags.map((tag, i) => (
                          <span
                            key={i}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-surface-100 text-ink-600 font-medium"
                          >
                            {t(tag, tag)}
                          </span>
                        ))}
                      </div>
                      <h3 className="text-sm sm:text-base font-semibold text-ink-900 leading-snug">
                        &ldquo;{t(item.myth, item.myth)}&rdquo;
                      </h3>
                    </div>
                  </div>

                  <div className="p-1 rounded-lg text-ink-400 flex-shrink-0">
                    {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-2 border-t border-line-200 bg-surface-50/50">
                    <div className="p-4 rounded-xl bg-surface-0 border border-line-200 flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-risk-low-bg text-risk-low flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col gap-1 text-xs sm:text-sm text-ink-900 leading-relaxed">
                        <strong className="text-risk-low font-bold">{t("Medical Fact:", "Medical Fact:")}</strong>
                        <p>{t(item.fact, item.fact)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
