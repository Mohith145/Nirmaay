import pytest
from fastapi import HTTPException

from app.api import explain as explain_api
from app.services.llm.faq import DISCLAIMER, FAQ


def test_explain_keeps_structured_result_unchanged(monkeypatch):
    original = {"risk_level": "High", "urgency": "soon", "emergency": False}
    monkeypatch.setattr(explain_api, "explain_result", lambda result: "Talk to a clinician.")

    response = explain_api.explain(explain_api.ExplainRequest(result=original))

    assert response["result"] == original
    assert response["explanation"].endswith(DISCLAIMER)


def test_faq_only_returns_curated_answer():
    question_id = next(iter(FAQ))

    response = explain_api.answer_faq(question_id)

    assert response["answer"].endswith(DISCLAIMER)


def test_unknown_faq_question_is_rejected():
    with pytest.raises(HTTPException) as error:
        explain_api.answer_faq("not-in-faq")

    assert error.value.status_code == 404
