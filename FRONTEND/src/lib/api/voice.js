import { apiFetch } from "./client";

/**
 * Speech to text transcription.
 * Sends audio recording to /voice/stt
 * Falls back to text-only if provider not configured.
 */
export async function speechToText({ audioBlob, language = "en", filename = "recording.wav" }) {
  const formData = new FormData();
  formData.append("file", audioBlob, filename);
  formData.append("language", language);

  return apiFetch("/voice/stt", {
    method: "POST",
    body: formData,
  });
}

/**
 * Text to speech synthesizer.
 * Sends text & language to /voice/tts
 */
export async function textToSpeech({ text, language = "en" }) {
  return apiFetch("/voice/tts", {
    method: "POST",
    body: { text, language },
  });
}
