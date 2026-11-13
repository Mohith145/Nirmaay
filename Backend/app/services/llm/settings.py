"""Environment-backed settings for the LLM client; secrets are never logged."""

from __future__ import annotations

import os
from collections.abc import Mapping
from dataclasses import dataclass

DEFAULT_ENDPOINT = "https://api.openai.com/v1/chat/completions"
DEFAULT_MODEL = "gpt-4o-mini"
DEFAULT_TIMEOUT_SECONDS = 4.0


@dataclass(frozen=True)
class LLMSettings:
    api_key: str | None
    endpoint: str
    model: str
    timeout_seconds: float

    @classmethod
    def from_env(cls, environ: Mapping[str, str] | None = None) -> LLMSettings:
        values = os.environ if environ is None else environ
        try:
            timeout = float(values.get("LLM_TIMEOUT_SECONDS", DEFAULT_TIMEOUT_SECONDS))
        except ValueError as exc:
            raise ValueError("LLM_TIMEOUT_SECONDS must be a number between 3 and 5.") from exc
        if not 3 <= timeout <= 5:
            raise ValueError("LLM_TIMEOUT_SECONDS must be between 3 and 5 seconds.")
        return cls(
            api_key=values.get("LLM_API_KEY") or None,
            endpoint=values.get("LLM_API_URL", DEFAULT_ENDPOINT),
            model=values.get("LLM_MODEL", DEFAULT_MODEL),
            timeout_seconds=timeout,
        )
