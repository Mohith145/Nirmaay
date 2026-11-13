"""Sarvam text-to-speech with a text-only fallback."""

import base64

import httpx

from .settings import LANGUAGE_CODES, SpeechSettings
from .stt import SUPPORTED_LANGUAGES

DISCLAIMER = "Screening aid, not diagnosis."


def text_to_speech(
    text: str,
    language: str,
    *,
    settings: SpeechSettings | None = None,
    transport: httpx.BaseTransport | None = None,
) -> dict[str, object]:
    if language not in SUPPORTED_LANGUAGES:
        raise ValueError("Language must be one of: hi, kn, en.")
    if not text.strip():
        raise ValueError("Text must not be empty.")
    spoken_text = text.strip()
    if DISCLAIMER not in spoken_text:
        spoken_text = f"{spoken_text} {DISCLAIMER}"
    config = settings or SpeechSettings.from_env()
    if config.api_key:
        try:
            with httpx.Client(timeout=config.timeout_seconds, transport=transport) as client:
                response = client.post(
                    f"{config.base_url}/text-to-speech",
                    headers={"api-subscription-key": config.api_key},
                    json={
                        "model": "bulbul:v3",
                        "text": spoken_text,
                        "language_code": LANGUAGE_CODES[language],
                        "output_audio_codec": "wav",
                    },
                )
                response.raise_for_status()
                audios = response.json().get("audios", [])
                if audios and isinstance(audios[0], str):
                    audio_bytes = base64.b64decode(audios[0], validate=True)
                    return {
                        "available": True,
                        "mode": "audio",
                        "text": spoken_text,
                        "audio_base64": base64.b64encode(audio_bytes).decode("ascii"),
                        "audio_content_type": "audio/wav",
                        "disclaimer": DISCLAIMER,
                    }
        except (httpx.HTTPError, ValueError, TypeError):
            pass
    return {
        "available": False,
        "mode": "text_only",
        "text": spoken_text,
        "audio": None,
        "message": "Speech playback is unavailable; the text is shown instead.",
        "placeholder": "demo placeholder",
        "disclaimer": "Screening aid, not diagnosis.",
    }
