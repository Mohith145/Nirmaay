/**
 * FALLBACK ONLY. The case payload (`decisionOptions`) should supply the
 * documented decision outcomes. These are neutral workflow outcomes, not
 * diagnoses or treatment advice. CONFIRM AGAINST docs/BLUEPRINT.md.
 */
export const FALLBACK_DECISION_OPTIONS = [
  { value: "no_further_action", label: "Reviewed - no further action" },
  { value: "follow_up", label: "Follow-up required" },
  { value: "referral", label: "Referral required" },
  { value: "more_information", label: "More information needed" },
];
