import io

from PIL import Image

from app.db.models import AuditLog, Case, Consent
from tests.conftest import INTAKE, grant, make_case, make_intake, make_symptoms


def _jpeg():
    buf = io.BytesIO()
    Image.new("RGB", (32, 32), (200, 50, 50)).save(buf, "JPEG")
    return buf.getvalue()


def test_processing_blocked_without_consent(client, users):
    h = users["patient"]["headers"]
    for path, body in [("/intakes", INTAKE), ("/symptoms/check", {"symptoms": []}),
                       ("/cases", {"intake_id": 1})]:
        r = client.post(path, json=body, headers=h)
        assert r.status_code == 403, path
        assert r.json()["detail"]["error"] == "consent_required"
    r = client.post("/photos/screen", files={"file": ("a.jpg", _jpeg(), "image/jpeg")}, headers=h)
    assert r.status_code == 403


def test_granting_consent_unblocks_processing(client, users):
    grant(client, users)
    assert client.post("/intakes", json=INTAKE, headers=users["patient"]["headers"]).status_code == 201


def test_grant_is_idempotent(client, users):
    assert grant(client, users)["id"] == grant(client, users)["id"]


def test_withdrawn_consent_returns_403_and_flags_cases(client, users, Session):
    c = grant(client, users)
    make_case(client, users)
    r = client.delete(f"/consents/{c['id']}", headers=users["patient"]["headers"])
    assert r.status_code == 200 and r.json()["status"] == "withdrawn"
    h = users["patient"]["headers"]
    assert client.post("/intakes", json=INTAKE, headers=h).status_code == 403
    assert client.post("/symptoms/check", json={}, headers=h).status_code == 403
    assert client.post("/cases", json={"intake_id": 1}, headers=h).status_code == 403
    with Session() as db:
        assert all(case.deletion_queued for case in db.query(Case).all())
        assert db.query(AuditLog).filter_by(action="consent.withdraw").count() == 1


def test_flagged_case_leaves_queue_and_handoff_is_403(client, users):
    c = grant(client, users)
    case = make_case(client, users)
    client.delete(f"/consents/{c['id']}", headers=users["patient"]["headers"])
    q = client.get("/clinician/queue", headers=users["doctor"]["headers"]).json()
    assert q["items"] == []
    r = client.get(f"/cases/{case['id']}/handoff", headers=users["doctor"]["headers"])
    assert r.status_code == 403


def test_health_worker_needs_patient_id_and_consent(client, users):
    h = users["hw"]["headers"]
    assert client.post("/intakes", json=INTAKE, headers=h).status_code == 422
    body = {**INTAKE, "patient_id": users["patient"]["id"]}
    assert client.post("/intakes", json=body, headers=h).status_code == 403  # no consent yet
    r = client.post("/consents", json={"patient_id": users["patient"]["id"]}, headers=h)
    assert r.status_code == 201
    assert client.post("/intakes", json=body, headers=h).status_code == 201


def test_patient_cannot_act_for_another_patient(client, users):
    r = client.post("/consents", json={"patient_id": users["patient2"]["id"]},
                    headers=users["patient"]["headers"])
    assert r.status_code == 403


def test_other_patient_cannot_withdraw_my_consent(client, users):
    c = grant(client, users)
    r = client.delete(f"/consents/{c['id']}", headers=users["patient2"]["headers"])
    assert r.status_code == 403


def test_delete_me_stops_processing_and_deactivates_login(client, users, Session):
    grant(client, users)
    make_case(client, users)
    h = users["patient"]["headers"]
    assert client.delete("/me", headers=h).status_code == 200
    assert client.get("/appointments/1", headers=h).status_code == 401  # login deactivated
    with Session() as db:
        assert db.query(Consent).filter_by(status="granted").count() == 0
        assert all(c.deletion_queued for c in db.query(Case).all())


def test_disclaimer_on_risk_and_symptom_responses(client, users):
    grant(client, users)
    assert make_intake(client, users)["disclaimer"] == "Screening aid, not diagnosis."
    s = make_symptoms(client, users, symptoms=["persistent_mouth_pain"], duration_days=3)
    assert s["disclaimer"] == "Screening aid, not diagnosis."
