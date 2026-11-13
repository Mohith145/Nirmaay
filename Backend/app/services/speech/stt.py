"""Sarvam speech recognition with a text-only fallback."""

import httpx

from .settings import LANGUAGE_CODES, SpeechSettings

SUPPORTED_LANGUAGES = {"hi", "kn", "en"}


def speech_to_text(
    audio: bytes,
    language: str,
    *,
    filename: str = "recording.wav",
    content_type: str = "audio/wav",
    settings: SpeechSettings | None = None,
    transport: httpx.BaseTransport | None = None,
) -> dict[str, object]:
    if language not in SUPPORTED_LANGUAGES:
        raise ValueError("Language must be one of: hi, kn, en.")
    if not audio:
        raise ValueError("Audio upload is empty.")
    config = settings or SpeechSettings.from_env()
    if config.api_key:
        try:
            with httpx.Client(timeout=config.timeout_seconds, transport=transport) as client:
                response = client.post(
                    f"{config.base_url}/speech-to-text",
                    headers={"api-subscription-key": config.api_key},
                    data={
                        "model": "saaras:v4",
                        "mode": "transcribe",
                        "language_code": LANGUAGE_CODES[language],
                    },
                    files={"file": (filename, audio, content_type)},
                )
                response.raise_for_status()
                body = response.json()
                transcript = body.get("transcript")
                if isinstance(transcript, str) and transcript.strip():
                    return {
                        "available": True,
                        "mode": "transcribed",
                        "text": transcript.strip(),
                        "language": body.get("language_code") or LANGUAGE_CODES[language],
                        "disclaimer": "Screening aid, not diagnosis.",
                    }
        except (httpx.HTTPError, ValueError):
            pass
    return {
        "available": False,
        "mode": "text_only",
        "text": None,
        "message": "Speech recognition is unavailable; please enter the text instead.",
        "placeholder": "demo placeholder",
        "disclaimer": "Screening aid, not diagnosis.",
    }
