/**
 * Doctor API client integrated directly with actual Nirmay FastAPI endpoints:
 * - GET /clinician/queue
 * - GET /clinician/cases/{caseId}
 * - POST /clinician/cases/{caseId}/review
 * - POST /appointments
 * - GET /appointments/{id}
 */
import { getClinicianQueue, getClinicianCase, reviewCase } from "@/lib/api/clinician";
import { createAppointment, getAppointment } from "@/lib/api/appointments";

export const doctorApi = {
  // Clinician queue (actual backend endpoint)
  queue: async ({ include_reviewed = false } = {}) => {
    return getClinicianQueue({ include_reviewed });
  },

  // Map listCases to real clinician queue
  listCases: async (filters = {}) => {
    const includeReviewed = filters.status === "reviewed" || filters.status === "all";
    const res = await getClinicianQueue({ include_reviewed: includeReviewed });
    const items = res?.items || [];
    
    // Client-side filtering if search query or status filter provided
    return items.filter((c) => {
      if (filters.status && filters.status !== "all" && c.status !== filters.status) {
        return false;
      }
      if (filters.priority && filters.priority !== "all" && c.urgency !== filters.priority) {
        return false;
      }
      if (filters.q) {
        const query = filters.q.toLowerCase();
        const nameMatch = (c.patient_name || "").toLowerCase().includes(query);
        const idMatch = String(c.case_id).includes(query);
        if (!nameMatch && !idMatch) return false;
      }
      return true;
    }).map((c) => ({
      id: c.case_id,
      patientName: c.patient_name,
      patientRef: `Case #${c.case_id}`,
      status: c.status,
      priority: c.emergency ? "urgent" : c.urgency,
      aiFlag: c.ai_flag,
      emergency: c.emergency,
      riskLevel: c.risk_level,
      waitingMinutes: c.waiting_minutes,
      submittedAt: c.created_at,
    }));
  },

  // Clinician case detail
  getCase: async (id) => {
    const raw = await getClinicianCase(id);
    return {
      id: raw.case_id || id,
      status: raw.status || "pending",
      priority: raw.emergency ? "urgent" : raw.urgency || "routine",
      emergency: raw.emergency,
      submittedAt: raw.created_at,
      source: raw.intake?.community_worker_assisted ? "Health Camp (Assisted)" : "Self-Screening",
      patient: {
        id: raw.patient?.id,
        name: raw.patient?.name || raw.patient_name,
        age: raw.patient?.age,
        sex: raw.patient?.gender,
        contact: raw.patient?.phone || "Confidential",
      },
      screening: {
        aiFlag: raw.ai_flag,
        aiNote: raw.reasons?.join("; ") || "Automated multi-factor screening evaluation",
        confidence: raw.photo?.confidence,
        riskLevel: raw.risk_level,
        urgency: raw.urgency,
        reasons: raw.reasons || [],
      },
      images: raw.photo?.image_url ? [
        {
          id: raw.photo.photo_id,
          url: raw.photo.image_url.startsWith("http") 
            ? raw.photo.image_url 
            : `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"}${raw.photo.image_url}`,
          label: "Oral Cavity Photo",
          heatmap: raw.photo.heatmap_base64,
        }
      ] : [],
      clinical: {
        symptoms: raw.symptoms?.symptoms?.join(", ") || (raw.symptoms?.ulcer_present ? "Ulcer present" : "None reported"),
        riskFactors: [
          raw.intake?.tobacco_use && "Tobacco use",
          raw.intake?.alcohol_use && "Alcohol consumption",
          raw.intake?.betel_quid && "Betel quid / Areca nut",
          raw.symptoms?.duration_weeks && `Symptom duration: ${raw.symptoms.duration_weeks} weeks`,
        ].filter(Boolean),
        notes: raw.intake?.chief_complaint || "None provided",
      },
      history: raw.review ? [
        {
          date: raw.review.created_at,
          event: `Clinician Review: ${raw.review.decision.toUpperCase()} (Final Risk: ${raw.review.final_risk_level || "N/A"}, Final Urgency: ${raw.review.final_urgency || "N/A"})`,
        }
      ] : [],
      decision: raw.review ? {
        decision: raw.review.decision,
        notes: raw.review.reason || "",
      } : null,
      raw,
    };
  },

  // Submit clinical decision / review
  submitDecision: async (caseId, payload) => {
    // Map Claude form decision to backend ReviewIn schema:
    // decision: "confirm" | "override"
    // reason: string (required for override)
    // final_risk_level: "Low" | "Medium" | "High"
    // final_urgency: "routine" | "soon" | "urgent"
    const isOverride = payload.decision === "override" || payload.decision === "referral";
    const body = {
      decision: isOverride ? "override" : "confirm",
      reason: payload.notes || (isOverride ? "Clinician clinical override justification provided" : null),
      final_risk_level: payload.final_risk_level || (payload.decision === "referral" ? "High" : null),
      final_urgency: payload.final_urgency || (payload.decision === "referral" ? "urgent" : null),
    };
    return reviewCase(Number(caseId), body);
  },

  // Doctor Dashboard stats & upcoming
  dashboard: async () => {
    const queueData = await getClinicianQueue({ include_reviewed: true });
    const items = queueData?.items || [];
    const pending = items.filter((c) => c.status !== "reviewed");
    const urgent = items.filter((c) => c.emergency || c.urgency === "urgent");
    const reviewed = items.filter((c) => c.status === "reviewed");

    return {
      stats: {
        pendingReview: pending.length,
        urgent: urgent.length,
        todayAppointments: 0,
        reviewedToday: reviewed.length,
      },
      queuePreview: pending.slice(0, 5).map((c) => ({
        id: c.case_id,
        patientName: c.patient_name || `Case #${c.case_id}`,
        status: c.status,
        priority: c.emergency ? "urgent" : c.urgency,
        submittedAt: c.created_at,
      })),
      upcomingAppointments: [],
    };
  },

  listPatients: async () => {
    const queueData = await getClinicianQueue({ include_reviewed: true });
    const items = queueData?.items || [];
    return items.map((c) => ({
      id: c.case_id,
      name: `${c.patient_name || "Patient"} (Case #${c.case_id})`,
    }));
  },

  createAppointment: async (payload) => {
    // Backend appointment is initiated per case_id: POST /appointments with { case_id }
    const caseId = payload.caseId || payload.patientId;
    const res = await createAppointment({ case_id: Number(caseId) });
    return {
      consultationId: String(res.id),
      roomId: res.room_id,
      scheduledAt: new Date().toISOString(),
      joinUrl: res.join_url,
    };
  },
};
