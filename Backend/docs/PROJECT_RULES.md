# Nirmay Project Rules (read this first)

Both tools (Claude Code and Codex) and both members follow this file. `CLAUDE.md` and `AGENTS.md` point here.

## Product

Nirmay is a cancer screening aid, not a diagnostic tool. Backend: FastAPI, SQLAlchemy on SQLite (Postgres via `DATABASE_URL`), own JWT auth with role checks (pyjwt and bcrypt directly), Python 3.11.

## Non-negotiable guardrails

1. Rules decide, AI explains. Risk, urgency and emergency escalation are hardcoded rules. Final risk fields never come from model text.
2. Every AI-facing response carries "Screening aid, not diagnosis." A clinician confirms or overrides flagged cases.
3. Never present a mock as real. Placeholders say `demo placeholder` or `demo data` in the response.
4. Synthetic data only. No real patient data.

Also: keep every threshold in `rules/oral.yaml` marked PENDING CLINICIAN REVIEW. Do not invent cut-offs. Override always requires a reason. Withdrawal stops processing and queues deletion. Collect only what the rules use.

## Team and ownership

| | Member 1 (Claude Code) | Member 2 (Codex) |
| --- | --- | --- |
| Instruction file | CLAUDE.md | AGENTS.md |
| Owns | app/core, app/db, app/api (all routers except explain, voice, whatsapp), app/services/rules, app/services/handoff.py, scripts | app/services/vision, app/services/llm, app/services/speech, app/api/explain, voice, whatsapp, docs/model_card.md, docs/limits_and_bias.md |
| Branch prefix | m1/ | m2/ |

Edit only your own folders. A change in the other's folder goes as a request or a tiny PR. Schemas in `app/schemas` and `docs/api.md` are frozen after hour 1; tell the other member before changing one.

## Git flow

- Small PRs to `main` about every 2 hours. `main` must always start and pass `/health`.
- Cross-review: Claude Code reviews Codex's PRs and Codex reviews Claude Code's PRs. Member 1 has the final merge say.
- Feature freeze at H21. After that: bug fixes, polish, rehearsal. No new endpoints.

## Commands

```bash
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
pytest
ruff check .
bash scripts/smoke_test.sh
python scripts/reset_demo.py
```

## Priorities

- P0: auth and 4 roles, consent and withdrawal, DB schema, rules engine, photo quality gate, clinician queue and handoff, disclaimers, model card.
- P1 (in order): photo classifier with Grad-CAM, LLM explainer with fallback, voice, video call (Jitsi).
- Stretch: WhatsApp, offline sync, free-text intake, quit-tobacco.
- P2: hotspot map, funnel, camp mode, QR card as seeded data labelled `demo data`.

## Failure paths to keep working

- Blurry, dark or non-mouth photo: 422 with a plain reason and retake tip; never run the classifier.
- Low confidence: "not sure, please see a doctor".
- Model missing or slow: "unavailable, see a doctor"; the rest keeps working.
- LLM or speech down: 3-5 second timeout, then template text or text-only.
- Consent withdrawn: processing endpoints return 403; case flagged for deletion.

## Style

- Rules engine is pure functions with unit tests (at least 15). Each result lists the rules that fired.
- Use the exact training image size, RGB order and normalisation in the server.
- Load the model once at startup, never inside a request.
- No API keys or real data in commits. Use `.env` and `.env.example`.
