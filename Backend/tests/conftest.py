import os
import tempfile

# Must be set before the app is imported (settings are cached).
os.environ["BCRYPT_ROUNDS"] = "4"
os.environ["JWT_SECRET"] = "test-secret-test-secret-test-secret-123"
os.environ["DATABASE_URL"] = "sqlite://"
os.environ["UPLOAD_DIR"] = tempfile.mkdtemp(prefix="nirmay-test-")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.security import hash_password
from app.db import models  # noqa: F401
from app.db.models import User
from app.db.session import Base, get_db
from app.main import app

PASSWORD = "test-password-123"
INTAKE = {"age": 50, "tobacco": "smokeless", "tobacco_years": 15, "betel_quid": True}


@pytest.fixture()
def Session():
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    yield sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
    engine.dispose()


@pytest.fixture()
def client(Session):
    def override():
        db = Session()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture()
def users(client, Session):
    out: dict[str, dict] = {}
    spec = [("patient", "patient"), ("patient2", "patient"), ("hw", "health_worker"),
            ("doctor", "doctor"), ("admin", "admin")]
    with Session() as db:
        for key, role in spec:
            u = User(email=f"{key}@t.test", password_hash=hash_password(PASSWORD),
                     full_name=f"Test {key}", role=role)
            db.add(u)
            db.flush()
            out[key] = {"id": u.id}
        db.commit()
    for key in list(out):
        r = client.post("/auth/login", json={"email": f"{key}@t.test", "password": PASSWORD})
        assert r.status_code == 200, r.text
        out[key]["headers"] = {"Authorization": "Bearer " + r.json()["access_token"]}
    return out


def grant(client, users, who="patient"):
    r = client.post("/consents", json={}, headers=users[who]["headers"])
    assert r.status_code == 201, r.text
    return r.json()


def make_intake(client, users, who="patient", **over):
    r = client.post("/intakes", json={**INTAKE, **over}, headers=users[who]["headers"])
    assert r.status_code == 201, r.text
    return r.json()


def make_symptoms(client, users, who="patient", **body):
    r = client.post("/symptoms/check", json=body, headers=users[who]["headers"])
    assert r.status_code == 201, r.text
    return r.json()


def make_case(client, users, who="patient", symptom=None, intake=None, photo_id=None):
    intake = intake or make_intake(client, users, who)
    body = {"intake_id": intake["id"]}
    if symptom:
        body["symptom_id"] = symptom["id"]
    if photo_id:
        body["photo_id"] = photo_id
    r = client.post("/cases", json=body, headers=users[who]["headers"])
    assert r.status_code == 201, r.text
    return r.json()
