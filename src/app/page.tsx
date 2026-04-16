"use client";

import { useMemo, useState } from "react";
import styles from "./page.module.css";

type AppView = "secret" | "languages";
type ModeCode = "normal" | "secret";
type LanguageCode = "fr" | "en" | "es" | "de" | "it" | "pt";

type ModeOption = {
  code: ModeCode;
  label: string;
  voice: string;
};

type LanguageOption = {
  code: LanguageCode;
  label: string;
  voice: string;
};

type SpeechRecognitionResultAlternativeLike = {
  transcript: string;
};

type SpeechRecognitionResultLike = {
  [index: number]: SpeechRecognitionResultAlternativeLike;
};

type SpeechRecognitionEventLike = {
  results: SpeechRecognitionResultLike[];
};

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: null | (() => void);
  onend: null | (() => void);
  onerror: null | (() => void);
  onresult: null | ((event: SpeechRecognitionEventLike) => void);
  start: () => void;
};

const MODES: ModeOption[] = [
  { code: "normal", label: "Texte normal", voice: "fr-FR" },
  { code: "secret", label: "Langage secret", voice: "fr-FR" },
];

const LANGUAGES: LanguageOption[] = [
  { code: "fr", label: "Francais", voice: "fr-FR" },
  { code: "en", label: "Anglais", voice: "en-US" },
  { code: "es", label: "Espagnol", voice: "es-ES" },
  { code: "de", label: "Allemand", voice: "de-DE" },
  { code: "it", label: "Italien", voice: "it-IT" },
  { code: "pt", label: "Portugais", voice: "pt-PT" },
];

const SECRET_MAP: Record<string, string> = {
  a: "z",
  z: "e",
  e: "r",
  r: "t",
  t: "y",
  y: "u",
  u: "i",
  i: "o",
  o: "p",
  p: "q",
  q: "s",
  s: "d",
  d: "f",
  f: "g",
  g: "h",
  h: "j",
  j: "k",
  k: "l",
  l: "m",
  m: "w",
  w: "x",
  x: "c",
  c: "v",
  v: "b",
  b: "n",
  n: "a",
};

type WebkitWindow = Window & {
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
};

function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" className={styles.iconSvg} aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 14a3 3 0 0 0 3-3V7a3 3 0 1 0-6 0v4a3 3 0 0 0 3 3Zm5-3a1 1 0 1 1 2 0 7 7 0 1 1-14 0 1 1 0 1 1 2 0 5 5 0 0 0 10 0Zm-4 8a1 1 0 1 1-2 0v-2a1 1 0 1 1 2 0v2Z"
      />
    </svg>
  );
}

function SpeakerIcon() {
  return (
    <svg viewBox="0 0 24 24" className={styles.iconSvg} aria-hidden="true">
      <path
        fill="currentColor"
        d="M13.5 4.5a1 1 0 0 1 1.707.707v13.586a1 1 0 0 1-1.707.707L8.207 14.207H5a1 1 0 0 1-1-1V10.79a1 1 0 0 1 1-1h3.207L13.5 4.5Zm4.702 1.605a1 1 0 0 1 1.414-.054 8 8 0 0 1 0 11.897 1 1 0 0 1-1.36-1.468 6 6 0 0 0 0-8.961 1 1 0 0 1-.054-1.414Zm-2.44 2.42a1 1 0 0 1 1.41-.084 4.8 4.8 0 0 1 0 7.117 1 1 0 1 1-1.326-1.498 2.8 2.8 0 0 0 0-4.12 1 1 0 0 1-.084-1.414Z"
      />
    </svg>
  );
}

const SECRET_REVERSE_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(SECRET_MAP).map(([from, to]) => [to, from]),
);

function convertWithMap(text: string, mapping: Record<string, string>) {
  return text
    .split("")
    .map((char) => {
      const lower = char.toLowerCase();
      const converted = mapping[lower];
      if (!converted) {
        return char;
      }
      return char === lower ? converted : converted.toUpperCase();
    })
    .join("");
}

function translateLocal(text: string, source: ModeCode, target: ModeCode) {
  if (!text) {
    return "";
  }

  if (source === target) {
    return text;
  }

  if (source === "normal" && target === "secret") {
    return convertWithMap(text, SECRET_MAP);
  }

  return convertWithMap(text, SECRET_REVERSE_MAP);
}

function translateLanguageText(
  text: string,
  source: LanguageCode,
  target: LanguageCode,
) {
  if (!text.trim()) {
    return "";
  }

  if (source === target) {
    return text;
  }

  return `[${source.toUpperCase()} -> ${target.toUpperCase()}] ${text}`;
}

function getOppositeMode(mode: ModeCode): ModeCode {
  return mode === "normal" ? "secret" : "normal";
}

export default function Home() {
  const [appView, setAppView] = useState<AppView>("secret");
  const [sourceMode, setSourceMode] = useState<ModeCode>("secret");
  const [targetMode, setTargetMode] = useState<ModeCode>("normal");
  const [sourceLanguage, setSourceLanguage] = useState<LanguageCode>("fr");
  const [targetLanguage, setTargetLanguage] = useState<LanguageCode>("en");
  const [sourceText, setSourceText] = useState("NPAKPIT VITDPT");
  const [isListening, setIsListening] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied">("idle");

  const translatedText = useMemo(() => {
    if (appView === "secret") {
      return translateLocal(sourceText, sourceMode, targetMode);
    }
    return translateLanguageText(sourceText, sourceLanguage, targetLanguage);
  }, [appView, sourceText, sourceMode, targetMode, sourceLanguage, targetLanguage]);

  const sourceVoice = useMemo(
    () =>
      appView === "secret"
        ? MODES.find((item) => item.code === sourceMode)?.voice ?? "fr-FR"
        : LANGUAGES.find((item) => item.code === sourceLanguage)?.voice ?? "fr-FR",
    [appView, sourceMode, sourceLanguage],
  );
  const targetVoice = useMemo(
    () =>
      appView === "secret"
        ? MODES.find((item) => item.code === targetMode)?.voice ?? "fr-FR"
        : LANGUAGES.find((item) => item.code === targetLanguage)?.voice ?? "fr-FR",
    [appView, targetMode, targetLanguage],
  );

  const handleSwap = () => {
    if (appView === "secret") {
      setSourceMode(targetMode);
      setTargetMode(sourceMode);
    } else {
      setSourceLanguage(targetLanguage);
      setTargetLanguage(sourceLanguage);
    }
    setSourceText(translatedText);
  };

  const speakText = (text: string, lang: string) => {
    if (!text.trim() || typeof window === "undefined") {
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const copyTarget = async () => {
    if (!translatedText.trim()) {
      return;
    }
    await navigator.clipboard.writeText(translatedText);
    setCopyStatus("copied");
    window.setTimeout(() => {
      setCopyStatus("idle");
    }, 1200);
  };

  const startVoiceInput = () => {
    if (typeof window === "undefined") {
      return;
    }
    const browserWindow = window as WebkitWindow;
    const SpeechRecognitionAPI =
      browserWindow.SpeechRecognition ?? browserWindow.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      alert("La reconnaissance vocale n'est pas disponible sur ce navigateur.");
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = sourceVoice;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      if (transcript) {
        setSourceText((prev) => `${prev}${prev ? " " : ""}${transcript}`);
      }
    };

    recognition.start();
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.topModeSwitch}>
          <button
            type="button"
            className={`${styles.viewButton} ${appView === "secret" ? styles.viewButtonActive : ""}`}
            onClick={() => {
              setAppView("secret");
              setSourceText("");
            }}
          >
            Mode secret
          </button>
          <button
            type="button"
            className={`${styles.viewButton} ${appView === "languages" ? styles.viewButtonActive : ""}`}
            onClick={() => {
              setAppView("languages");
              setSourceText("");
            }}
          >
            Mode langues
          </button>
        </div>

        <section className={styles.translator}>
          <article className={styles.panel}>
            <div className={styles.panelTop}>
              <select
                className={styles.languageSelect}
                value={appView === "secret" ? sourceMode : sourceLanguage}
                onChange={(event) => {
                  if (appView === "secret") {
                    const nextSourceMode = event.target.value as ModeCode;
                    setSourceMode(nextSourceMode);
                    setTargetMode(getOppositeMode(nextSourceMode));
                  } else {
                    setSourceLanguage(event.target.value as LanguageCode);
                  }
                  setSourceText("");
                }}
              >
                {appView === "secret"
                  ? MODES.map((mode) => (
                      <option key={mode.code} value={mode.code}>
                        {mode.label}
                      </option>
                    ))
                  : LANGUAGES.map((language) => (
                      <option key={language.code} value={language.code}>
                        {language.label}
                      </option>
                    ))}
              </select>
            </div>

            <textarea
              className={styles.textarea}
              value={sourceText}
              onChange={(event) => setSourceText(event.target.value)}
              placeholder="Ecrits un textes..."
            />

            <div className={styles.panelActions}>
              <button
                type="button"
                className={styles.iconButton}
                onClick={startVoiceInput}
                title="Dictee vocale"
                aria-label="Dictee vocale"
                aria-pressed={isListening}
              >
                <MicIcon />
              </button>
              <button
                type="button"
                className={styles.iconButton}
                onClick={() => speakText(sourceText, sourceVoice)}
                title="Lire le texte"
                aria-label="Lire le texte"
              >
                <SpeakerIcon />
              </button>
            </div>
          </article>

          <div className={styles.swapWrap}>
            <button type="button" className={styles.swapButton} onClick={handleSwap}>
              ⇄
            </button>
          </div>

          <article className={styles.panel}>
            <div className={styles.panelTop}>
              <select
                className={styles.languageSelect}
                value={appView === "secret" ? targetMode : targetLanguage}
                onChange={(event) => {
                  if (appView === "secret") {
                    const nextTargetMode = event.target.value as ModeCode;
                    setTargetMode(nextTargetMode);
                    setSourceMode(getOppositeMode(nextTargetMode));
                  } else {
                    setTargetLanguage(event.target.value as LanguageCode);
                  }
                  setSourceText("");
                }}
              >
                {appView === "secret"
                  ? MODES.map((mode) => (
                      <option key={mode.code} value={mode.code}>
                        {mode.label}
                      </option>
                    ))
                  : LANGUAGES.map((language) => (
                      <option key={language.code} value={language.code}>
                        {language.label}
                      </option>
                    ))}
              </select>
            </div>

            <textarea
              className={styles.textarea}
              value={translatedText}
              readOnly
              placeholder="Traduction..."
            />

            <div className={styles.panelActions}>
              <button
                type="button"
                className={styles.iconButton}
                onClick={copyTarget}
                title="Copier la traduction"
                aria-label="Copier la traduction"
              >
                <span className={styles.iconGlyph}>
                  {copyStatus === "copied" ? "✓" : "⧉"}
                </span>
              </button>
              <button
                type="button"
                className={styles.iconButton}
                onClick={() => speakText(translatedText, targetVoice)}
                title="Lire la traduction"
                aria-label="Lire la traduction"
              >
                <SpeakerIcon />
              </button>
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}
