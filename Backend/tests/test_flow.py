from datetime import timedelta

from app.db.models import AuditLog, Case, utcnow
from tests.conftest import grant, make_case, make_intake, make_symptoms


def test_emergency_rule_fires_through_the_api(client, users):
    grant(client, users)
    s = make_symptoms(client, users, heavy_bleeding=True)
    assert s["emergency"] is True and s["urgency"] == "urgent" and s["action"]
    assert s["rules_fired"] == ["emergency:heavy_bleeding"]


def test_intake_returns_reasons_rules_and_test(client, users):
    grant(client, users)
    r = make_intake(client, users)
    assert r["reasons"] and r["rules_fired"] and r["recommended_test"]["timeframe"]
    assert r["thresholds_status"] == "PENDING CLINICIAN REVIEW"


def test_unknown_intake_field_rejected(client, users):
    grant(client, users)
    r = client.post("/intakes", json={"age": 40, "tobacco": "none", "religion": "x"},
                    headers=users["patient"]["headers"])
    assert r.status_code == 422


def test_queue_sorted_emergency_then_urgency_then_waiting(client, users, Session):
    grant(client, users, "patient")
    grant(client, users, "patient2")
    routine = make_case(client, users, "patient2", symptom=make_symptoms(
        client, users, "patient2", symptoms=["persistent_mouth_pain"], duration_days=1))
    urgent_new = make_case(client, users, "patient", symptom=make_symptoms(
        client, users, "patient", symptoms=["persistent_mouth_pain"], duration_days=60))
    urgent_old = make_case(client, users, "patient", symptom=make_symptoms(
        client, users, "patient", symptoms=["persistent_mouth_pain"], duration_days=90))
    emergency = make_case(client, users, "patient", symptom=make_symptoms(
        client, users, "patient", heavy_bleeding=True))
    with Session() as db:  # make urgent_old wait longer than urgent_new
        db.get(Case, urgent_old["id"]).created_at = utcnow() - timedelta(hours=5)
        db.commit()
    r = client.get("/clinician/queue", headers=users["doctor"]["headers"])
    order = [i["case_id"] for i in r.json()["items"]]
    assert order == [emergency["id"], urgent_old["id"], urgent_new["id"], routine["id"]]


def test_handoff_summary_built_from_stored_results(client, users):
    grant(client, users)
    case = make_case(client, users, symptom=make_symptoms(
        client, users, symptoms=["non_healing_ulcer"], duration_days=30))
    r = client.get(f"/cases/{case['id']}/handoff", headers=users["doctor"]["headers"])
    assert r.status_code == 200
    d = r.json()
    assert "Screening aid, not diagnosis." in d["summary_text"]
    assert d["risk"]["rules_fired"] and d["symptoms"]["rules_fired"]
    assert d["risk"]["source"].startswith("rules engine")


def test_patient_cannot_read_someone_elses_handoff(client, users):
    grant(client, users)
    case = make_case(client, users)
    r = client.get(f"/cases/{case['id']}/handoff", headers=users["patient2"]["headers"])
    assert r.status_code == 403
    assert client.get(f"/cases/{case['id']}/handoff", headers=users["patient"]["headers"]).status_code == 200


def test_override_requires_a_reason(client, users):
    grant(client, users)
    case = make_case(client, users)
    h = users["doctor"]["headers"]
    url = f"/clinician/cases/{case['id']}/review"
    assert client.post(url, json={"decision": "override", "final_urgency": "urgent"}, headers=h).status_code == 422
    assert client.post(url, json={"decision": "override", "reason": "  ", "final_urgency": "urgent"}, headers=h).status_code == 422
    assert client.post(url, json={"decision": "override", "reason": "Exam findings",
                                  "final_urgency": "urgent"}, headers=h).status_code == 201


def test_confirm_and_override_update_status_but_keep_original_fields(client, users, Session):
    grant(client, users)
    case = make_case(client, users)
    h = users["doctor"]["headers"]
    r = client.post(f"/clinician/cases/{case['id']}/review", json={"decision": "confirm"}, headers=h)
    assert r.status_code == 201 and r.json()["disclaimer"]
    with Session() as db:
        c = db.get(Case, case["id"])
        assert c.status == "reviewed" and c.risk_level == case["risk_level"]
    assert client.get("/clinician/queue", headers=h).json()["items"] == []
    inc = client.get("/clinician/queue?include_reviewed=true", headers=h).json()["items"]
    assert len(inc) == 1
    handoff = client.get(f"/cases/{case['id']}/handoff", headers=h).json()
    assert handoff["review"]["decision"] == "confirm"


def test_appointment_room_is_unguessable_shared_and_idempotent(client, users):
    grant(client, users)
    case = make_case(client, users)
    d = users["doctor"]["headers"]
    a = client.post("/appointments", json={"case_id": case["id"]}, headers=d)
    assert a.status_code == 201
    room = a.json()["room_id"]
    assert room.startswith("nirmay-") and len(room) == len("nirmay-") + 32
    assert room in a.json()["join_url"] and "Do not record" in a.json()["notice"]
    assert client.post("/appointments", json={"case_id": case["id"]}, headers=d).json()["room_id"] == room
    aid = a.json()["id"]
    assert client.get(f"/appointments/{aid}", headers=users["patient"]["headers"]).json()["room_id"] == room
    assert client.get(f"/appointments/{aid}", headers=d).json()["room_id"] == room
    assert client.get(f"/appointments/{aid}", headers=users["patient2"]["headers"]).status_code == 403
    assert client.post("/appointments", json={"case_id": case["id"]},
                       headers=users["patient"]["headers"]).status_code == 403


def test_doctor_views_and_changes_are_audited(client, users, Session):
    grant(client, users)
    case = make_case(client, users)
    h = users["doctor"]["headers"]
    client.get("/clinician/queue", headers=h)
    client.get(f"/cases/{case['id']}/handoff", headers=h)
    client.post(f"/clinician/cases/{case['id']}/review", json={"decision": "confirm"}, headers=h)
    with Session() as db:
        actions = {a.action for a in db.query(AuditLog).filter_by(actor_id=users["doctor"]["id"])}
    assert {"queue.view", "handoff.view", "review.confirm"} <= actions


def test_quit_progress(client, users):
    h = users["patient"]["headers"]
    assert client.get("/quit/progress", headers=h).json()["set_up"] is False
    grant(client, users)
    r = client.post("/quit/progress", json={"quit_date": "2020-01-01", "daily_spend": 10}, headers=h)
    d = r.json()
    assert d["streak_days"] > 100 and "100 days" in d["badges"]
    assert d["money_saved"] == round(d["streak_days"] * 10, 2)
