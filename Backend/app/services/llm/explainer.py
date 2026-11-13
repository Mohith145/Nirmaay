"""Structured-result explanations with a safe template fallback."""

from __future__ import annotations

import json
from collections.abc import Mapping
from typing import Any

import httpx

from app.services.llm.settings import LLMSettings

DISCLAIMER = "Screening aid, not diagnosis."


def _template(result: Mapping[str, Any]) -> str:
    risk = str(result.get("risk_level") or "not available")
    reasons = result.get("reasons") or []
    if isinstance(reasons, str):
        reasons = [reasons]
    reason_text = "; ".join(str(reason) for reason in reasons) or "No reasons were provided."
    next_step = str(result.get("recommended_test") or result.get("next_step") or "Speak with a clinician.")
    return (
        f"Your screening result is {risk}. {reason_text} "
        f"Suggested next step: {next_step} {DISCLAIMER}"
    )


def explain_result(
    result: Mapping[str, Any],
    *,
    api_key: str | None = None,
    endpoint: str | None = None,
    model: str | None = None,
    transport: httpx.BaseTransport | None = None,
    settings: LLMSettings | None = None,
) -> str:
    """Explain a structured result; never return or change its decision fields."""
    config = settings or LLMSettings.from_env()
    key = api_key or config.api_key
    if not key:
        return _template(result)

    payload = {
        "model": model or config.model,
        "temperature": 0.2,
        "messages": [
            {
                "role": "system",
                "content": (
                    "Rewrite the supplied structured screening result in simple, calm language. "
                    "Do not add facts or change risk, urgency, emergency status, or next steps. "
                    f"Append exactly: {DISCLAIMER}"
                ),
            },
            {"role": "user", "content": json.dumps(dict(result), ensure_ascii=False)},
        ],
    }
    try:
        with httpx.Client(
            timeout=config.timeout_seconds,
            transport=transport,
        ) as client:
            response = client.post(
                endpoint or config.endpoint,
                headers={"Authorization": f"Bearer {key}"},
                json=payload,
            )
            response.raise_for_status()
            explanation = response.json()["choices"][0]["message"]["content"]
            if not isinstance(explanation, str) or not explanation.strip():
                return _template(result)
            explanation = explanation.strip()
            if DISCLAIMER not in explanation:
                explanation = f"{explanation} {DISCLAIMER}"
            return explanation
    except (httpx.HTTPError, KeyError, IndexError, TypeError, ValueError):
        return _template(result)
