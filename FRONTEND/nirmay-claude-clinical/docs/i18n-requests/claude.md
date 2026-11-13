# i18n requests - Claude clinical modules (`claude-clinical`)

Add these keys to the shared EN / HI / KN dictionaries. The code calls `t(key, englishFallback)`, so missing translations render English rather than a raw key.

**Status:** Hindi/Kannada below are draft translations for the most visible labels only. Cells marked `TODO` still need translation. **All drafts need review by a native-speaker clinician/translator before release.**

Dynamic keys (also needed): `doctor.status.<status>`, `doctor.priority.<priority>`, `insights.camp.<status>` for every status/priority value the API returns (documented values: pending, in_review, reviewed, follow_up, scheduled, live, ended; urgent, high, routine; upcoming, completed).

| Key | English | Hindi | Kannada |
|---|---|---|---|
| `doctor.err.patient` | Choose a patient. | TODO | TODO |
| `doctor.err.date` | Choose a date. | TODO | TODO |
| `doctor.err.time` | Choose a time. | TODO | TODO |
| `doctor.err.past` | Choose a time in the future. | TODO | TODO |
| `doctor.err.noConsultationId` | The server did not return a Consultation ID. The appointment was not confirmed. | TODO | TODO |
| `doctor.err.appointment` | The appointment could not be created. Please try again. | TODO | TODO |
| `doctor.appointment.created` | Consultation scheduled | TODO | TODO |
| `doctor.appointment.consultationId` | Consultation ID | परामर्श आईडी | ಸಮಾಲೋಚನೆ ಐಡಿ |
| `common.copied` | Copied | कॉपी हो गया | ನಕಲಾಗಿದೆ |
| `common.copy` | Copy | कॉपी करें | ನಕಲಿಸಿ |
| `doctor.appointment.shareHint` | The patient can join using this ID once you start the consultation. They cannot start it. | TODO | TODO |
| `doctor.appointment.goToRoom` | Go to consultation | TODO | TODO |
| `doctor.dashboard.title` | Doctor dashboard | डॉक्टर डैशबोर्ड | ವೈದ್ಯರ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ |
| `doctor.appointment.patient` | Patient | TODO | TODO |
| `doctor.decision.choose` | Select... | TODO | TODO |
| `doctor.appointment.date` | Date | तारीख | ದಿನಾಂಕ |
| `doctor.appointment.time` | Time | समय | ಸಮಯ |
| `doctor.appointment.duration` | Duration (min) | TODO | TODO |
| `doctor.appointment.reason` | Reason / notes (optional) | TODO | TODO |
| `doctor.case.id` | Case ID | TODO | TODO |
| `doctor.appointment.create` | Schedule consultation | TODO | TODO |
| `doctor.newAppointment` | Schedule consultation | परामर्श निर्धारित करें | ಸಮಾಲೋಚನೆ ನಿಗದಿಪಡಿಸಿ |
| `doctor.appointment.subtitle` | Only doctors can schedule and start consultations. | TODO | TODO |
| `doctor.case.notFound` | Case not found. | TODO | TODO |
| `doctor.case.image` | Screening image | TODO | TODO |
| `doctor.case.title` | Case | TODO | TODO |
| `doctor.queue.title` | Clinical queue | क्लिनिकल कतार | ಕ್ಲಿನಿಕಲ್ ಸರದಿ |
| `doctor.case.patient` | Patient | TODO | TODO |
| `doctor.case.age` | Age | TODO | TODO |
| `doctor.case.sex` | Sex | TODO | TODO |
| `doctor.case.contact` | Contact | TODO | TODO |
| `doctor.case.submitted` | Submitted | TODO | TODO |
| `doctor.case.source` | Source | TODO | TODO |
| `doctor.case.images` | Screening images | TODO | TODO |
| `doctor.case.noImages` | No images were submitted with this case. | TODO | TODO |
| `doctor.case.clinical` | Clinical information | TODO | TODO |
| `doctor.case.symptoms` | Reported symptoms | TODO | TODO |
| `doctor.case.riskFactors` | Risk factors | TODO | TODO |
| `doctor.case.notes` | Notes | TODO | TODO |
| `doctor.case.history` | Case history | TODO | TODO |
| `doctor.case.noHistory` | No earlier activity on this case. | TODO | TODO |
| `doctor.case.ai` | AI screening result | TODO | TODO |
| `doctor.case.aiFlag` | Screening flag | TODO | TODO |
| `doctor.aiFlagged` | AI-flagged for review | TODO | TODO |
| `doctor.aiNotFlagged` | Not flagged | TODO | TODO |
| `doctor.case.aiNote` | Model note | TODO | TODO |
| `doctor.case.confidence` | Model confidence | TODO | TODO |
| `doctor.queue.search` | Search cases | TODO | TODO |
| `doctor.filter.status` | Status | TODO | TODO |
| `doctor.filter.allStatuses` | All statuses | TODO | TODO |
| `doctor.filter.priority` | Priority | TODO | TODO |
| `doctor.filter.allPriorities` | All priorities | TODO | TODO |
| `doctor.queue.noMatch` | No cases match these filters | TODO | TODO |
| `doctor.queue.empty` | No cases waiting for review | TODO | TODO |
| `doctor.queue.noMatchHint` | Clear a filter to see more cases. | TODO | TODO |
| `doctor.reviewQueue` | Review queue | समीक्षा कतार | ಪರಿಶೀಲನಾ ಸರದಿ |
| `doctor.err.decision` | Choose a decision. | TODO | TODO |
| `doctor.err.notes` | Add clinical notes (at least 10 characters). | TODO | TODO |
| `doctor.err.followUpDate` | Choose a follow-up date. | TODO | TODO |
| `doctor.err.submit` | The decision could not be submitted. Your entries are kept - please try again. | TODO | TODO |
| `doctor.decision.update` | Update clinical decision | TODO | TODO |
| `doctor.decision.title` | Clinical decision | नैदानिक निर्णय | ವೈದ್ಯಕೀಯ ನಿರ್ಧಾರ |
| `doctor.decision.label` | Decision | TODO | TODO |
| `doctor.decision.notes` | Clinical notes | नैदानिक टिप्पणियाँ | ವೈದ್ಯಕೀಯ ಟಿಪ್ಪಣಿಗಳು |
| `doctor.decision.followUp` | Schedule a follow-up | TODO | TODO |
| `doctor.decision.followUpDate` | Follow-up date | TODO | TODO |
| `doctor.decision.patientMessage` | Message for the patient (optional) | TODO | TODO |
| `doctor.decision.saved` | Decision submitted. | TODO | TODO |
| `doctor.decision.submit` | Submit decision | निर्णय जमा करें | ನಿರ್ಧಾರ ಸಲ್ಲಿಸಿ |
| `doctor.stat.pending` | Pending review | TODO | TODO |
| `doctor.stat.urgent` | Urgent | TODO | TODO |
| `doctor.stat.today` | Consultations today | TODO | TODO |
| `doctor.stat.reviewed` | Reviewed today | TODO | TODO |
| `doctor.viewAll` | View all | TODO | TODO |
| `doctor.upcoming` | Upcoming consultations | TODO | TODO |
| `doctor.appointments.empty` | No consultations scheduled | TODO | TODO |
| `doctor.open` | Open | TODO | TODO |
| `doctor.quickActions` | Quick actions | TODO | TODO |
| `doctor.openQueue` | Open clinical queue | TODO | TODO |
| `insights.title` | Insights | इनसाइट्स | ಇನ್ಸೈಟ್ಸ್ |
| `doctor.dashboard.subtitle` | Cases awaiting review and upcoming consultations | TODO | TODO |
| `common.loading` | Loading... | लोड हो रहा है... | ಲೋಡ್ ಆಗುತ್ತಿದೆ... |
| `common.error` | Something went wrong. | TODO | TODO |
| `common.retry` | Try again | फिर कोशिश करें | ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ |
| `common.noAccess` | You don't have access to this page | TODO | TODO |
| `common.signInRequired` | Please sign in to continue. | TODO | TODO |
| `common.roleRequired` | This area is only available to authorised clinical staff. | TODO | TODO |
| `common.home` | Back to home | होम पर वापस जाएँ | ಮುಖಪುಟಕ್ಕೆ ಹಿಂತಿರುಗಿ |
| `doctor.aiDisclaimer` | AI screening flags are decision-support only. They are not a diagnosis. The clinical decision is yours. | TODO | TODO |
| `common.demoData` | Demonstration data - not verified real-world results. | TODO | TODO |
| `insights.demoBanner` | Demonstration data: live analytics could not be loaded, so sample figures are shown. They are not verified real-world results. | TODO | TODO |
| `insights.subtitle` | Screening activity, hotspots, camps and QR engagement | TODO | TODO |
| `insights.screenings` | Screenings | स्क्रीनिंग | ಸ್ಕ್ರೀನಿಂಗ್‌ಗಳು |
| `insights.aiFlagged` | AI-flagged | एआई-चिह्नित | ಎಐ-ಗುರುತಿಸಿದ |
| `insights.sentForReview` | Sent for review | TODO | TODO |
| `insights.reviewed` | Reviewed | समीक्षित | ಪರಿಶೀಲಿಸಲಾಗಿದೆ |
| `insights.pending` | Pending | लंबित | ಬಾಕಿ |
| `insights.weekly` | Screenings per week | TODO | TODO |
| `insights.unit.screenings` | Number of screenings | TODO | TODO |
| `insights.flagNote` | "AI-flagged" means the screening model marked an image for doctor review. It is not a diagnosis. | TODO | TODO |
| `insights.funnel` | Screening funnel | TODO | TODO |
| `insights.ofScreened` | of screened | TODO | TODO |
| `insights.fromPrevious` | from previous step | TODO | TODO |
| `insights.hotspots` | Flag-rate hotspots | TODO | TODO |
| `insights.hotspotPlotLabel` | Schematic plot of regions; larger circles have a higher AI-flag rate | TODO | TODO |
| `insights.schematic` | Schematic view, not to scale. Larger and redder = higher share of screenings flagged for review. | TODO | TODO |
| `insights.byRegion` | By region | TODO | TODO |
| `insights.region` | Region | TODO | TODO |
| `insights.rate` | Rate | TODO | TODO |
| `insights.camps.empty` | No screening camps recorded yet. | TODO | TODO |
| `insights.qr.scans` | QR scans | TODO | TODO |
| `insights.qr.unique` | Unique visitors | TODO | TODO |
| `insights.qr.started` | Started screening | TODO | TODO |
| `insights.qr.byDay` | Scans by day | TODO | TODO |
| `insights.qr.bySource` | Scans by source | TODO | TODO |
| `video.testDevices` | Test camera and microphone | TODO | TODO |
| `video.devicesOk` | Camera and microphone are ready. | TODO | TODO |
| `video.devicesDenied` | Access was blocked. Allow camera and microphone in your browser's site settings, then test again. You can still join and listen. | TODO | TODO |
| `video.devicesUnavailable` | This browser can't access a camera or microphone. Use a supported browser or join audio-only from another device. | TODO | TODO |
| `video.connected` | Connected | जुड़ा हुआ | ಸಂಪರ್ಕಗೊಂಡಿದೆ |
| `video.connecting` | Connecting... | जुड़ रहे हैं... | ಸಂಪರ್ಕಿಸಲಾಗುತ್ತಿದೆ... |
| `video.connectionProblem` | Connection problem | TODO | TODO |
| `video.inCall` | in call | TODO | TODO |
| `video.unmute` | Unmute microphone | माइक्रोफ़ोन चालू करें | ಮೈಕ್ರೋಫೋನ್ ಆನ್ ಮಾಡಿ |
| `video.mute` | Mute microphone | माइक्रोफ़ोन म्यूट करें | ಮೈಕ್ರೋಫೋನ್ ಮ್ಯೂಟ್ ಮಾಡಿ |
| `video.cameraOn` | Turn camera on | कैमरा चालू करें | ಕ್ಯಾಮೆರಾ ಆನ್ ಮಾಡಿ |
| `video.cameraOff` | Turn camera off | कैमरा बंद करें | ಕ್ಯಾಮೆರಾ ಆಫ್ ಮಾಡಿ |
| `video.loading` | Loading consultation... | TODO | TODO |
| `video.title` | Video consultation | वीडियो परामर्श | ವೀಡಿಯೊ ಸಮಾಲೋಚನೆ |
| `video.invalid` | This consultation is invalid or not available to you. Check the Consultation ID with your doctor. | TODO | TODO |
| `video.patient` | Patient | TODO | TODO |
| `video.startFailed` | The consultation could not be started. | TODO | TODO |
| `video.endFailed` | The consultation could not be ended. You are still connected. | TODO | TODO |
| `video.scriptFailed` | The video service could not be loaded. Check your connection and try again. | TODO | TODO |
| `video.genericError` | A video error occurred. | TODO | TODO |
| `video.ended` | This consultation has ended. | TODO | TODO |
| `video.back` | Back | TODO | TODO |
| `video.noRoom` | No video room is assigned to this consultation yet. Please contact support. | TODO | TODO |
| `video.demoBanner` | Demonstration video service (public Jitsi). Do not use it for real patient consultations - production requires a secured, privately hosted video service. Calls are not recorded. | TODO | TODO |
| `video.reconnect` | Reconnect | फिर से जुड़ें | ಮತ್ತೆ ಸಂಪರ್ಕಿಸಿ |
| `video.endCall` | End consultation | परामर्श समाप्त करें | ಸಮಾಲೋಚನೆ ಮುಗಿಸಿ |
| `video.leave` | Leave | छोड़ें | ಬಿಟ್ಟುಹೋಗಿ |
| `video.fallbackHint` | If video keeps failing, end the call and continue by phone, or reschedule. | TODO | TODO |
| `video.reenter` | Re-enter consultation | TODO | TODO |
| `video.start` | Start consultation | परामर्श शुरू करें | ಸಮಾಲೋಚನೆ ಪ್ರಾರಂಭಿಸಿ |
| `video.doctorOnly` | Only you can start this consultation. The patient joins once it is live. | TODO | TODO |
| `video.join` | Join consultation | परामर्श में जुड़ें | ಸಮಾಲೋಚನೆಗೆ ಸೇರಿ |
| `video.doctorReady` | Your doctor has started the consultation. | TODO | TODO |
| `video.waiting` | Waiting for your doctor to start the consultation. This page updates automatically. | डॉक्टर के परामर्श शुरू करने की प्रतीक्षा है। यह पृष्ठ अपने-आप अपडेट होगा। | ವೈದ್ಯರು ಸಮಾಲೋಚನೆ ಪ್ರಾರಂಭಿಸಲು ಕಾಯಲಾಗುತ್ತಿದೆ. ಈ ಪುಟ ತಾನಾಗಿಯೇ ಅಪ್‌ಡೇಟ್ ಆಗುತ್ತದೆ. |
| `video.refreshFailed` | Couldn't refresh the consultation status. Retrying... | TODO | TODO |
| `video.err.idRequired` | Enter the Consultation ID your doctor gave you. | TODO | TODO |
| `video.joinTitle` | Join a consultation | TODO | TODO |
| `video.joinHint` | Only your doctor can start a consultation. You will join once it is live. | TODO | TODO |
