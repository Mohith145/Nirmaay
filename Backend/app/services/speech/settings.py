"""Shared speech-provider settings for Hindi, Kannada, and English."""

from __future__ import annotations

import os
from collections.abc import Mapping
from dataclasses import dataclass

DEFAULT_TIMEOUT_SECONDS = 4.0
LANGUAGE_CODES = {"hi": "hi-IN", "kn": "kn-IN", "en": "en-IN"}


@dataclass(frozen=True)
class SpeechSettings:
    api_key: str | None
    base_url: str
    timeout_seconds: float

    @classmethod
    def from_env(cls, environ: Mapping[str, str] | None = None) -> SpeechSettings:
        values = os.environ if environ is None else environ
        try:
            timeout = float(values.get("SPEECH_TIMEOUT_SECONDS", DEFAULT_TIMEOUT_SECONDS))
        except ValueError as exc:
            raise ValueError("SPEECH_TIMEOUT_SECONDS must be a number between 3 and 5.") from exc
        if not 3 <= timeout <= 5:
            raise ValueError("SPEECH_TIMEOUT_SECONDS must be between 3 and 5 seconds.")
        return cls(
            api_key=values.get("SARVAM_API_KEY") or None,
            base_url=values.get("SARVAM_API_BASE_URL", "https://api.sarvam.ai").rstrip("/"),
            timeout_seconds=timeout,
        )
