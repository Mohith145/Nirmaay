# Nirmay API contract (Member 1)

Screening aid, not diagnosis. Schemas live in `app/schemas` and are frozen after hour 1.
Tell the other member before changing one.

## Auth
Bearer JWT with a `role` claim (patient, health_worker, doctor, admin). The database role is
authoritative: a token whose role claim disagrees with the database is rejected (401).
Public registration creates patients only. Staff accounts need an admin token.

## Endpoints (Member 1)
| Method and path | Role | Notes |
| --- | --- | --- |
| GET /health | public | liveness |
| POST /auth/register, /auth/login | all | |
| POST /consents | patient, health_worker | HW sends `patient_id` |
| DELETE /consents/{id} | patient, health_worker | withdraws all active consents, flags cases for deletion, deletes stored photos |
| POST /intakes | patient, health_worker | consent required; risk + reasons + rules_fired + recommended_test |
| POST /symptoms/check | patient, health_worker | consent required; emergency rule runs first |
| POST /photos/screen | patient, health_worker | multipart `file`, `patient_id?`, `send_to_doctor?` |
| GET /photos/{id}/image | doctor | only for photos sent to a doctor; audited |
| POST /cases | patient, health_worker | links intake, symptom, retained photo |
| GET /cases/{id}/handoff | patient (own), health_worker (own), doctor | audited |
| GET /clinician/queue | doctor | emergency, then urgent/soon/routine, then longest waiting |
| GET /clinician/cases/{id} | doctor | handoff + heatmap + image_url |
| POST /clinician/cases/{id}/review | doctor | `override` requires `reason` |
| POST /appointments, GET /appointments/{id} | doctor / doctor, patient | `room_id = "nirmay-" + uuid4().hex` |
| GET, POST /quit/progress | patient | stretch |
| GET /demo/hotspots, /funnel, /camp, /qr/{id} | admin, doctor | labelled `demo data` |
| DELETE /me | any | consent-withdrawal path, deactivates login |

## Error shape
`{"detail": {"error": "<code>", "message": "...", ...}}`. Photo refusals (422) add `reason`,
`retake_tip`, `disclaimer`.

## What Member 2 must provide (photos router calls these)
Both are sync functions that take **JPEG bytes** (EXIF already stripped) and are called with a
timeout (`VISION_TIMEOUT_SECONDS`, default 8). Anything missing, raising or slow becomes
"Photo screener unavailable. Please see a doctor." and the rest of the flow keeps working.

```python
# app/services/vision/quality_gate.py   (also accepted: check, run_quality_gate)
def check_quality(image_bytes: bytes) -> dict | object:  # {ok: bool, reason: str, retake_tip: str}

# app/services/vision/classifier.py     (also accepted: classify)
def predict(image_bytes: bytes) -> dict | object:
    # {label, confidence, not_sure?, heatmap_b64?, model_version?, demo_placeholder?, is_mouth?}
def load_model() -> None   # optional; called once at startup, never inside a request
```
`is_mouth: False` is refused with 422. `not_sure: True` returns "Not sure, please see a doctor."
Placeholder models must set `demo_placeholder: True`. The label is shown as `ai_flag` only; it
never sets risk, urgency or emergency.

Routers `explain`, `voice`, `whatsapp` are included automatically when
`app/api/explain.py`, `voice.py`, `whatsapp.py` exist and expose `router`.
