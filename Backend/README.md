# Nirmay Backend

Nirmay is a cancer screening aid, not a diagnostic tool. All risk and urgency logic must be reviewed by a qualified clinician before any real-world use. Every AI-facing response carries the disclaimer: "Screening aid, not diagnosis."

This repo is the backend for a 24-hour hackathon vertical slice: consent, 2-minute intake, risk with reasons, symptom check with urgency, photo screener, recommended test and doctor handoff, emergency path, clinician confirm or override, and a doctor-patient video call. Four roles: patient, health worker, doctor, admin.

## Guardrails

1. Rules decide, AI explains. Risk, urgency and emergency escalation are hardcoded rules. An LLM never decides an emergency.
2. Every AI-facing response carries "Screening aid, not diagnosis." A clinician confirms or overrides flagged cases.
3. Never present a mock as real. Placeholders say `demo placeholder` or `demo data` inside the API response.
4. Synthetic data only. No real patient data anywhere.

## Requirements

- Python 3.11
- Git, Postman or Bruno, ngrok or cloudflared
- No GPU needed to serve (ONNX Runtime on CPU). Train on Colab or Kaggle.

## Setup

```bash
git clone <repo-url> nirmay-backend
cd nirmay-backend
python3.11 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env             # fill in keys; never commit .env
```

## Run

```bash
uvicorn app.main:app --reload --port 8000
curl http://localhost:8000/health
```

The database is SQLite by default. Set `DATABASE_URL` in `.env` to switch to Postgres.

## Vercel and Firebase deployment

For the monorepo deployment steps, required environment variables, private image storage,
and Firestore data behavior, see [`VERCEL_FIREBASE_DEPLOY.md`](VERCEL_FIREBASE_DEPLOY.md).

## Seed and reset demo data

```bash
python scripts/reset_demo.py     # resets seed data (fake patients and cases)
bash scripts/smoke_test.sh       # must pass before every demo
```

## Tests

```bash
pytest
ruff check .
```

## Layout

```
app/
  main.py        FastAPI app, routers, CORS, /health
  core/          config, security (JWT, roles), audit, errors
  db/            models.py, session.py, seed.py
  api/           auth, consent, intake, symptoms, photos, cases, clinician,
                 appointments, explain, voice, whatsapp, quit, demo
  services/
    rules/       engine.py (pure functions) + oral.yaml (thresholds)
    vision/      quality_gate.py, classifier.py, gradcam.py, model.onnx, labels.json
    llm/         explainer.py, faq_rag.py, templates.py (fallbacks)
    speech/      stt.py, tts.py
    handoff.py   builds the doctor summary from stored results
tests/  scripts/  docs/
```

## API overview

| Method and path | Role | Purpose |
| --- | --- | --- |
| POST /auth/register, /auth/login | all | JWT with role claim |
| POST /consents, DELETE /consents/{id} | patient, health worker | Grant and withdraw consent |
| POST /intakes | patient, health worker | Risk per cancer with reasons, recommended test |
| POST /symptoms/check | patient, health worker | Duration, urgency, emergency flag (rules only) |
| POST /photos/screen | patient, health worker | Quality gate, class, calibrated confidence, heatmap, or graceful refusal |
| POST /cases, GET /cases/{id}/handoff | patient, health worker, doctor | Create case, handoff summary |
| GET /clinician/queue | doctor | Sorted by urgency, then waiting time |
| POST /clinician/cases/{id}/review | doctor | Confirm or override with reason |
| POST /appointments, GET /appointments/{id} | doctor, patient | Creates unguessable Jitsi room_id |
| POST /explain | all | LLM rewrite of a structured result, template fallback |
| POST /voice/stt, /voice/tts | all | Hindi, Kannada, English |
| POST /whatsapp/webhook | Twilio | Thin intake and result flow |
| POST /sync | health worker | Offline queue, idempotent by client ID |
| GET/POST /quit/progress | patient | Streak, money saved, badges |
| GET /demo/hotspots, /demo/funnel, /demo/qr/{id} | admin, doctor | Seeded mock data labelled demo data |
| GET /model-card, GET /health | public | Limits and bias statement; liveness |
| DELETE /me | any user | Delete own data (consent withdrawal path) |

A shared Postman collection lives in `docs/` (add it in hour 0).

## Failure paths

- Blurry, dark or non-mouth photo: 422 with a plain reason and retake tip. The classifier never runs on a photo that failed the gate.
- Low confidence: "not sure, please see a doctor" instead of a class.
- Model missing or slow: screener returns "unavailable, see a doctor"; the rest keeps working.
- LLM or speech API down: 3-5 second timeout, then templated text or text-only.
- Consent withdrawn: processing endpoints return 403 and the case is flagged for deletion.

## Demo notes

- Demo video calls use public Jitsi (meet.jit.si). Production needs self-hosted Jitsi or a signed-token service, consent before the call, and no recording.
- Say "on-device" only if the model truly runs in the browser or phone. It runs on the server here.
- Common problems: CORS error (add the frontend origin to `allow_origins`); odd model output in the app (preprocessing mismatch); camera will not open on phone (needs https); slow first photo (load the model at startup); sleeping free hosting (wake it before presenting).

## Health data and compliance

Legal obligations for health data (for example India's DPDP Act, 2023) are flagged for qualified review. Do not claim compliance in the demo.

## Docs

- `docs/model_card.md`
- `docs/limits_and_bias.md`
- `docs/PROJECT_RULES.md`
