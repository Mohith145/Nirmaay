"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { INSIGHT_ROLES, useT } from "../../doctor/adapters";
import RoleGate from "../../doctor/components/RoleGate";
import { cx, DemoBanner, ErrorState, LoadingState, PageHeader } from "../../doctor/components/ui";
import { errorMessage } from "../../doctor/hooks/useAsync";
import { DEMO } from "../demoData";

const TABS = [
  ["/insights", "insights.tab.overview", "Overview"],
  ["/insights/funnel", "insights.tab.funnel", "Funnel"],
  ["/insights/hotspots", "insights.tab.hotspots", "Hotspots"],
  ["/insights/camps", "insights.tab.camps", "Camps"],
  ["/insights/qr", "insights.tab.qr", "QR"],
];

/**
 * Loads live data. If the API call fails, shows labelled DEMO data plus the
 * real error - never silently substituting mock data for live data.
 */
export function useInsight(key, fetcher) {
  const [s, setS] = useState({ loading: true, data: null, demo: false, error: null });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    setS((p) => ({ ...p, loading: true }));
    Promise.resolve()
      .then(fetcher)
      .then((data) => alive && setS({ loading: false, data, demo: false, error: null }))
      .catch((error) => alive && setS({ loading: false, data: DEMO[key], demo: true, error }));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, tick]);
  return { ...s, reload: () => setTick((n) => n + 1) };
}

export function InsightState({ state, children }) {
  const t = useT();
  if (state.loading) return <LoadingState />;
  if (!state.data) return <ErrorState message={errorMessage(state.error)} onRetry={state.reload} />;
  return (
    <>
      {state.demo && (
        <DemoBanner
          message={`${t("insights.demoBanner", "Demonstration data: live analytics could not be loaded, so sample figures are shown. They are not verified real-world results.")}${state.error?.message ? ` (${state.error.message})` : ""}`}
        />
      )}
      {children(state.data)}
    </>
  );
}

export default function InsightsShell({ children }) {
  const t = useT();
  const path = usePathname();
  return (
    <RoleGate roles={INSIGHT_ROLES}>
      <PageHeader title={t("insights.title", "Insights")} subtitle={t("insights.subtitle", "Screening activity, hotspots, camps and QR engagement")} />
      <nav aria-label={t("insights.title", "Insights")} className="-mx-1 mb-5 flex gap-1 overflow-x-auto px-1">
        {TABS.map(([href, key, label]) => {
          const active = path === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cx(
                "inline-flex min-h-[44px] shrink-0 items-center rounded-lg px-4 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-700",
                active ? "bg-teal-700 text-white" : "text-slate-700 hover:bg-slate-100"
              )}
            >
              {t(key, label)}
            </Link>
          );
        })}
      </nav>
      {children}
    </RoleGate>
  );
}
