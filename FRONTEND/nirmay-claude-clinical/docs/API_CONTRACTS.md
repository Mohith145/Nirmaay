# API contracts assumed by `claude-clinical`

**None of these were taken from the blueprint (it was not available when this was written).** Every path is isolated in one wrapper file. Replace with the documented endpoints and shapes; nothing else needs to change.

| Wrapper | Call | Expected response (fields the UI reads) |
|---|---|---|
| `features/doctor/api/doctorApi.js` | `GET /doctor/dashboard` | `{ stats:{pendingReview,urgent,todayAppointments,reviewedToday}, queuePreview:[case], upcomingAppointments:[{id,consultationId,patientName,scheduledAt,status}] }` |
| | `GET /doctor/cases?status&priority&q` | `[case]` or `{items:[case]}`; case = `{id,patientName?,patientRef?,age,source,status,priority,aiFlag,submittedAt}` |
| | `GET /doctor/cases/:id` | case + `{patient:{id,name,age,sex,contact}, screening:{aiFlag,aiNote,confidence 0-1}, images:[{id,url,label}], clinical:{symptoms,riskFactors,notes}, history:[{date,event}], decisionOptions?:[{value,label}], decision?:{decision,notes,followUpDate,patientMessage}}` |
| | `POST /doctor/cases/:id/decision` | body `{decision,notes,followUpDate|null,patientMessage|null}` -> `{status?}` |
| | `GET /doctor/patients` | `[{id,name}]` or `{items:[...]}` |
| | `POST /doctor/appointments` | body `{patientId,caseId?,scheduledAt(ISO),durationMinutes,reason?}` -> `{consultationId,scheduledAt}` (UI refuses to show success if `consultationId` is missing) |
| `features/video/api/consultationApi.js` | `GET /consultations/:id` | `{id,roomId,status:"scheduled"\|"live"\|"ended",scheduledAt,doctorName,patientName}`; 403/404 => "invalid or unavailable" |
| | `POST /consultations/:id/start` | **doctor only, enforced server-side** -> `{status:"live",roomId}` |
| | `POST /consultations/:id/end` | doctor only -> `{status:"ended"}` |
| `features/insights/api/insightsApi.js` | `GET /insights/{overview,funnel,hotspots,camps,qr}` | shapes mirror `features/insights/demoData.js` |

Other assumptions: thrown errors expose `message` and (optionally) `status`; the shared `api` client exposes `get(path)` / `post(path, body)`; user object is `{id,name,role}` with roles `doctor`, `patient`, `admin`.

`roomId` must be an opaque, unguessable, server-generated value. The UI never derives a room name from patient data.
