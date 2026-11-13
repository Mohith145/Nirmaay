# NIRMAY — SYSTEM BLUEPRINT & ARCHITECTURE SPECIFICATION
**Version:** 1.0  
**Date:** November 2026  
**Lead Architect:** Antigravity (Developer 3)

---

## 1. Product Vision & Clinical Safety Principle
**Nirmay** is an AI-assisted oral cancer early-screening, triage support, and referral-assistance platform designed for accessible healthcare workflows, rural outreach, and community health camps.

### Non-Negotiable Medical Safety Guardrails
1. **Screening aid, not diagnosis:** Nirmay does not diagnose cancer. It stratifies risk and structures evidence to assist qualified clinicians.
2. **Rules decide, AI explains:** Risk scores, clinical urgency, and emergency escalation are computed strictly by deterministic rules. LLM generation only provides plain-language explanations.
3. **Clinician in the loop:** Every flagged case requires human clinician review, confirmation, or reasoned override.
4. **Honest transparency:** Any mock or placeholder data must be explicitly labeled with `demo data` or `demo placeholder`.
5. **Data minimization & consent:** Informed consent must be granted before intake or image capture, and withdrawal of consent queues case and photo deletion immediately.

---

## 2. Technical Stack
- **Framework:** Next.js 15 with App Router (Node.js 20 LTS+)
- **Language:** JavaScript only (`.js`, no TypeScript, no `.jsx`)
- **Styling:** Tailwind CSS 3.4 with centralized theme tokens (no raw hex colors in feature components)
- **Icons:** `lucide-react`
- **Charts:** `recharts`
- **State Management:** React Context (`AuthContext`, `ToastContext`, `I18nContext`)
- **API Communication:** Centralized `apiFetch()` with normalized `ApiError`
- **Backend:** FastAPI (Python) running on `http://localhost:8000`
- **Teleconsultation:** Jitsi Meet integration (`meet.jit.si`)

---

## 3. Team Ownership & Branch Structure
| Role | Developer | Branch | Ownership Scope |
| :--- | :--- | :--- | :--- |
| **Lead Architect & Integration** | **Antigravity** | `antigravity-core` | Foundation, shared components, contexts, layouts, public pages, admin, API client, final integration |
| **Patient & Field Journey** | **Codex** | `codex-patient` | Patient consent, health intake, symptom checker, photo capture, results, quit-tobacco, health-worker camp mode |
| **Clinical & Workspace** | **Claude** | `claude-clinical` | Doctor queue, case detail review, Jitsi teleconsultation room, analytics hotspots & funnel |

---

## 4. Design System Tokens
All colors are tokenized in `src/app/globals.css` and `tailwind.config.mjs`:
- **Brand Teal:** `brand-600` (`#0F766E`), `brand-700` (`#115E59`), `brand-50` (`#F0FDFA`)
- **Surfaces:** `surface-0` (`#FFFFFF`), `surface-50` (`#F8FAFC`), `surface-100` (`#F1F5F9`)
- **Text / Ink:** `ink-900` (`#0F172A`), `ink-600` (`#475569`), `ink-400` (`#94A3B8`)
- **Border / Line:** `line-200` (`#E2E8F0`)
- **Risk Colors:**
  - Low: `risk-low` (`#16A34A`), `risk-low-bg` (`#F0FDF4`)
  - Medium: `risk-med` (`#D97706`), `risk-med-bg` (`#FFFBEB`)
  - High: `risk-high` (`#DC2626`), `risk-high-bg` (`#FEF2F2`)
- **Semantic:**
  - Emergency: `emergency` (`#B91C1C`), `emergency-bg` (`#FEF2F2`)
  - Demo: `demo` (`#7C3AED`), `demo-bg` (`#F5F3FF`)
  - Info: `info` (`#2563EB`), `info-bg` (`#EFF6FF`)
- **Accessibility:**
  - Minimum touch target: 44px (`min-h-touch`)
  - Large text mode (`.large-text`)
  - High contrast mode (`.high-contrast`)
  - Keyboard focus indicators (`focus-visible:ring-2 focus-visible:ring-brand-600`)

---

## 5. Application Route Map
### Public Pages (Antigravity)
- `/` — Landing page with four-step overview and role CTAs
- `/login` — Role-based sign in with `?next=` support
- `/register` — Open registration (patients only)
- `/model-card` — Transparency, bias, limitations, and demo disclosure
- `/emergency` — Emergency red flags and call helplines
- `/myths` — Curated myths vs facts
- `/self-exam` — Illustrated step-by-step self-examination guide
- `/roadmap` — Project roadmap with demo previews

### Admin Portal (Antigravity)
- `/admin` — System overview and controls
- `/admin/staff` — Staff account creation (Doctor, Health Worker, Admin) using admin token

### Patient Portal (Codex)
- `/patient` — Patient overview
- `/patient/consent` — Consent grant and withdrawal
- `/patient/intake` — 2-minute oral cancer health intake
- `/patient/symptoms` — Symptom duration and warning checks
- `/patient/photo` — Oral lesion photo screening with quality tips
- `/patient/results` — Risk results, rule reasons, and doctor handoff
- `/patient/cases` — History of cases and handoff summaries
- `/patient/quit` — Quit tobacco streak, money saved, and badges

### Health Worker Portal (Codex)
- `/health-worker` — Camp mode dashboard
- `/health-worker/intake` — Assisted patient registration & intake
- `/health-worker/camp` — Camp mode operational view & QR cards

### Clinician Workspace (Claude)
- `/doctor` — Prioritized case queue (emergency, urgency, wait time)
- `/doctor/cases/[id]` — Case inspection, heatmap overlay, confirm/override review
- `/doctor/consultation/[id]` / `/consultation/[id]` — Video consultation
- `/doctor/insights` / `/insights` — Hotspots map and screening funnel

---

## 6. Backend API Contracts
Base URL: `http://localhost:8000`

- `POST /auth/login` -> `{ access_token, user_id, role }`
- `POST /auth/register` -> `{ id, email, full_name, role }`
- `DELETE /me` -> Deactivates user and withdraws active consents
- `POST /consents` -> `{ id, subject_id, status }`
- `DELETE /consents/{id}` -> Withdraws consent and deletes stored media
- `POST /intakes` -> `{ id, risk_level, risk_score, reasons, rules_fired, recommended_test }`
- `POST /symptoms/check` -> `{ id, urgency, emergency, reasons, rules_fired, recommended_test }`
- `POST /photos/screen` -> `{ id, status, label, confidence, heatmap_b64, demo_placeholder }`
- `POST /cases` -> `{ id, risk_level, urgency, emergency, ai_flag }`
- `GET /cases/{id}/handoff` -> `{ case_id, summary_text, patient, risk, symptoms, photo, review }`
- `GET /clinician/queue` -> `{ items: [ { case_id, patient_name, urgency, emergency, risk_level, waiting_minutes } ] }`
- `POST /clinician/cases/{id}/review` -> `{ id, decision, reason, final_risk_level, final_urgency }`
- `POST /appointments` -> `{ id, case_id, room_id, join_url, notice }`
- `GET /demo/hotspots`, `/demo/funnel`, `/demo/camp`, `/demo/qr/{id}` -> Seeded demo data
- `GET, POST /quit/progress` -> `{ set_up, quit_date, streak_days, money_saved, badges }`
- `POST /explain` -> `{ result, explanation }`
- `GET /model-card` -> `{ status, model_available, scope, sensitivity_by_class, disclaimer }`
