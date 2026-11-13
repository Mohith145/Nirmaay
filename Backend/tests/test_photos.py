import io
import os

import pytest
from PIL import Image

from app.api import photos as photos_mod
from app.core.config import get_settings
from app.db.models import PhotoScreening
from tests.conftest import grant, make_case, make_intake


def jpeg(with_exif=False):
    buf = io.BytesIO()
    im = Image.new("RGB", (64, 64), (180, 60, 60))
    if with_exif:
        exif = Image.Exif()
        exif[0x010F] = "SecretCameraMaker"
        im.save(buf, "JPEG", exif=exif.tobytes())
    else:
        im.save(buf, "JPEG")
    return buf.getvalue()


def post_photo(client, headers, data=None, ctype="image/jpeg", name="holiday.jpg", **form):
    return client.post("/photos/screen", headers=headers, data=form,
                       files={"file": (name, data if data is not None else jpeg(), ctype)})


@pytest.fixture()
def good(monkeypatch):
    calls = {"gate": 0, "clf": 0}

    def gate(b):
        calls["gate"] += 1
        return True, "", ""

    def clf(b):
        calls["clf"] += 1
        return {"label": "suspicious", "confidence": 0.82, "heatmap_b64": "aGVhdA==",
                "model_version": "test-1", "demo_placeholder": True, "is_mouth": True}

    monkeypatch.setattr(photos_mod, "_call_quality_gate", gate)
    monkeypatch.setattr(photos_mod, "_call_classifier", clf)
    return calls


def test_wrong_type_rejected(client, users):
    grant(client, users)
    r = post_photo(client, users["patient"]["headers"], data=b"hello", ctype="text/plain", name="a.txt")
    assert r.status_code == 415


def test_fake_image_with_image_mime_rejected(client, users):
    grant(client, users)
    r = post_photo(client, users["patient"]["headers"], data=b"not really a jpeg")
    assert r.status_code == 415


def test_oversized_rejected(client, users, monkeypatch):
    grant(client, users)
    monkeypatch.setattr(get_settings(), "max_upload_bytes", 200)
    assert post_photo(client, users["patient"]["headers"]).status_code == 413


def test_blurry_photo_gets_422_with_reason_and_classifier_never_runs(client, users, monkeypatch):
    grant(client, users)
    calls = {"clf": 0}
    monkeypatch.setattr(photos_mod, "_call_quality_gate",
                        lambda b: (False, "The photo is too blurry.", "Hold the phone steady."))
    monkeypatch.setattr(photos_mod, "_call_classifier",
                        lambda b: calls.__setitem__("clf", calls["clf"] + 1))
    r = post_photo(client, users["patient"]["headers"])
    assert r.status_code == 422
    d = r.json()["detail"]
    assert d["reason"] == "The photo is too blurry." and d["retake_tip"]
    assert d["disclaimer"] == "Screening aid, not diagnosis."
    assert calls["clf"] == 0


def test_not_a_mouth_is_refused(client, users, monkeypatch, good):
    grant(client, users)
    monkeypatch.setattr(photos_mod, "_call_classifier", lambda b: {"is_mouth": False})
    r = post_photo(client, users["patient"]["headers"])
    assert r.status_code == 422 and "mouth" in r.json()["detail"]["reason"]


def test_vision_services_missing_returns_unavailable_see_a_doctor(client, users, monkeypatch):
    grant(client, users)

    def missing(*a, **k):
        raise photos_mod.ScreenerUnavailable("module missing")

    monkeypatch.setattr(photos_mod, "_resolve", missing)  # simulates no vision modules at all
    r = post_photo(client, users["patient"]["headers"])
    assert r.status_code == 200
    d = r.json()
    assert d["status"] == "unavailable" and "see a doctor" in d["message"].lower()
    assert d["disclaimer"] == "Screening aid, not diagnosis."


def test_model_failure_or_timeout_returns_unavailable(client, users, monkeypatch, good):
    grant(client, users)

    def boom(b):
        raise photos_mod.ScreenerUnavailable("timeout")

    monkeypatch.setattr(photos_mod, "_call_classifier", boom)
    r = post_photo(client, users["patient"]["headers"])
    assert r.status_code == 200 and r.json()["status"] == "unavailable"


def test_good_photo_returns_class_confidence_heatmap(client, users, good):
    grant(client, users)
    r = post_photo(client, users["patient"]["headers"])
    d = r.json()
    assert r.status_code == 200 and d["status"] == "ok" and d["label"] == "suspicious"
    assert d["confidence"] == 0.82 and d["heatmap_b64"]
    assert d["demo_placeholder"] is True and "demo placeholder" in d["message"]
    assert good["gate"] == 1 and good["clf"] == 1


def test_low_confidence_says_not_sure(client, users, monkeypatch, good):
    grant(client, users)
    monkeypatch.setattr(photos_mod, "_call_classifier",
                        lambda b: {"label": "normal", "confidence": 0.4, "not_sure": True})
    d = post_photo(client, users["patient"]["headers"]).json()
    assert d["status"] == "not_sure" and d["label"] is None and "see a doctor" in d["message"].lower()


def test_image_not_stored_unless_sent_to_doctor(client, users, good, Session):
    grant(client, users)
    d = post_photo(client, users["patient"]["headers"]).json()
    assert d["retained_for_doctor"] is False
    with Session() as db:
        row = db.get(PhotoScreening, d["id"])
        assert row.image_path is None and row.retained is False


def test_retained_photo_has_random_name_no_exif_and_doctor_can_view(client, users, good, Session):
    grant(client, users)
    d = post_photo(client, users["patient"]["headers"], data=jpeg(with_exif=True),
                   name="my_face.jpg", send_to_doctor="true").json()
    assert d["retained_for_doctor"] is True
    with Session() as db:
        path = db.get(PhotoScreening, d["id"]).image_path
    assert os.path.exists(path) and "my_face" not in path
    assert len(Image.open(path).getexif()) == 0
    assert client.get(f"/photos/{d['id']}/image", headers=users["doctor"]["headers"]).status_code == 200
    assert client.get(f"/photos/{d['id']}/image", headers=users["patient"]["headers"]).status_code == 403


def test_withdrawal_deletes_the_stored_image(client, users, good, Session):
    c = grant(client, users)
    d = post_photo(client, users["patient"]["headers"], send_to_doctor="true").json()
    with Session() as db:
        path = db.get(PhotoScreening, d["id"]).image_path
    client.delete(f"/consents/{c['id']}", headers=users["patient"]["headers"])
    assert not os.path.exists(path)


def test_case_links_retained_photo_but_not_a_discarded_one(client, users, good):
    grant(client, users)
    h = users["patient"]["headers"]
    intake = make_intake(client, users)
    discarded = post_photo(client, h).json()
    r = client.post("/cases", json={"intake_id": intake["id"], "photo_id": discarded["id"]}, headers=h)
    assert r.status_code == 409
    kept = post_photo(client, h, send_to_doctor="true").json()
    case = make_case(client, users, intake=intake, photo_id=kept["id"])
    assert case["ai_flag"] == "suspicious"


def test_ai_output_never_sets_risk_urgency_or_emergency(client, users, monkeypatch, good):
    grant(client, users)
    monkeypatch.setattr(photos_mod, "_call_classifier", lambda b: {
        "label": "urgent referral", "confidence": 0.99, "is_mouth": True})
    h = users["patient"]["headers"]
    intake = make_intake(client, users, age=30, tobacco="none", betel_quid=False)
    assert intake["risk_level"] == "Low"
    photo = post_photo(client, h, send_to_doctor="true").json()
    case = make_case(client, users, intake=intake, photo_id=photo["id"])
    assert case["ai_flag"] == "urgent referral"
    assert case["risk_level"] == "Low" and case["urgency"] == "routine" and case["emergency"] is False
