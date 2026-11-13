import base64

import httpx
import pytest

from app.services.speech.settings import SpeechSettings
from app.services.speech.stt import speech_to_text
from app.services.speech.tts import text_to_speech

FALLBACK_SETTINGS = SpeechSettings(api_key=None, base_url="https://api.sarvam.ai", timeout_seconds=4)


@pytest.mark.parametrize("language", ["hi", "kn", "en"])
def test_speech_services_return_text_only_fallback(language):
    stt_result = speech_to_text(b"audio bytes", language, settings=FALLBACK_SETTINGS)
    tts_result = text_to_speech("A screening result", language, settings=FALLBACK_SETTINGS)

    assert stt_result["mode"] == "text_only"
    assert tts_result["mode"] == "text_only"
    assert stt_result["disclaimer"] == "Screening aid, not diagnosis."
    assert tts_result["disclaimer"] == "Screening aid, not diagnosis."


def test_speech_rejects_unsupported_language():
    with pytest.raises(ValueError, match="hi, kn, en"):
        text_to_speech("Hello", "fr")


def test_sarvam_stt_success_uses_configured_language():
    def handler(request):
        assert request.headers["api-subscription-key"] == "test-key"
        assert b"kn-IN" in request.content
        return httpx.Response(200, json={"transcript": "ನಮಸ್ಕಾರ", "language_code": "kn-IN"})

    result = speech_to_text(
        b"fake audio",
        "kn",
        settings=SpeechSettings("test-key", "https://api.sarvam.ai", 4),
        transport=httpx.MockTransport(handler),
    )

    assert result["available"] is True
    assert result["text"] == "ನಮಸ್ಕಾರ"


def test_sarvam_tts_success_returns_wav_and_disclaimer():
    audio_base64 = base64.b64encode(b"RIFF-demo").decode("ascii")

    def handler(request):
        assert b"hi-IN" in request.content
        return httpx.Response(200, json={"audios": [audio_base64]})

    result = text_to_speech(
        "नमस्ते",
        "hi",
        settings=SpeechSettings("test-key", "https://api.sarvam.ai", 4),
        transport=httpx.MockTransport(handler),
    )

    assert result["available"] is True
    assert result["audio_content_type"] == "audio/wav"
    assert result["disclaimer"] == "Screening aid, not diagnosis."


def test_speech_provider_error_falls_back_to_text():
    def fail(request):
        raise httpx.ConnectError("offline", request=request)

    result = text_to_speech(
        "Hello",
        "en",
        settings=SpeechSettings("test-key", "https://api.sarvam.ai", 4),
        transport=httpx.MockTransport(fail),
    )

    assert result["mode"] == "text_only"
    assert result["text"].endswith("Screening aid, not diagnosis.")
