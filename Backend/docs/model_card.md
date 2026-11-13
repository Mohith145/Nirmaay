# Nirmay Photo Screener: Model Card

Screening aid, not diagnosis. A clinician confirms or overrides every flagged case.

Status: DEMO PLACEHOLDER. No trained model or oral-lesion dataset is present in the current workspace. The photo classifier is not available, and no performance results have been measured. Every value marked `TBD` must be filled from a real training and held-out evaluation before it is said on stage. Do not publish numbers that are not measured. The API must label the screener `demo placeholder` while the model is unavailable.

## Model details

| Field | Value |
| --- | --- |
| Name | Nirmay oral photo screener |
| Version | TBD (matches `model_version` stored in `photo_screenings`) |
| Architecture | TBD (EfficientNet-B0 or MobileNetV3, fine-tuned) |
| Classes | normal, suspicious, urgent referral (at most 3), plus a "not sure" outcome by threshold |
| Input | TBD x TBD pixels, RGB, normalisation: TBD (must match the server exactly) |
| Serving | ONNX Runtime on CPU, loaded once at startup |
| Explainability | Grad-CAM heatmap |
| Calibration | Temperature scaling, T = TBD |
| "Not sure" threshold | TBD (confidence below this returns "not sure, please see a doctor") |
| Cancer scope | Oral cancer only. Lung, liver, esophagus and stomach use rules only. |

## Intended use

- Support a health worker or patient in deciding whether to see a doctor soon.
- Output goes to a clinician queue with the photo, heatmap and AI flag.

## Out of scope

- Diagnosis, staging or treatment decisions.
- Use without clinician review.
- Photos that are not of the inside of the mouth. These are refused by the quality gate and the "is this a mouth" check.
- Any cancer other than oral.

## Pipeline

1. Upload checks: size and type limits, EXIF stripped, random filename.
2. Quality gate: blur (Laplacian variance), brightness, framing. Failure returns 422 with a reason and retake tip. The classifier does not run.
3. "Is this a mouth" check: TBD method (low confidence or entropy, zero-shot CLIP, or a not_mouth class).
4. Classifier with calibrated confidence.
5. Below threshold: "not sure". Otherwise class, confidence and heatmap.
6. Image deleted after prediction unless sent to a doctor. Retention decision: TBD.

Risk level, urgency and emergency escalation never come from this model. They come from the rules engine.

## Data

| Item | Value |
| --- | --- |
| Sources | TBD (list each public dataset, link, licence) |
| Total images | TBD |
| Split | TBD, by patient or source where possible |
| Class balance | TBD per class |
| Known skew | TBD (skin tone, lighting, device, geography, disease stage) |
| Real patient data in this project | None. Synthetic and public data only. |

## Evaluation

Held-out test set only. Report per-class results, not just accuracy.

| Class | Sensitivity | Specificity | Test images |
| --- | --- | --- | --- |
| normal | TBD | TBD | TBD |
| suspicious | TBD | TBD | TBD |
| urgent referral | TBD | TBD | TBD |

Overall accuracy: TBD. Calibration error: TBD.

## Quality gate results

Tested on 20 sample photos (clear mouth, blurry, dark, non-mouth): TBD correct of 20.

## Known limits

See `limits_and_bias.md`.

## Failure behavior

- Model missing or slow: the screener returns "unavailable, see a doctor" and the rest of the flow keeps working.
- Low confidence: "not sure, please see a doctor".

## Review

| Item | Status |
| --- | --- |
| Clinician reviewer | TBD |
| Review date | TBD |
