/**
 * Insights API client integrated with actual Nirmay FastAPI endpoints:
 * - GET /demo/funnel
 * - GET /demo/hotspots
 * - GET /demo/camp
 * - GET /demo/qr/{patient_id}
 */
import { getFunnel, getHotspots, getCamp, getQrCard } from "@/lib/api/demo";

export const insightsApi = {
  overview: async () => {
    const [funnel, camp, hotspots] = await Promise.all([
      getFunnel().catch(() => null),
      getCamp().catch(() => null),
      getHotspots().catch(() => null),
    ]);

    const totalScreened = camp?.screened || 41;
    const flagged = camp?.referred || 5;

    return {
      totals: {
        screenings: totalScreened,
        aiFlagged: flagged,
        sentForReview: flagged,
        reviewed: 21,
        pending: flagged,
      },
      weekly: [
        { label: "W1", value: 8 },
        { label: "W2", value: 14 },
        { label: "W3", value: 12 },
        { label: "W4", value: 18 },
      ],
      dataLabel: funnel?.data_label || "demo data",
    };
  },

  funnel: async () => {
    const raw = await getFunnel();
    // Map backend stages [{"stage": "...", "count": ...}] to UI [{label, value}]
    const stages = (raw?.stages || []).map((s) => ({
      label: s.stage,
      value: s.count,
    }));
    return {
      stages: stages.length ? stages : [
        { label: "Consented", value: 265 },
        { label: "Intake done", value: 240 },
        { label: "Flagged for doctor", value: 29 },
        { label: "Reviewed by doctor", value: 21 },
      ],
      dataLabel: raw?.data_label || "demo data",
    };
  },

  hotspots: async () => {
    const raw = await getHotspots();
    // Map backend areas [{"name": "...", "screened": ..., "flagged": ...}] to UI regions
    const areas = raw?.areas || [];
    const regions = areas.map((a, idx) => ({
      region: a.name,
      screened: a.screened,
      flagged: a.flagged,
      lat: 12.9716 + idx * 0.1,
      lng: 77.5946 + idx * 0.1,
    }));
    return {
      regions: regions.length ? regions : [
        { region: "Demo District A", screened: 120, flagged: 14, lat: 12.97, lng: 77.59 },
        { region: "Demo District B", screened: 85, flagged: 6, lat: 13.05, lng: 77.65 },
        { region: "Demo District C", screened: 60, flagged: 9, lat: 12.91, lng: 77.52 },
      ],
      dataLabel: raw?.data_label || "demo data",
    };
  },

  camps: async () => {
    const raw = await getCamp();
    return {
      camp: raw?.camp || "Demo Screening Camp",
      registered: raw?.registered || 48,
      screened: raw?.screened || 41,
      referred: raw?.referred || 5,
      camps: [
        {
          id: "camp-1",
          name: raw?.camp || "Demo Screening Camp",
          location: "Community Health Center",
          registered: raw?.registered || 48,
          screened: raw?.screened || 41,
          referred: raw?.referred || 5,
          status: "completed",
        }
      ],
      dataLabel: raw?.data_label || "demo data",
    };
  },

  qr: async () => {
    const raw = await getQrCard(1);
    return {
      patientId: raw?.patient_id || 1,
      qrPayload: raw?.qr_payload || "nirmay://demo/card/1",
      cardTitle: raw?.card_title || "Nirmay screening card (demo placeholder)",
      dataLabel: raw?.data_label || "demo data",
    };
  },
};
