"""Voice routes with an honest text-only fallback until providers are configured."""

from typing import Annotated

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import BaseModel

from app.services.speech.stt import speech_to_text
from app.services.speech.tts import text_to_speech

router = APIRouter(prefix="/voice", tags=["voice"])


class TTSRequest(BaseModel):
    text: str
    language: str


@router.post("/stt")
async def stt(
    file: Annotated[UploadFile, File()],
    language: Annotated[str, Form()] = "en",
):
    try:
        return speech_to_text(
            await file.read(),
            language,
            filename=file.filename or "recording.wav",
            content_type=file.content_type or "application/octet-stream",
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.post("/tts")
def tts(request: TTSRequest):
    try:
        return text_to_speech(request.text, request.language)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
