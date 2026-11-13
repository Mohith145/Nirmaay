from datetime import UTC, datetime, timedelta

import jwt

from app.core.config import get_settings


def test_health_returns_200(client):
    r = client.get("/health")
    assert r.status_code == 200 and r.json()["status"] == "ok"


def test_no_token_is_401(client):
    assert client.get("/clinician/queue").status_code == 401


def test_patient_token_rejected_on_doctor_routes(client, users):
    h = users["patient"]["headers"]
    assert client.get("/clinician/queue", headers=h).status_code == 403
    assert client.post("/clinician/cases/1/review", json={"decision": "confirm"}, headers=h).status_code == 403
    assert client.post("/appointments", json={"case_id": 1}, headers=h).status_code == 403


def test_health_worker_token_rejected_on_doctor_routes(client, users):
    assert client.get("/clinician/queue", headers=users["hw"]["headers"]).status_code == 403


def test_doctor_token_rejected_on_patient_processing_routes(client, users):
    h = users["doctor"]["headers"]
    assert client.post("/intakes", json={"age": 40, "tobacco": "none"}, headers=h).status_code == 403
    assert client.post("/consents", json={}, headers=h).status_code == 403


def test_doctor_can_open_queue(client, users):
    assert client.get("/clinician/queue", headers=users["doctor"]["headers"]).status_code == 200


def test_staff_registration_is_closed_to_the_public(client):
    r = client.post("/auth/register", json={
        "email": "x@t.test", "password": "longenough1", "full_name": "X", "role": "doctor"})
    assert r.status_code == 403


def test_public_can_register_patient_and_login(client):
    r = client.post("/auth/register", json={
        "email": "New@T.test", "password": "longenough1", "full_name": "New"})
    assert r.status_code == 201 and r.json()["role"] == "patient"
    r = client.post("/auth/login", json={"email": "new@t.test", "password": "longenough1"})
    assert r.status_code == 200 and r.json()["role"] == "patient"


def test_admin_can_create_staff(client, users):
    r = client.post("/auth/register", headers=users["admin"]["headers"], json={
        "email": "doc2@t.test", "password": "longenough1", "full_name": "Doc2", "role": "doctor"})
    assert r.status_code == 201


def test_duplicate_email_409(client, users):
    r = client.post("/auth/register", json={
        "email": "patient@t.test", "password": "longenough1", "full_name": "Dup"})
    assert r.status_code == 409


def test_wrong_password_401(client, users):
    r = client.post("/auth/login", json={"email": "patient@t.test", "password": "nope-nope"})
    assert r.status_code == 401


def test_forged_role_claim_is_rejected(client, users):
    s = get_settings()
    forged = jwt.encode(
        {"sub": str(users["patient"]["id"]), "role": "doctor",
         "exp": datetime.now(UTC) + timedelta(minutes=5)},
        s.jwt_secret, algorithm=s.jwt_algorithm)
    r = client.get("/clinician/queue", headers={"Authorization": f"Bearer {forged}"})
    assert r.status_code == 401


def test_expired_token_rejected(client, users):
    s = get_settings()
    old = jwt.encode(
        {"sub": str(users["doctor"]["id"]), "role": "doctor",
         "exp": datetime.now(UTC) - timedelta(minutes=1)},
        s.jwt_secret, algorithm=s.jwt_algorithm)
    assert client.get("/clinician/queue", headers={"Authorization": f"Bearer {old}"}).status_code == 401


def test_demo_endpoints_are_role_gated_and_labelled(client, users):
    assert client.get("/demo/hotspots", headers=users["patient"]["headers"]).status_code == 403
    r = client.get("/demo/hotspots", headers=users["doctor"]["headers"])
    assert r.status_code == 200 and r.json()["data_label"] == "demo data"
