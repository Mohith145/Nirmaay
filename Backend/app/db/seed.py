"""Seed fake users and cases. Everything is synthetic and labelled `demo data`."""

import random
from datetime import timedelta

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import hash_password
from app.db.models import (
    Case,
    Consent,
    Intake,
    PhotoScreening,
    SymptomCheck,
    User,
    utcnow,
)
from app.services.rules.engine import assess_intake, assess_symptoms

DEMO_USERS = {
    "admin": ("admin@demo.nirmay.test", "Demo Admin"),
    "doctor": ("doctor@demo.nirmay.test", "Demo Doctor"),
    "health_worker": ("healthworker@demo.nirmay.test", "Demo Health Worker"),
    "patient": ("patient@demo.nirmay.test", "Demo Patient (live demo)"),
}
SYMPTOMS = ["non_healing_ulcer", "white_or_red_patch", "lump_or_swelling",
            "persistent_mouth_pain", "difficulty_chewing_or_swallowing", "unexplained_loose_tooth"]


def seed_demo(db: Session, n_patients: int = 30, n_cases: int = 12, rng_seed: int = 7) -> dict:
    rng = random.Random(rng_seed)
    pw = hash_password(get_settings().demo_password)
    users: dict[str, User] = {}
    for role, (email, name) in DEMO_USERS.items():
        u = User(email=email, password_hash=pw, full_name=f"{name} [demo data]", role=role)
        db.add(u)
        users[role] = u
    db.flush()
    # The live-demo patient starts WITHOUT consent so the demo can grant, then withdraw.

    patients: list[User] = []
    for i in range(1, n_patients + 1):
        p = User(email=f"patient{i:02d}@demo.nirmay.test", password_hash=pw,
                 full_name=f"Demo Patient {i:02d} [demo data]", role="patient")
        db.add(p)
        patients.append(p)
    db.flush()
    for p in patients:
        db.add(Consent(subject_id=p.id, granted_by_id=p.id))

    now = utcnow()
    made = 0
    for idx, p in enumerate(patients[:n_cases]):
        answers = {
            "age": rng.randint(25, 75),
            "tobacco": rng.choice(["none", "smokeless", "smoking", "both"]),
            "tobacco_years": rng.randint(0, 40),
            "betel_quid": rng.random() < 0.4,
            "alcohol": rng.choice(["none", "occasional", "regular"]),
            "family_history": rng.random() < 0.2,
            "prior_oral_lesion": rng.random() < 0.2,
        }
        risk = assess_intake(answers)
        intake = Intake(
            subject_id=p.id, created_by_id=p.id, answers=answers, risk_level=risk.risk_level,
            risk_score=risk.score, reasons=risk.reasons, rules_fired=risk.rules_fired,
            recommended_test=risk.recommended_test.__dict__,
        )
        db.add(intake)

        report = {"symptoms": rng.sample(SYMPTOMS, rng.randint(1, 2)),
                  "duration_days": rng.choice([3, 10, 30, 60])}
        if idx == 0:  # one emergency case, by rule
            report["heavy_bleeding"] = True
        urg = assess_symptoms(report)
        symptom = SymptomCheck(
            subject_id=p.id, created_by_id=p.id, answers=report, urgency=urg.urgency,
            emergency=urg.emergency, reasons=urg.reasons, rules_fired=urg.rules_fired,
            action=urg.action, recommended_test=urg.recommended_test.__dict__,
        )
        photo = PhotoScreening(
            subject_id=p.id, created_by_id=p.id, status="ok",
            label=rng.choice(["normal", "suspicious", "urgent referral"]),
            confidence=round(rng.uniform(0.6, 0.95), 2), model_version="demo placeholder",
            demo_placeholder=True, retained=False,
        )
        db.add_all([symptom, photo])
        db.flush()
        db.add(Case(
            subject_id=p.id, created_by_id=p.id, intake_id=intake.id, symptom_id=symptom.id,
            photo_id=photo.id, risk_level=risk.risk_level, urgency=urg.urgency,
            emergency=urg.emergency, ai_flag=photo.label,
            created_at=now - timedelta(minutes=rng.randint(5, 600)),
        ))
        made += 1
    db.commit()
    return {"users": len(DEMO_USERS) + n_patients, "cases": made}
