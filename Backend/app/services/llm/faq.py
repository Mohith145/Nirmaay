"""Small, curated FAQ set for the demo; answers never come from an LLM."""

DISCLAIMER = "Screening aid, not diagnosis."

FAQ: dict[str, str] = {
    "what-is-nirmay": "Nirmay is a screening aid that can help people decide when to seek care.",
    "is-this-a-diagnosis": "No. A qualified clinician makes diagnosis and treatment decisions.",
    "who-reviews-flags": "A clinician should review every case flagged for follow-up.",
    "who-decides-risk": "The screening rules determine risk and urgency; the language model does not.",
    "what-if-photo-blurry": "The photo check may ask you to retake a blurry, dark, or poorly framed image.",
    "what-if-not-sure": "If the photo result is uncertain, seek advice from a clinician.",
    "photo-scope": "The photo screener is intended for oral images only; other cancer pathways use rules.",
    "can-ai-change-urgency": "No. AI explanations cannot change risk, urgency, or emergency decisions.",
    "what-if-ai-unavailable": "A prepared explanation can be shown when the language service is unavailable.",
    "is-photo-on-device": "In this demo, photos are processed by the server, not on the device.",
}


def get_faq_answer(question_id: str) -> str | None:
    answer = FAQ.get(question_id)
    return f"{answer} {DISCLAIMER}" if answer else None
