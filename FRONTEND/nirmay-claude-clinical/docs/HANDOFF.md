# Handoff - claude-clinical (doctor workspace, video consultation, insights)

## Status
Written without access to `docs/BLUEPRINT.md`, `docs/components.md` or Antigravity's shared foundation. Behaviour follows the master prompt only. **Not built or linted** (no installable repo here). Verified only by: `tsc` transpile of every file, plus a server-render smoke test of all 10 routes (doctor, queue, case review, new appointment, consultation, 5 insights) against stubbed `@/lib/api`, auth, language, `next/link` and `lucide-react`. All routes render without throwing (loading/role-check states only; effects and the Jitsi embed were not exercised). Grep checks: no OncoSathi references, no direct `fetch`/browser storage, Jitsi recording/livestream/invite disabled, start-call gated to `role === "doctor"`. Run `npm run lint && npm run build` after dropping this in.

## Files (all within owned paths)
- `src/features/doctor/**` - dashboard, queue, case review, decision form, appointment creation, shared UI primitives, `adapters.js`
- `src/features/video/**` - shared consultation room (Jitsi), `PatientJoinEntry` for Codex
- `src/features/insights/**` - overview, funnel, hotspots, camps, QR (+ labelled demo data)
- `src/app/{doctor,consultation,insights}/**` - route files
- `docs/i18n-requests/claude.md`, `docs/API_CONTRACTS.md`, this file

## First things to do on integration
1. **`src/features/doctor/adapters.js`** is the only file touching shared code (`@/lib/api`, `@/context/AuthContext`, `@/context/LanguageContext`). Fix those imports/signatures there.
2. **Replace the local UI primitives** in `features/doctor/components/ui.js` (buttons, cards, badges, states) with Antigravity's shared components. They exist only because those were unavailable.
3. Replace assumed endpoints (`docs/API_CONTRACTS.md`) and confirm role names, decision options (`decisionConfig.js` fallback), statuses and priorities against the blueprint.
4. Add the keys in `docs/i18n-requests/claude.md`.

## Video consultation architecture
- One implementation: `features/video/components/ConsultationRoom.js` on route `/consultation/[consultationId]`, one Jitsi embed (`JitsiStage.js`) for both roles.
- **Doctor:** Start consultation (calls `POST .../start`) -> in-call controls (mic, camera, end). End calls `POST .../end`, then hangs up.
- **Patient:** no start action exists in the UI. Sees a waiting state (polls every 5 s), a Join button when `status==="live"`, and auto-enters if devices were already tested. Leaving does not end the consultation.
- Both join room `nirmay-<roomId>` where `roomId` comes from the server. If it is missing, the UI shows an error instead of inventing one.
- Recording, live streaming, invites and local recording are disabled in the Jitsi config. Nothing records calls.
- Device pre-check explains denied camera/mic; Reconnect remounts the embed; script-load failure shows an error with retry.
- For Codex: `<PatientJoinEntry />` (join-only form) or link directly to `/consultation/<id>`.

## Must be enforced server-side (UI checks are not security)
Only doctors can create appointments, start and end consultations; patients can only read/join a consultation they belong to.

## Demo-only / limitations
- **Public Jitsi (`meet.jit.si`) is a demo.** A visible banner shows while `NEXT_PUBLIC_JITSI_DOMAIN` is unset. Do not use it for real patient data; set `NEXT_PUBLIC_JITSI_DOMAIN` to a secured, privately hosted deployment. Public Jitsi may also require a logged-in moderator to start a room; a self-hosted instance with JWT auth is the production path.
- Insights fall back to `demoData.js` **only when the API call fails**, with a banner and the real error. Hotspot view is a schematic plot, not a to-scale map (no map library added; `package.json` untouched).
- AI flags are labelled "AI-flagged for review" with a standing not-a-diagnosis notice; they are never presented as a decision.
- Decision form keeps entries on failed submit but does not persist drafts to storage (patient data).
- Hindi/Kannada strings are partial drafts needing native review.
- Not done from here: commit/push to `claude-clinical`, PR to `frontend-integration`, tests, responsive/screen-reader checks in a real browser.
