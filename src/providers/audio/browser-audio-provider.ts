export interface BrowserAudioResult {
  ok: boolean;
  message: string;
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<{
    0: { transcript: string };
    isFinal: boolean;
  }>;
}

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

type WindowWithSpeechRecognition = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

export function normalizeSpeechText(text: string, maxCharacters = 1_200): string {
  return text
    .replaceAll(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "")
    .replaceAll(/\s+/gu, " ")
    .trim()
    .slice(0, maxCharacters);
}

export async function speakBrowserText(
  text: string,
  options: { rate?: number; language?: string } = {},
): Promise<BrowserAudioResult> {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return { ok: false, message: "Text-to-speech is unavailable in this browser." };
  }

  const normalized = normalizeSpeechText(text);
  if (!normalized) return { ok: false, message: "There is no readable text." };

  const utterance = new SpeechSynthesisUtterance(normalized);
  utterance.rate = options.rate ?? 1.05;
  utterance.lang = options.language ?? (/\p{Script=Han}/u.test(normalized) ? "zh-TW" : "en-US");

  window.speechSynthesis.cancel();
  return new Promise((resolve) => {
    utterance.onend = () => resolve({ ok: true, message: "Voice message played." });
    utterance.onerror = () =>
      resolve({ ok: false, message: "The browser could not play this voice message." });
    window.speechSynthesis.speak(utterance);
  });
}

// Once started, browser speech ran to the last word with no way out. That is
// tolerable in a demo and wrong in a product whose whole premise is that the
// user stays in control — she must be able to stop anything it is doing.
export function stopBrowserSpeech(): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  const browserWindow = window as WindowWithSpeechRecognition;
  return Boolean(
    browserWindow.SpeechRecognition ?? browserWindow.webkitSpeechRecognition,
  );
}

export async function transcribeBrowserSpeech(
  language = "en-US",
  timeoutMs = 20_000,
): Promise<string> {
  if (typeof window === "undefined") return "";
  const browserWindow = window as WindowWithSpeechRecognition;
  const Constructor =
    browserWindow.SpeechRecognition ?? browserWindow.webkitSpeechRecognition;
  if (!Constructor) return "";

  return new Promise((resolve) => {
    const recognition = new Constructor();
    let settled = false;
    let transcript = "";
    const finish = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      resolve(transcript.trim());
    };
    const timeout = window.setTimeout(() => {
      recognition.stop();
      finish();
    }, timeoutMs);

    recognition.lang = language;
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      for (let index = 0; index < event.results.length; index += 1) {
        transcript += ` ${event.results[index]?.[0]?.transcript ?? ""}`;
      }
    };
    recognition.onerror = finish;
    recognition.onend = finish;
    recognition.start();
  });
}

export async function showBrowserNotification(
  title: string,
  body: string,
): Promise<BrowserAudioResult> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return { ok: false, message: "Notifications are unavailable in this browser." };
  }

  const permission =
    Notification.permission === "default"
      ? await Notification.requestPermission()
      : Notification.permission;
  if (permission !== "granted") {
    return { ok: false, message: "Notification permission was not granted." };
  }

  new Notification(title, { body, tag: "time-sovereignty-check-in" });
  return { ok: true, message: "A protected check-in notification was shown." };
}
