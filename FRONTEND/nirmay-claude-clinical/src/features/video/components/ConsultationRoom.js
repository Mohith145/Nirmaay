"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CameraOff, Loader2, Mic, MicOff, PhoneOff, RefreshCw, Video, Wifi, WifiOff } from "lucide-react";
import { useAuth, useT } from "../../doctor/adapters";
import { errorMessage } from "../../doctor/hooks/useAsync";
import {
  btnDanger, btnPrimary, btnSecondary, Card, cx, DemoBanner, ErrorState, fmtDateTime, LoadingState, PageHeader, PermissionState, StatusBadge,
} from "../../doctor/components/ui";
import { consultationApi } from "../api/consultationApi";
import JitsiStage, { IS_PUBLIC_JITSI } from "./JitsiStage";

const POLL_MS = 5000;

function useConsultation(id, active) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const load = useCallback(async () => {
    try {
      const data = await consultationApi.get(id);
      setState({ data, error: null, loading: false });
    } catch (error) {
      setState((s) => ({ data: s.data, error, loading: false }));
    }
  }, [id]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!active) return undefined;
    const timer = setInterval(load, POLL_MS);
    return () => clearInterval(timer);
  }, [active, load]);
  return { ...state, reload: load, setData: (data) => setState((s) => ({ ...s, data })) };
}

/** Optional pre-flight so a denied camera/mic is explained before the call. */
function DeviceCheck({ onResult }) {
  const t = useT();
  const [state, setState] = useState("idle"); // idle | checking | granted | denied | unavailable
  async function run() {
    if (!navigator.mediaDevices?.getUserMedia) { setState("unavailable"); onResult("unavailable"); return; }
    setState("checking");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      stream.getTracks().forEach((tr) => tr.stop());
      setState("granted"); onResult("granted");
    } catch {
      setState("denied"); onResult("denied");
    }
  }
  return (
    <div className="rounded-lg bg-slate-50 p-4 text-sm">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={run} disabled={state === "checking"} className={btnSecondary}>
          {state === "checking" ? <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" /> : <Camera className="h-4 w-4" aria-hidden="true" />}
          {t("video.testDevices", "Test camera and microphone")}
        </button>
        <p role="status" className={cx("text-sm", state === "granted" && "text-emerald-800", (state === "denied" || state === "unavailable") && "text-red-800")}>
          {state === "granted" && t("video.devicesOk", "Camera and microphone are ready.")}
          {state === "denied" && t("video.devicesDenied", "Access was blocked. Allow camera and microphone in your browser's site settings, then test again. You can still join and listen.")}
          {state === "unavailable" && t("video.devicesUnavailable", "This browser can't access a camera or microphone. Use a supported browser or join audio-only from another device.")}
        </p>
      </div>
    </div>
  );
}

function CallControls({ apiRef, audioMuted, videoMuted, status, participants, onEnd, endLabel, busy }) {
  const t = useT();
  const exec = (cmd) => apiRef.current?.executeCommand(cmd);
  const pill = "inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-slate-300 bg-white px-3 text-slate-900 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700";
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3">
      <p role="status" aria-live="polite" className="flex items-center gap-2 text-sm text-slate-700">
        {status === "connected" ? <Wifi className="h-4 w-4 text-emerald-700" aria-hidden="true" /> : <WifiOff className="h-4 w-4 text-amber-700" aria-hidden="true" />}
        {status === "connected" && t("video.connected", "Connected")}
        {status === "joining" && t("video.connecting", "Connecting...")}
        {status === "error" && t("video.connectionProblem", "Connection problem")}
        {status === "connected" && typeof participants === "number" && ` · ${participants} ${t("video.inCall", "in call")}`}
      </p>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => exec("toggleAudio")} className={pill} aria-pressed={audioMuted} aria-label={audioMuted ? t("video.unmute", "Unmute microphone") : t("video.mute", "Mute microphone")}>
          {audioMuted ? <MicOff className="h-5 w-5 text-red-700" aria-hidden="true" /> : <Mic className="h-5 w-5" aria-hidden="true" />}
        </button>
        <button type="button" onClick={() => exec("toggleVideo")} className={pill} aria-pressed={videoMuted} aria-label={videoMuted ? t("video.cameraOn", "Turn camera on") : t("video.cameraOff", "Turn camera off")}>
          {videoMuted ? <CameraOff className="h-5 w-5 text-red-700" aria-hidden="true" /> : <Camera className="h-5 w-5" aria-hidden="true" />}
        </button>
        <button type="button" onClick={onEnd} disabled={busy} className={btnDanger}>
          {busy ? <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" /> : <PhoneOff className="h-4 w-4" aria-hidden="true" />}
          {endLabel}
        </button>
      </div>
    </div>
  );
}

export default function ConsultationRoom({ consultationId }) {
  const t = useT();
  const auth = useAuth();
  const user = auth?.user;
  const authLoading = auth?.loading ?? auth?.isLoading ?? false;
  const role = user?.role;
  const isDoctor = role === "doctor";
  const isPatient = role === "patient";

  const apiRef = useRef(null);
  const [inCall, setInCall] = useState(false);
  const [left, setLeft] = useState(false);
  const [ended, setEnded] = useState(false);
  const [stageKey, setStageKey] = useState(0);
  const [conn, setConn] = useState("joining");
  const [participants, setParticipants] = useState(null);
  const [audioMuted, setAudioMuted] = useState(false);
  const [videoMuted, setVideoMuted] = useState(false);
  const [devices, setDevices] = useState("idle");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [stageError, setStageError] = useState("");

  const poll = Boolean(user) && !inCall && !ended;
  const { data: c, error, loading, reload, setData } = useConsultation(consultationId, poll);

  // Patient: enter automatically once the doctor has started AND devices were already confirmed.
  useEffect(() => {
    if (isPatient && c?.status === "live" && devices === "granted" && !inCall && !ended && !left) setInCall(true);
  }, [isPatient, c?.status, devices, inCall, ended, left]);

  // If the doctor ends the call while a patient is waiting/in it, reflect that.
  useEffect(() => {
    if (c?.status === "ended") { setEnded(true); setInCall(false); }
  }, [c?.status]);

  if (authLoading) return <LoadingState />;
  if (!user) return <PermissionState reason="signin" />;
  if (!isDoctor && !isPatient) return <PermissionState reason="role" />;
  if (loading) return <LoadingState label={t("video.loading", "Loading consultation...")} />;
  if (error && !c) {
    const gone = error.status === 404 || error.status === 403;
    return (
      <>
        <PageHeader title={t("video.title", "Video consultation")} />
        <ErrorState
          message={gone ? t("video.invalid", "This consultation is invalid or not available to you. Check the Consultation ID with your doctor.") : errorMessage(error)}
          onRetry={gone ? undefined : reload}
        />
      </>
    );
  }
  if (!c) return null;

  const roomName = c.roomId ? `nirmay-${c.roomId}` : null;
  const displayName = isDoctor ? (/^dr\.?\s/i.test(user.name || "") ? user.name : `Dr. ${user.name || ""}`.trim()) : user.name || t("video.patient", "Patient");
  const counterpart = isDoctor ? c.patientName : c.doctorName;

  async function startAsDoctor() {
    if (!isDoctor) return; // defence in depth: patients never reach this
    setBusy(true); setActionError("");
    try {
      const res = await consultationApi.start(consultationId);
      setData({ ...c, ...res });
      setInCall(true);
    } catch (e) {
      setActionError(errorMessage(e, t("video.startFailed", "The consultation could not be started.")));
    } finally { setBusy(false); }
  }

  async function endAsDoctor() {
    setBusy(true); setActionError("");
    try {
      await consultationApi.end(consultationId);
      apiRef.current?.executeCommand("hangup");
      setEnded(true); setInCall(false);
      setData({ ...c, status: "ended" });
    } catch (e) {
      setActionError(errorMessage(e, t("video.endFailed", "The consultation could not be ended. You are still connected.")));
    } finally { setBusy(false); }
  }

  function leaveAsPatient() {
    apiRef.current?.executeCommand("hangup");
    setLeft(true);
    setInCall(false);
    setConn("joining");
  }

  const handlers = {
    onJoined: () => { setConn("connected"); setStageError(""); },
    onLeft: () => { if (isPatient) leaveAsPatient(); else { setInCall(false); setConn("joining"); } },
    onAudioMute: (e) => setAudioMuted(Boolean(e?.muted)),
    onVideoMute: (e) => setVideoMuted(Boolean(e?.muted)),
    onParticipants: setParticipants,
    onError: (e) => {
      setConn("error");
      setStageError(e?.scriptFailed
        ? t("video.scriptFailed", "The video service could not be loaded. Check your connection and try again.")
        : e?.error?.message || t("video.genericError", "A video error occurred."));
    },
  };

  const header = (
    <PageHeader
      title={t("video.title", "Video consultation")}
      subtitle={[counterpart, c.scheduledAt && fmtDateTime(c.scheduledAt)].filter(Boolean).join(" · ")}
      backHref={isDoctor ? "/doctor" : undefined}
      backLabel={t("doctor.dashboard.title", "Doctor dashboard")}
      actions={<StatusBadge status={ended ? "ended" : c.status} />}
    />
  );

  if (ended) {
    return (
      <>
        {header}
        <Card>
          <p role="status" className="text-sm text-slate-800">{t("video.ended", "This consultation has ended.")}</p>
          <Link href={isDoctor ? "/doctor" : "/"} className={`${btnSecondary} mt-4`}>{t("video.back", "Back")}</Link>
        </Card>
      </>
    );
  }

  if (!roomName && (c.status === "live" || isDoctor)) {
    return <>{header}<ErrorState message={t("video.noRoom", "No video room is assigned to this consultation yet. Please contact support.")} onRetry={reload} /></>;
  }

  if (inCall) {
    return (
      <>
        {header}
        {IS_PUBLIC_JITSI && <DemoBanner message={t("video.demoBanner", "Demonstration video service (public Jitsi). Do not use it for real patient consultations - production requires a secured, privately hosted video service. Calls are not recorded.")} />}
        <div className="space-y-3">
          <div className="h-[60vh] min-h-[320px] overflow-hidden rounded-xl border border-slate-200">
            <JitsiStage key={stageKey} roomName={roomName} displayName={displayName} subject={t("video.title", "Video consultation")} apiRef={apiRef} handlers={handlers} />
          </div>
          {(conn === "error" || stageError) && (
            <div role="alert" className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 sm:flex-row sm:items-center sm:justify-between">
              <span>{stageError || t("video.connectionProblem", "Connection problem")}</span>
              <button type="button" onClick={() => { setConn("joining"); setStageError(""); setStageKey((k) => k + 1); }} className={btnSecondary}>
                <RefreshCw className="h-4 w-4" aria-hidden="true" />{t("video.reconnect", "Reconnect")}
              </button>
            </div>
          )}
          <CallControls
            apiRef={apiRef} audioMuted={audioMuted} videoMuted={videoMuted} status={conn} participants={participants}
            busy={busy} onEnd={isDoctor ? endAsDoctor : leaveAsPatient}
            endLabel={isDoctor ? t("video.endCall", "End consultation") : t("video.leave", "Leave")}
          />
          {actionError && <p role="alert" className="text-sm text-red-800">{actionError}</p>}
          <p className="text-xs text-slate-500">{t("video.fallbackHint", "If video keeps failing, end the call and continue by phone, or reschedule.")}</p>
        </div>
      </>
    );
  }

  // Lobby
  return (
    <>
      {header}
      {IS_PUBLIC_JITSI && <DemoBanner message={t("video.demoBanner", "Demonstration video service (public Jitsi). Do not use it for real patient consultations - production requires a secured, privately hosted video service. Calls are not recorded.")} />}
      <Card>
        <div className="space-y-4">
          <DeviceCheck onResult={setDevices} />

          {isDoctor && (
            <div className="flex flex-wrap items-center gap-3">
              {c.status === "live" ? (
                <button type="button" onClick={() => setInCall(true)} className={btnPrimary}>
                  <Video className="h-4 w-4" aria-hidden="true" />{t("video.reenter", "Re-enter consultation")}
                </button>
              ) : (
                <button type="button" onClick={startAsDoctor} disabled={busy} className={btnPrimary}>
                  {busy ? <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" /> : <Video className="h-4 w-4" aria-hidden="true" />}
                  {t("video.start", "Start consultation")}
                </button>
              )}
              <p className="text-sm text-slate-600">{t("video.doctorOnly", "Only you can start this consultation. The patient joins once it is live.")}</p>
            </div>
          )}

          {isPatient && (
            c.status === "live" ? (
              <div className="flex flex-wrap items-center gap-3">
                <button type="button" onClick={() => { setLeft(false); setInCall(true); }} className={btnPrimary}>
                  <Video className="h-4 w-4" aria-hidden="true" />{t("video.join", "Join consultation")}
                </button>
                <p role="status" className="text-sm text-emerald-800">{t("video.doctorReady", "Your doctor has started the consultation.")}</p>
              </div>
            ) : (
              <p role="status" aria-live="polite" className="flex items-center gap-2 text-sm text-slate-700">
                <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" />
                {t("video.waiting", "Waiting for your doctor to start the consultation. This page updates automatically.")}
              </p>
            )
          )}

          {actionError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-900">{actionError}</p>}
          {error && <p role="alert" className="text-sm text-amber-800">{t("video.refreshFailed", "Couldn't refresh the consultation status. Retrying...")}</p>}
        </div>
      </Card>
    </>
  );
}
