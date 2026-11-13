"use client";
import { cx } from "../../doctor/components/ui";

const fmt = (n) => (typeof n === "number" ? n.toLocaleString() : n);

/** Horizontal bars. Values are printed as text, so colour is never the only signal. */
export function BarList({ items, unit = "" }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="space-y-3">
      {items.map((i) => (
        <li key={i.label}>
          <div className="mb-1 flex justify-between gap-2 text-sm">
            <span className="text-slate-800">{i.label}</span>
            <span className="font-medium tabular-nums text-slate-900">{fmt(i.value)}{unit}</span>
          </div>
          <div className="h-2.5 rounded-full bg-slate-100" aria-hidden="true">
            <div className="h-full rounded-full bg-teal-700 transition-[width] duration-500 motion-reduce:transition-none" style={{ width: `${(i.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Funnel: each stage's bar is relative to the first stage; shows % of start and step conversion. */
export function Funnel({ stages, ofFirstLabel, stepLabel }) {
  const first = Math.max(1, stages[0]?.value || 1);
  return (
    <ol className="space-y-3">
      {stages.map((s, idx) => {
        const pct = (s.value / first) * 100;
        const prev = idx > 0 ? stages[idx - 1].value : null;
        const step = prev ? Math.round((s.value / prev) * 100) : null;
        return (
          <li key={s.label}>
            <div className="mb-1 flex flex-wrap justify-between gap-x-3 text-sm">
              <span className="font-medium text-slate-900">{s.label}</span>
              <span className="tabular-nums text-slate-700">
                {fmt(s.value)} · {pct.toFixed(pct < 10 ? 1 : 0)}% {ofFirstLabel}{step !== null && ` · ${step}% ${stepLabel}`}
              </span>
            </div>
            <div className="h-7 rounded bg-slate-100" aria-hidden="true">
              <div className="h-full rounded bg-teal-700 transition-[width] duration-500 motion-reduce:transition-none" style={{ width: `${Math.max(pct, 1.5)}%`, opacity: 1 - idx * 0.12 }} />
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** Simple SVG line chart with axis labels and an accessible summary. */
export function LineChart({ points, yLabel, summary }) {
  const W = 480, H = 200, P = { l: 40, r: 12, t: 12, b: 28 };
  const max = Math.max(1, ...points.map((p) => p.value));
  const x = (i) => P.l + (points.length < 2 ? 0 : (i / (points.length - 1)) * (W - P.l - P.r));
  const y = (v) => P.t + (1 - v / max) * (H - P.t - P.b);
  const d = points.map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p.value)}`).join(" ");
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={summary} className="h-auto w-full">
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line x1={P.l} x2={W - P.r} y1={y(max * f)} y2={y(max * f)} stroke="#e2e8f0" />
            <text x={P.l - 6} y={y(max * f) + 4} textAnchor="end" fontSize="10" fill="#475569">{Math.round(max * f)}</text>
          </g>
        ))}
        <path d={d} fill="none" stroke="#0f766e" strokeWidth="2.5" strokeLinejoin="round" />
        {points.map((p, i) => (
          <g key={p.label}>
            <circle cx={x(i)} cy={y(p.value)} r="3.5" fill="#0f766e" />
            <text x={x(i)} y={H - 8} textAnchor="middle" fontSize="10" fill="#475569">{p.label}</text>
          </g>
        ))}
      </svg>
      {yLabel && <figcaption className="mt-1 text-xs text-slate-500">{yLabel}</figcaption>}
      <table className="sr-only">
        <caption>{summary}</caption>
        <tbody>{points.map((p) => <tr key={p.label}><th scope="row">{p.label}</th><td>{p.value}</td></tr>)}</tbody>
      </table>
    </figure>
  );
}

/** Schematic bubble plot (NOT a to-scale map). Bubble area = flagged rate; labels always shown. */
export function HotspotPlot({ regions, ariaLabel }) {
  const W = 420, H = 380;
  const lats = regions.map((r) => r.lat), lngs = regions.map((r) => r.lng);
  const [minLat, maxLat, minLng, maxLng] = [Math.min(...lats), Math.max(...lats), Math.min(...lngs), Math.max(...lngs)];
  const px = (lng) => 50 + ((lng - minLng) / Math.max(0.01, maxLng - minLng)) * (W - 100);
  const py = (lat) => 30 + (1 - (lat - minLat) / Math.max(0.01, maxLat - minLat)) * (H - 60);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ariaLabel} className="h-auto w-full rounded-lg bg-slate-50">
      {regions.map((r) => {
        const rate = r.screened ? r.flagged / r.screened : 0;
        const rad = 8 + rate * 90;
        return (
          <g key={r.region}>
            <circle cx={px(r.lng)} cy={py(r.lat)} r={rad} fill={rate > 0.18 ? "#b91c1c" : rate > 0.12 ? "#d97706" : "#0f766e"} fillOpacity="0.35" stroke={rate > 0.18 ? "#b91c1c" : rate > 0.12 ? "#d97706" : "#0f766e"} strokeWidth="1.5" />
            <text x={px(r.lng)} y={py(r.lat) + rad + 12} textAnchor="middle" fontSize="10" fill="#1e293b">{r.region}</text>
          </g>
        );
      })}
    </svg>
  );
}

export function KpiTile({ label, value, className }) {
  return (
    <div className={cx("rounded-xl border border-slate-200 bg-white p-4", className)}>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-bold tabular-nums text-slate-900">{fmt(value)}</p>
    </div>
  );
}
