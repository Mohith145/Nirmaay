"""POST /photos/screen: upload handling (M1) + calls into Member 2's vision services.

Expected vision interface (documented in docs/api.md), both sync, both take JPEG bytes:
  app.services.vision.quality_gate.check_quality(image_bytes) -> {ok, reason, retake_tip}
  app.services.vision.classifier.predict(image_bytes)
      -> {label, confidence, not_sure?, heatmap_b64?, model_version?, demo_placeholder?, is_mouth?}
If either is missing, errors or times out, the endpoint answers "unavailable, see a doctor".
The classifier never runs on a photo that failed the gate. AI output never sets risk or urgency.
"""

import io
import os
import uuid
from concurrent.futures import ThreadPoolExecutor
from concurrent.futures import TimeoutError as FutureTimeout
from importlib import import_module

from fastapi import APIRouter, Depends, File, Form, UploadFile
from fastapi.responses import FileResponse, Response
from PIL import Image, ImageOps, UnidentifiedImageError
from sqlalchemy.orm import Session

from app.api.deps import require_consent, resolve_subject
from app.core.audit import audit
from app.core.config import get_settings
from app.core.disclaimer import DISCLAIMER
from app.core.errors import http_error
from app.core.roles import Role
from app.core.security import require_role
from app.db.models import PhotoScreening, User
from app.db.session import get_db
from app.schemas.photo import PhotoOut

router = APIRouter(prefix="/photos", tags=["photos"])

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_FORMATS = {"JPEG", "PNG", "WEBP"}
Image.MAX_IMAGE_PIXELS = 25_000_000  # decompression-bomb guard
_executor = ThreadPoolExecutor(max_workers=4)

UNAVAILABLE_MSG = "Photo screener unavailable. Please see a doctor."
NOT_SURE_MSG = "Not sure, please see a doctor."


class ScreenerUnavailable(Exception):
    pass


def _resolve(module_path: str, names: tuple[str, ...]):
    try:
        mod = import_module(module_path)
    except ImportError as e:
        raise ScreenerUnavailable(f"{module_path} missing") from e
    for name in names:
        fn = getattr(mod, name, None)
        if callable(fn):
            return fn
    raise ScreenerUnavailable(f"no entry point in {module_path}")


def _run(fn, data: bytes):
    future = _executor.submit(fn, data)
    try:
        return future.result(timeout=get_settings().vision_timeout_seconds)
    except FutureTimeout as e:
        raise ScreenerUnavailable("timeout") from e
    except Exception as e:  # any model failure degrades gracefully
        raise ScreenerUnavailable(str(e)) from e


def _get(result, key: str, default=None):
    if isinstance(result, dict):
        return result.get(key, default)
    return getattr(result, key, default)


def _call_quality_gate(data: bytes) -> tuple[bool, str, str]:
    fn = _resolve("app.services.vision.quality_gate", ("check_quality", "check", "run_quality_gate"))
    res = _run(fn, data)
    return bool(_get(res, "ok", False)), _get(res, "reason", "") or "", _get(res, "retake_tip", "") or ""


def _call_classifier(data: bytes) -> dict:
    fn = _resolve("app.services.vision.classifier", ("predict", "classify"))
    res = _run(fn, data)
    keys = ("label", "confidence", "not_sure", "heatmap_b64", "model_version", "demo_placeholder", "is_mouth")
    return {k: _get(res, k) for k in keys}


def _clean_image(raw: bytes) -> bytes:
    """Validate by decoding (not by trusting headers), strip EXIF by re-encoding as JPEG."""
    try:
        with Image.open(io.BytesIO(raw)) as im:
            if im.format not in ALLOWED_FORMATS:
                raise http_error(415, "unsupported_image", "Upload a JPEG, PNG or WebP photo.")
            im.load()
            rgb = ImageOps.exif_transpose(im).convert("RGB")
    except (UnidentifiedImageError, OSError, ValueError, Image.DecompressionBombError):
        raise http_error(415, "unsupported_image", "That file is not a valid image.") from None
    out = io.BytesIO()
    rgb.save(out, format="JPEG", quality=90)  # no exif passed, so metadata is dropped
    return out.getvalue()


def _record(db, actor, subject, **fields) -> PhotoScreening:
    row = PhotoScreening(subject_id=subject.id, created_by_id=actor.id, **fields)
    db.add(row)
    db.flush()
    return row


@router.post("/screen", response_model=PhotoOut)
def screen_photo(
    file: UploadFile = File(...),
    patient_id: int | None = Form(None),
    send_to_doctor: bool = Form(False),
    db: Session = Depends(get_db),
    actor: User = Depends(require_role(Role.patient, Role.health_worker)),
):
    subject = resolve_subject(db, actor, patient_id)
    require_consent(db, subject)  # processing endpoint: blocked without consent

    if file.content_type not in ALLOWED_TYPES:
        raise http_error(415, "unsupported_image", "Upload a JPEG, PNG or WebP photo.")
    limit = get_settings().max_upload_bytes
    raw = file.file.read(limit + 1)
    if len(raw) > limit:
        raise http_error(413, "image_too_large", f"Photo must be under {limit // (1024 * 1024)} MB.")
    clean = _clean_image(raw)

    # 1. Quality gate. Failure -> 422, classifier never runs.
    try:
        ok, reason, tip = _call_quality_gate(clean)
    except ScreenerUnavailable:
        return _unavailable(db, actor, subject)
    if not ok:
        row = _record(db, actor, subject, status="refused", reason=reason, retake_tip=tip)
        audit(db, actor, "photo.refused", "photo", row.id, {"subject_id": subject.id})
        db.commit()
        raise http_error(422, "photo_refused", reason or "Photo quality too low.",
                         reason=reason, retake_tip=tip, disclaimer=DISCLAIMER)

    # 2. Classifier.
    try:
        res = _call_classifier(clean)
    except ScreenerUnavailable:
        return _unavailable(db, actor, subject)
    if res.get("is_mouth") is False:
        reason = "This does not look like the inside of a mouth."
        tip = "Take a clear, well-lit photo of the inside of the mouth."
        row = _record(db, actor, subject, status="refused", reason=reason, retake_tip=tip)
        audit(db, actor, "photo.refused", "photo", row.id, {"subject_id": subject.id})
        db.commit()
        raise http_error(422, "photo_refused", reason, reason=reason, retake_tip=tip, disclaimer=DISCLAIMER)

    placeholder = bool(res.get("demo_placeholder"))
    tag = " (demo placeholder)" if placeholder else ""
    if res.get("not_sure") or not res.get("label"):
        status, label, message = "not_sure", None, NOT_SURE_MSG + tag
    else:
        status, label = "ok", str(res["label"])[:40]
        message = f"Screener flag: {label}. A clinician confirms or overrides.{tag}"
    confidence = None if res.get("confidence") is None else float(res["confidence"])

    row = _record(
        db, actor, subject,
        status=status, label=label, confidence=confidence,
        heatmap_b64=res.get("heatmap_b64"), model_version=res.get("model_version"),
        demo_placeholder=placeholder,
    )
    # 3. Retention: keep the image only when it is being sent to a doctor, else it is never stored.
    if send_to_doctor:
        image_key = f"retained-screenings/{uuid.uuid4().hex}.jpg"
        if os.environ.get("VERCEL") == "1":
            try:
                from app.core.firebase import firebase_storage_bucket

                blob = firebase_storage_bucket().blob(image_key)
                blob.upload_from_string(clean, content_type="image/jpeg")
                row.image_path, row.retained = f"firebase://{image_key}", True
            except Exception:
                db.rollback()
                raise http_error(503, "image_storage_unavailable", "Secure image storage is unavailable. Please retry.") from None
        else:
            directory = get_settings().upload_dir
            os.makedirs(directory, exist_ok=True)
            path = os.path.join(directory, image_key.rsplit("/", 1)[-1])
            with open(path, "wb") as f:
                f.write(clean)
            row.image_path, row.retained = path, True
    audit(db, actor, "photo.screen", "photo", row.id, {"subject_id": subject.id, "status": status})
    db.commit()
    return PhotoOut(
        id=row.id, status=status, label=label, confidence=confidence,
        heatmap_b64=row.heatmap_b64, message=message, model_version=row.model_version,
        demo_placeholder=placeholder, retained_for_doctor=row.retained,
    )


def _unavailable(db, actor, subject) -> PhotoOut:
    row = _record(db, actor, subject, status="unavailable", reason="screener unavailable")
    audit(db, actor, "photo.unavailable", "photo", row.id, {"subject_id": subject.id})
    db.commit()
    return PhotoOut(id=row.id, status="unavailable", message=UNAVAILABLE_MSG)


@router.get("/{photo_id}/image")
def get_photo_image(
    photo_id: int,
    db: Session = Depends(get_db),
    doctor: User = Depends(require_role(Role.doctor)),
):
    row = db.get(PhotoScreening, photo_id)
    if row is None or not row.retained or not row.image_path:
        raise http_error(404, "photo_not_available", "No stored photo for this id.")
    audit(db, doctor, "photo.view", "photo", row.id, {"subject_id": row.subject_id})
    db.commit()
    if row.image_path.startswith("firebase://"):
        try:
            from app.core.firebase import firebase_storage_bucket

            key = row.image_path.removeprefix("firebase://")
            data = firebase_storage_bucket().blob(key).download_as_bytes()
        except Exception:
            raise http_error(404, "photo_not_available", "No stored photo for this id.") from None
        return Response(data, media_type="image/jpeg", headers={"Cache-Control": "private, no-store"})
    if not os.path.exists(row.image_path):
        raise http_error(404, "photo_not_available", "No stored photo for this id.")
    return FileResponse(row.image_path, media_type="image/jpeg", headers={"Cache-Control": "private, no-store"})
