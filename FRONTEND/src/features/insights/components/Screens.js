"use client";
import { useT } from "../../doctor/adapters";
import { Card, cx } from "../../doctor/components/ui";
import { insightsApi } from "../api/insightsApi";
import { BarList, Funnel, HotspotPlot, KpiTile, LineChart } from "./charts";
import InsightsShell, { InsightState, useInsight } from "./InsightsShell";

export function OverviewScreen() {
  const t = useT();
  const state = useInsight("overview", insightsApi.overview);
  return (
    <InsightsShell>
      <InsightState state={state}>
        {(d) => (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              <KpiTile label={t("insights.screenings", "Screenings")} value={d.totals.screenings} />
              <KpiTile label={t("insights.aiFlagged", "AI-flagged")} value={d.totals.aiFlagged} />
              <KpiTile label={t("insights.sentForReview", "Sent for review")} value={d.totals.sentForReview} />
              <KpiTile label={t("insights.reviewed", "Reviewed")} value={d.totals.reviewed} />
              <KpiTile label={t("insights.pending", "Pending")} value={d.totals.pending} />
            </div>
            <Card title={t("insights.weekly", "Screenings per week")}>
              <LineChart
                points={d.weekly}
                yLabel={t("insights.unit.screenings", "Number of screenings")}
                summary={`${t("insights.weekly", "Screenings per week")}: ${d.weekly.map((w) => `${w.label} ${w.value}`).join(", ")}`}
              />
            </Card>
            <p className="text-xs text-slate-500">{t("insights.flagNote", "\"AI-flagged\" means the screening model marked an image for doctor review. It is not a diagnosis.")}</p>
          </div>
        )}
      </InsightState>
    </InsightsShell>
  );
}

export function FunnelScreen() {
  const t = useT();
  const state = useInsight("funnel", insightsApi.funnel);
  return (
    <InsightsShell>
      <InsightState state={state}>
        {(d) => (
          <Card title={t("insights.funnel", "Screening funnel")}>
            <Funnel stages={d.stages} ofFirstLabel={t("insights.ofScreened", "of screened")} stepLabel={t("insights.fromPrevious", "from previous step")} />
          </Card>
        )}
      </InsightState>
    </InsightsShell>
  );
}

export function HotspotsScreen() {
  const t = useT();
  const state = useInsight("hotspots", insightsApi.hotspots);
  return (
    <InsightsShell>
      <InsightState state={state}>
        {(d) => {
          const rows = [...d.regions].sort((a, b) => b.flagged / b.screened - a.flagged / a.screened);
          return (
            <div className="grid gap-5 lg:grid-cols-2">
              <Card title={t("insights.hotspots", "Flag-rate hotspots")}>
                <HotspotPlot regions={d.regions} ariaLabel={t("insights.hotspotPlotLabel", "Schematic plot of regions; larger circles have a higher AI-flag rate")} />
                <p className="mt-2 text-xs text-slate-500">{t("insights.schematic", "Schematic view, not to scale. Larger and redder = higher share of screenings flagged for review.")}</p>
              </Card>
              <Card title={t("insights.byRegion", "By region")}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead><tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                      <th scope="col" className="py-2 pr-3">{t("insights.region", "Region")}</th>
                      <th scope="col" className="py-2 pr-3 text-right">{t("insights.screenings", "Screenings")}</th>
                      <th scope="col" className="py-2 pr-3 text-right">{t("insights.aiFlagged", "AI-flagged")}</th>
                      <th scope="col" className="py-2 text-right">{t("insights.rate", "Rate")}</th>
                    </tr></thead>
                    <tbody>
                      {rows.map((r) => (
                        <tr key={r.region} className="border-b border-slate-100">
                          <th scope="row" className="py-2 pr-3 font-medium text-slate-900">{r.region}</th>
                          <td className="py-2 pr-3 text-right tabular-nums">{r.screened}</td>
                          <td className="py-2 pr-3 text-right tabular-nums">{r.flagged}</td>
                          <td className="py-2 text-right font-medium tabular-nums">{r.screened ? ((r.flagged / r.screened) * 100).toFixed(1) : "0.0"}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          );
        }}
      </InsightState>
    </InsightsShell>
  );
}

export function CampsScreen() {
  const t = useT();
  const state = useInsight("camps", insightsApi.camps);
  return (
    <InsightsShell>
      <InsightState state={state}>
        {(d) =>
          d.camps.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">{t("insights.camps.empty", "No screening camps recorded yet.")}</p>
          ) : (
            <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {d.camps.map((c) => (
                <li key={c.id}>
                  <Card>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-slate-900">{c.name}</h3>
                        <p className="text-sm text-slate-600">{c.location} · {c.date}</p>
                      </div>
                      <span className={cx("rounded-full px-2.5 py-1 text-xs font-semibold", c.status === "upcoming" ? "bg-sky-100 text-sky-900" : "bg-emerald-100 text-emerald-900")}>
                        {t(`insights.camp.${c.status}`, c.status)}
                      </span>
                    </div>
                    <dl className="mt-4 grid grid-cols-2 gap-3">
                      <div><dt className="text-xs uppercase text-slate-500">{t("insights.screenings", "Screenings")}</dt><dd className="text-2xl font-bold tabular-nums">{c.screened}</dd></div>
                      <div><dt className="text-xs uppercase text-slate-500">{t("insights.aiFlagged", "AI-flagged")}</dt><dd className="text-2xl font-bold tabular-nums">{c.flagged}</dd></div>
                    </dl>
                  </Card>
                </li>
              ))}
            </ul>
          )
        }
      </InsightState>
    </InsightsShell>
  );
}

export function QrScreen() {
  const t = useT();
  const state = useInsight("qr", insightsApi.qr);
  return (
    <InsightsShell>
      <InsightState state={state}>
        {(d) => (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-3">
              <KpiTile label={t("insights.qr.scans", "QR scans")} value={d.totals.scans} />
              <KpiTile label={t("insights.qr.unique", "Unique visitors")} value={d.totals.uniqueVisitors} />
              <KpiTile label={t("insights.qr.started", "Started screening")} value={d.totals.startedScreening} />
            </div>
            <div className="grid gap-5 lg:grid-cols-2">
              <Card title={t("insights.qr.byDay", "Scans by day")}>
                <LineChart points={d.byDay} yLabel={t("insights.qr.scans", "QR scans")} summary={`${t("insights.qr.byDay", "Scans by day")}: ${d.byDay.map((p) => `${p.label} ${p.value}`).join(", ")}`} />
              </Card>
              <Card title={t("insights.qr.bySource", "Scans by source")}>
                <BarList items={d.byLocation} />
              </Card>
            </div>
          </div>
        )}
      </InsightState>
    </InsightsShell>
  );
}
