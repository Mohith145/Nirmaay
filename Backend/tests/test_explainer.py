import httpx

from app.services.llm.explainer import DISCLAIMER, explain_result

RESULT = {
    "risk_level": "Medium",
    "reasons": ["A symptom was reported"],
    "recommended_test": "Consult a clinician",
    "urgency": "soon",
    "emergency": False,
}


def test_missing_key_uses_template_and_disclaimer():
    explanation = explain_result(RESULT, api_key="")

    assert "Medium" in explanation
    assert "A symptom was reported" in explanation
    assert DISCLAIMER in explanation


def test_provider_timeout_uses_template():
    def timeout_handler(request):
        raise httpx.ReadTimeout("provider timed out", request=request)

    transport = httpx.MockTransport(timeout_handler)
    explanation = explain_result(RESULT, api_key="test-key", transport=transport)

    assert "Medium" in explanation
    assert DISCLAIMER in explanation


def test_successful_explanation_gets_disclaimer():
    def handler(request):
        return httpx.Response(
            200,
            json={"choices": [{"message": {"content": "Please discuss this result with a clinician."}}]},
        )

    explanation = explain_result(
        RESULT,
        api_key="test-key",
        transport=httpx.MockTransport(handler),
    )

    assert explanation.endswith(DISCLAIMER)
