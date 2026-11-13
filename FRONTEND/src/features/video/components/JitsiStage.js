"use client";
import { useEffect, useRef } from "react";

export const JITSI_DOMAIN = process.env.NEXT_PUBLIC_JITSI_DOMAIN || "meet.jit.si";
export const IS_PUBLIC_JITSI = JITSI_DOMAIN === "meet.jit.si";

let scriptPromise = null;
function loadJitsiScript() {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.JitsiMeetExternalAPI) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = `https://${JITSI_DOMAIN}/external_api.js`;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => {
        scriptPromise = null; // allow retry
        reject(new Error("Could not load the video service."));
      };
      document.head.appendChild(s);
    });
  }
  return scriptPromise;
}

/**
 * The ONE Jitsi embed used by both doctor and patient. Recording, live
 * streaming and invite features are disabled. Imperative controls are exposed
 * through `apiRef` (executeCommand("toggleAudio" | "toggleVideo" | "hangup")).
 */
export default function JitsiStage({ roomName, displayName, subject, apiRef, handlers }) {
  const parentRef = useRef(null);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    let disposed = false;
    let api = null;

    loadJitsiScript()
      .then(() => {
        if (disposed || !parentRef.current) return;
        api = new window.JitsiMeetExternalAPI(JITSI_DOMAIN, {
          roomName,
          parentNode: parentRef.current,
          width: "100%",
          height: "100%",
          userInfo: { displayName },
          configOverwrite: {
            prejoinPageEnabled: false,
            disableDeepLinking: true,
            disableInviteFunctions: true,
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            fileRecordingsEnabled: false,
            liveStreamingEnabled: false,
            localRecording: { disable: true },
            subject,
            toolbarButtons: ["microphone", "camera", "desktop", "chat", "tileview", "fullscreen", "settings", "hangup"],
          },
          interfaceConfigOverwrite: { MOBILE_APP_PROMO: false },
        });
        if (apiRef) apiRef.current = api;
        const h = (name) => (...a) => handlersRef.current?.[name]?.(...a);
        api.addListener("videoConferenceJoined", h("onJoined"));
        api.addListener("videoConferenceLeft", h("onLeft"));
        api.addListener("readyToClose", h("onLeft"));
        api.addListener("audioMuteStatusChanged", h("onAudioMute"));
        api.addListener("videoMuteStatusChanged", h("onVideoMute"));
        api.addListener("participantJoined", () => handlersRef.current?.onParticipants?.(api.getNumberOfParticipants()));
        api.addListener("participantLeft", () => handlersRef.current?.onParticipants?.(api.getNumberOfParticipants()));
        api.addListener("errorOccurred", h("onError"));
      })
      .catch((e) => handlersRef.current?.onError?.({ error: { message: e.message }, scriptFailed: true }));

    return () => {
      disposed = true;
      try {
        api?.dispose();
      } catch {
        /* already disposed */
      }
      if (apiRef) apiRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomName, displayName]);

  return <div ref={parentRef} className="h-full w-full bg-slate-900" />;
}
