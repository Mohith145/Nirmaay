/**
 * DEMONSTRATION DATA ONLY. Shown (with a visible banner) when the insights API
 * is unavailable. Not real-world results. Coordinates are approximate and are
 * used only for a schematic plot.
 */
export const DEMO = {
  overview: {
    totals: { screenings: 1240, aiFlagged: 186, sentForReview: 160, reviewed: 142, pending: 44 },
    weekly: [
      { label: "W1", value: 120 }, { label: "W2", value: 158 }, { label: "W3", value: 171 }, { label: "W4", value: 149 },
      { label: "W5", value: 203 }, { label: "W6", value: 224 }, { label: "W7", value: 215 },
    ],
  },
  funnel: {
    stages: [
      { label: "Screened", value: 1240 },
      { label: "AI-flagged", value: 186 },
      { label: "Sent for review", value: 160 },
      { label: "Reviewed by doctor", value: 142 },
      { label: "Follow-up arranged", value: 61 },
    ],
  },
  hotspots: {
    regions: [
      { region: "Bengaluru Urban", screened: 410, flagged: 52, lat: 12.97, lng: 77.59 },
      { region: "Mysuru", screened: 190, flagged: 31, lat: 12.3, lng: 76.64 },
      { region: "Belagavi", screened: 150, flagged: 28, lat: 15.85, lng: 74.5 },
      { region: "Kalaburagi", screened: 120, flagged: 24, lat: 17.33, lng: 76.83 },
      { region: "Dharwad", screened: 110, flagged: 15, lat: 15.46, lng: 75.01 },
      { region: "Ballari", screened: 95, flagged: 14, lat: 15.14, lng: 76.92 },
      { region: "Udupi", screened: 85, flagged: 9, lat: 13.34, lng: 74.74 },
      { region: "Dakshina Kannada", screened: 80, flagged: 13, lat: 12.91, lng: 74.86 },
    ],
  },
  camps: {
    camps: [
      { id: "camp-1", name: "Community camp A", location: "Mysuru", date: "2026-09-14", screened: 212, flagged: 29, status: "completed" },
      { id: "camp-2", name: "Community camp B", location: "Belagavi", date: "2026-10-03", screened: 168, flagged: 27, status: "completed" },
      { id: "camp-3", name: "Community camp C", location: "Kalaburagi", date: "2026-11-22", screened: 0, flagged: 0, status: "upcoming" },
    ],
  },
  qr: {
    totals: { scans: 980, uniqueVisitors: 760, startedScreening: 412 },
    byDay: [
      { label: "Mon", value: 110 }, { label: "Tue", value: 134 }, { label: "Wed", value: 126 }, { label: "Thu", value: 150 },
      { label: "Fri", value: 171 }, { label: "Sat", value: 162 }, { label: "Sun", value: 127 },
    ],
    byLocation: [
      { label: "Clinic posters", value: 410 }, { label: "Camp banners", value: 330 }, { label: "Printed leaflets", value: 240 },
    ],
  },
};
