"use client";

import { useMemo, useState } from "react";
import styles from "./page.module.css";

type ModeCode = "normal" | "secret";

type ModeOption = {
  code: ModeCode;
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

function getOppositeMode(mode: ModeCode): ModeCode {
  return mode === "normal" ? "secret" : "normal";
}

export default function Home() {
  const [sourceMode, setSourceMode] = useState<ModeCode>("secret");
  const [targetMode, setTargetMode] = useState<ModeCode>("normal");
  const [sourceText, setSourceText] = useState("NPAKPIT VITDPT");
  const [isListening, setIsListening] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied">("idle");

  const translatedText = useMemo(
    () => translateLocal(sourceText, sourceMode, targetMode),
    [sourceText, sourceMode, targetMode],
  );

  const sourceVoice = useMemo(
    () => MODES.find((item) => item.code === sourceMode)?.voice ?? "fr-FR",
    [sourceMode],
  );
  const targetVoice = useMemo(
    () => MODES.find((item) => item.code === targetMode)?.voice ?? "fr-FR",
    [targetMode],
  );

  const handleSwap = () => {
    setSourceMode(targetMode);
    setTargetMode(sourceMode);
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
        <section className={styles.translator}>
          <article className={styles.panel}>
            <div className={styles.panelTop}>
              <select
                className={styles.languageSelect}
                value={sourceMode}
                onChange={(event) => {
                  const nextSourceMode = event.target.value as ModeCode;
                  setSourceMode(nextSourceMode);
                  setTargetMode(getOppositeMode(nextSourceMode));
                  setSourceText("");
                }}
              >
                {MODES.map((mode) => (
                  <option key={mode.code} value={mode.code}>
                    {mode.label}
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
              >
                {isListening ? "● Micro actif" : "Micro"}
              </button>
              <button
                type="button"
                className={styles.iconButton}
                onClick={() => speakText(sourceText, sourceVoice)}
                title="Lire le texte"
              >
                Audio
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
                value={targetMode}
                onChange={(event) => {
                  const nextTargetMode = event.target.value as ModeCode;
                  setTargetMode(nextTargetMode);
                  setSourceMode(getOppositeMode(nextTargetMode));
                  setSourceText("");
                }}
              >
                {MODES.map((mode) => (
                  <option key={mode.code} value={mode.code}>
                    {mode.label}
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
              >
                {copyStatus === "copied" ? "Copie" : "Copier"}
              </button>
              <button
                type="button"
                className={styles.iconButton}
                onClick={() => speakText(translatedText, targetVoice)}
                title="Lire la traduction"
              >
                Audio
              </button>
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}
