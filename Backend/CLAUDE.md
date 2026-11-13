# CLAUDE.md (Member 1: Core and Rules)

Read `docs/PROJECT_RULES.md` first. It holds the guardrails, folder ownership, git flow and commands for both members and both tools.

## You own

`app/core`, `app/db`, `app/api` (all routers except explain, voice, whatsapp), `app/services/rules`, `app/services/handoff.py`, `scripts`. Do not edit `app/services/vision`, `llm`, `speech` or the other member's routers; leave a note or open a tiny PR instead.

## How to work

- Use plan mode for anything that touches more than one file. Write pytest tests first for role checks, consent blocking and every rule.
- Rules engine: pure functions in `engine.py`, thresholds only in `oral.yaml`, all marked PENDING CLINICIAN REVIEW. Emergency rule goes at the top of the function. Do not invent cut-offs.
- Every response from risk, symptom and explain-facing endpoints includes "Screening aid, not diagnosis."
- Branch names `m1/<topic>`. Small PRs to `main` about every 2 hours.
- Review Codex's PRs (vision, llm, speech) before merging: check preprocessing matches training, timeouts exist, and no AI output sets risk, urgency or emergency fields.
- At each checkpoint decide cuts using the cut list in the plan.

## Done means

Tests pass, `/health` returns 200, a patient token is rejected on doctor routes, and withdrawn consent returns 403 on processing endpoints.
