"""Explanation and curated FAQ routes owned by Member 2."""

from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.llm.explainer import explain_result
from app.services.llm.faq import DISCLAIMER, get_faq_answer

router = APIRouter(tags=["explain"])


class ExplainRequest(BaseModel):
    result: dict[str, Any] = Field(description="Structured result produced by the rules and screening services")


@router.post("/explain")
def explain(request: ExplainRequest) -> dict[str, Any]:
    """Return plain-language text alongside the unchanged structured result."""
    structured_result = request.result
    explanation = explain_result(structured_result)
    if DISCLAIMER not in explanation:
        explanation = f"{explanation} {DISCLAIMER}"
    return {"result": structured_result, "explanation": explanation}


@router.get("/explain/faq/{question_id}")
def answer_faq(question_id: str) -> dict[str, str]:
    answer = get_faq_answer(question_id)
    if answer is None:
        raise HTTPException(status_code=404, detail="Question is not in the curated FAQ.")
    return {"answer": answer}
