# Nirmay: Limits and Bias Statement

Current workspace status: the photo model, dataset, and measured evaluation results are not present. The photo screener must report `demo placeholder` or `unavailable` until a real model has been trained and evaluated. All model metrics remain `TBD`.

Screening aid, not diagnosis. A clinician confirms or overrides every flagged case.

Fill every `TBD` from measured results before presenting.

## What Nirmay is and is not

- It is a screening aid that helps decide who should see a doctor and how soon.
- It is not a diagnostic tool, and it does not replace a clinician.
- Risk level, urgency and emergency escalation are deterministic rules. AI is used only for perception (photo), language (explanations) and speech.

## Data limits

- Public oral-lesion datasets are small and skewed. Class counts: TBD.
- Training data may under-represent some skin tones, lighting conditions, camera types, regions and disease stages. Known skew: TBD.
- Results are reported per class (sensitivity), not only accuracy, because accuracy hides weak classes.
- No real patient data was used in this project.

## Model limits

- Oral cancer only on the photo path. Other cancers use rules only.
- The model can miss disease (false negatives) and flag healthy tissue (false positives). Per-class numbers: see `model_card.md`.
- Photos that fail the quality gate or the "is this a mouth" check are refused, not guessed.
- Below the confidence threshold the system says "not sure, please see a doctor".
- Confidence values are calibrated on a small held-out set and may not hold on new devices or populations.

## Rules limits

- All thresholds in `oral.yaml` are marked PENDING CLINICIAN REVIEW until a qualified clinician signs them off. Reviewer: TBD. Date: TBD.
- Intake collects only what the rules use (data minimisation). Missing or wrong answers change the result.

## Language and speech limits

- Explanations are rewritten by an LLM from a structured result, with template fallback. The LLM never changes risk, urgency or emergency flags.
- Speech (Hindi, Kannada, English) can mishear. Text is always available.

## Privacy and data handling

- The model runs on the server (ONNX Runtime). Photos are sent to the server. Retention: TBD. Images are deleted after prediction unless sent to a doctor.
- Say "on-device" only if it truly runs in the browser or phone.
- Consent is required before processing. Withdrawal stops processing and queues deletion.
- Demo video calls use public Jitsi, which is not suitable for real patient data. Production needs self-hosted Jitsi or a signed-token service, with consent before the call and no recording.
- Legal obligations for health data (for example India's DPDP Act, 2023) need qualified review. Nirmay does not claim compliance.

## Mock and placeholder content

Anything not real is labelled `demo data` or `demo placeholder` inside the API response, including the hotspot map, funnel, camp mode and QR card.

## Required before any real-world use

1. Clinician sign-off on all rules and thresholds.
2. Validation on representative real data, with ethics approval.
3. Review of bias across skin tone, age, sex, region and device.
4. Legal and privacy review.
5. Production-grade hosting, authentication and consent-gated recording.
