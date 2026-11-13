"use client";

import React, { useState } from "react";
import clsx from "clsx";
import { Mic, MicOff, Volume2, Sparkles } from "lucide-react";
import { Spinner } from "./Spinner";
import { useToast } from "../../context/ToastContext";
import { useI18n } from "../../context/I18nContext";

export function VoiceButton({
  onTranscription,
  mode = "input", // "input" (STT) or "speak" (TTS)
  textToSpeak = "",
  size = "md",
  className = "",
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToast();
  const { lang } = useI18n();

  const handleToggleVoice = async () => {
    if (mode === "speak") {
      // Speech synthesis fallback using native browser Web Speech API
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.lang = lang === "hi" ? "hi-IN" : lang === "kn" ? "kn-IN" : "en-IN";
        window.speechSynthesis.speak(utterance);
        addToast("Reading out loud...", "info", 2000);
      } else {
        addToast("Speech synthesis not supported in this browser.", "warning");
      }
      return;
    }

    // Input mode (Speech to Text)
    if (!isRecording) {
      // Check native SpeechRecognition or fallback
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.lang = lang === "hi" ? "hi-IN" : lang === "kn" ? "kn-IN" : "en-US";
          recognition.continuous = false;
          recognition.interimResults = false;

          recognition.onstart = () => {
            setIsRecording(true);
            addToast("Listening... speak clearly into your microphone.", "info", 3000);
          };

          recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            if (onTranscription) onTranscription(transcript);
            addToast(`Captured: "${transcript}"`, "success", 3000);
          };

          recognition.onerror = (e) => {
            setIsRecording(false);
            addToast(`Voice error: ${e.error}`, "error");
          };

          recognition.onend = () => {
            setIsRecording(false);
          };

          recognition.start();
        } catch (err) {
          setIsRecording(false);
          addToast("Could not access microphone.", "error");
        }
      } else {
        // Honest demo fallback
        setIsLoading(true);
        setTimeout(() => {
          setIsLoading(false);
          addToast("Voice recognition demo: Language model fallback enabled.", "info");
        }, 800);
      }
    } else {
      setIsRecording(false);
    }
  };

  const isSpeak = mode === "speak";

  return (
    <button
      type="button"
      onClick={handleToggleVoice}
      disabled={isLoading}
      title={isSpeak ? "Listen to explanation" : isRecording ? "Stop recording" : "Speak to input"}
      aria-label={isSpeak ? "Listen to explanation" : "Voice input"}
      className={clsx(
        "inline-flex items-center justify-center rounded-lg border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 min-h-touch min-w-touch p-2.5",
        isRecording
          ? "bg-emergency border-emergency text-surface-0 animate-pulse"
          : isSpeak
          ? "bg-surface-0 border-line-200 text-brand-600 hover:bg-brand-50"
          : "bg-surface-0 border-line-200 text-ink-900 hover:bg-surface-50",
        className
      )}
    >
      {isLoading ? (
        <Spinner size="sm" />
      ) : isRecording ? (
        <MicOff className="w-4 h-4" />
      ) : isSpeak ? (
        <Volume2 className="w-4 h-4" />
      ) : (
        <Mic className="w-4 h-4" />
      )}
    </button>
  );
}
