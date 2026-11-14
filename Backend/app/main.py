import logging
from contextlib import asynccontextmanager
from importlib import import_module

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import (
    appointments,
    auth,
    cases,
    clinician,
    consent,
    demo,
    intake,
    me,
    photos,
    quit,
    symptoms,
)
from app.core.config import get_settings
from app.core.disclaimer import DISCLAIMER
from app.core.errors import install_error_handlers
from app.db.session import init_db

log = logging.getLogger("nirmay")

# Routers owned by Member 2. Included when their file exists, so main always starts.
OPTIONAL_ROUTERS = ("explain", "voice", "whatsapp", "model_card")


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    from app.db.firestore_sync import install_firestore_sync

    install_firestore_sync()
    if get_settings().firebase_project_id:
        try:
            from app.db.firestore_sync import drain_firestore_outbox

            drain_firestore_outbox()
        except Exception as e:
            log.warning("Firestore outbox retry deferred: %s", type(e).__name__)
    # Load the model once at startup (never inside a request) if Member 2 exposes a loader.
    try:
        classifier = import_module("app.services.vision.classifier")
        loader = getattr(classifier, "load_model", None)
        if callable(loader):
            loader()
    except Exception as e:  # model missing must not stop the app
        log.warning("vision model not loaded: %s", e)
    yield


app = FastAPI(
    title="Nirmay Backend",
    version="0.1.0",
    description=f"{DISCLAIMER} All thresholds are PENDING CLINICIAN REVIEW.",
    lifespan=lifespan,
)


@app.middleware("http")
async def strip_vercel_api_prefix(request, call_next):
    """Keep the public /api namespace separate from frontend routes on Vercel."""
    path = request.scope.get("path", "")
    if path == "/api" or path.startswith("/api/"):
        stripped_path = path[4:] or "/"
        request.scope["path"] = stripped_path
        request.scope["raw_path"] = stripped_path.encode("utf-8")
    return await call_next(request)


app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
install_error_handlers(app)

for r in (auth, consent, intake, symptoms, photos, cases, clinician, appointments, quit, demo, me):
    app.include_router(r.router)

for name in OPTIONAL_ROUTERS:
    try:
        app.include_router(import_module(f"app.api.{name}").router)
    except ModuleNotFoundError as e:
        if e.name != f"app.api.{name}":  # a real import bug inside the module: do not hide it
            raise


@app.get("/health", tags=["health"])
def health():
    return {"status": "ok", "service": "nirmay-backend", "disclaimer": DISCLAIMER}
