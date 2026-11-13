# AGENTS.md (Member 2: Vision and Language)

Read `docs/PROJECT_RULES.md` first. It holds the guardrails, folder ownership, git flow and commands for both members and both tools.

## You own

`app/services/vision`, `app/services/llm`, `app/services/speech`, `app/api/explain`, `app/api/voice`, `app/api/whatsapp`, `docs/model_card.md`, `docs/limits_and_bias.md`. Do not edit `app/core`, `app/db`, `app/services/rules` or the other member's routers; leave a note or open a tiny PR instead.

## How to work

- Add pytest tests with each change. Keep changes small and runnable.
- Quality gate: Laplacian-variance blur, brightness, framing. It returns ok plus a plain reason and retake tip. Never run the classifier on a photo that failed the gate.
- Model: temperature scaling, a "not sure" threshold, Grad-CAM, ONNX export loaded once at startup. Use the exact training image size, RGB order and normalisation in the server.
- Report sensitivity per class on the held-out set. Fill `model_card.md` only with measured numbers; anything else stays `TBD` or is labelled `demo placeholder`.
- LLM and speech calls use a 3-5 second timeout and fall back to templates or text-only. The LLM only rewrites a structured result; it never changes risk, urgency or emergency fields. Append "Screening aid, not diagnosis." to every explanation.
- FAQ answers come only from the curated FAQ of 10-15 entries.
- Branch names `m2/<topic>`. Small PRs to `main` about every 2 hours. Claude Code reviews your PRs.
- Start long training or evaluation runs before a sleep block.

## Done means

A blurry photo returns 422 with a reason, a good photo returns class, confidence and heatmap in a few seconds on CPU, stopping the model leaves the rest of the flow working, and 5 parallel photo requests do not crash.
