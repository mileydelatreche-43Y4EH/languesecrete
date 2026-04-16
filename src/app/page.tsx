"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import styles from "./page.module.css";

type AppView = "secret" | "languages";
type ModeCode = "normal" | "secret";
type LanguageCode =
  | "fr"
  | "en"
  | "es"
  | "de"
  | "it"
  | "pt"
  | "ar"
  | "bg"
  | "zh"
  | "ko"
  | "da"
  | "nl"
  | "fi"
  | "el"
  | "he"
  | "hi"
  | "hu"
  | "id"
  | "ja"
  | "no"
  | "pl"
  | "ro"
  | "ru"
  | "sv"
  | "th"
  | "tr"
  | "uk"
  | "vi";

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
  { code: "ar", label: "Arabe", voice: "ar-SA" },
  { code: "bg", label: "Bulgare", voice: "bg-BG" },
  { code: "zh", label: "Chinois", voice: "zh-CN" },
  { code: "ko", label: "Coreen", voice: "ko-KR" },
  { code: "da", label: "Danois", voice: "da-DK" },
  { code: "nl", label: "Neerlandais", voice: "nl-NL" },
  { code: "fi", label: "Finnois", voice: "fi-FI" },
  { code: "el", label: "Grec", voice: "el-GR" },
  { code: "he", label: "Hebreu", voice: "he-IL" },
  { code: "hi", label: "Hindi", voice: "hi-IN" },
  { code: "hu", label: "Hongrois", voice: "hu-HU" },
  { code: "id", label: "Indonesien", voice: "id-ID" },
  { code: "ja", label: "Japonais", voice: "ja-JP" },
  { code: "no", label: "Norvegien", voice: "nb-NO" },
  { code: "pl", label: "Polonais", voice: "pl-PL" },
  { code: "ro", label: "Roumain", voice: "ro-RO" },
  { code: "ru", label: "Russe", voice: "ru-RU" },
  { code: "sv", label: "Suedois", voice: "sv-SE" },
  { code: "th", label: "Thai", voice: "th-TH" },
  { code: "tr", label: "Turc", voice: "tr-TR" },
  { code: "uk", label: "Ukrainien", voice: "uk-UA" },
  { code: "vi", label: "Vietnamien", voice: "vi-VN" },
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

function SwapIcon() {
  return (
    <svg viewBox="0 0 24 24" className={styles.swapIcon} aria-hidden="true">
      <path
        d="M7 7h12m0 0-3-3m3 3-3 3M17 17H5m0 0 3-3m-3 3 3 3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
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

function getOppositeMode(mode: ModeCode): ModeCode {
  return mode === "normal" ? "secret" : "normal";
}

function languageNaturalScore(text: string) {
  const letters = text.toLowerCase().replace(/[^a-z]/g, "");
  if (!letters) {
    return 0;
  }

  const vowels = letters.match(/[aeiouy]/g)?.length ?? 0;
  const vowelRatio = vowels / letters.length;
  const patterns = [
    "ou",
    "on",
    "ai",
    "au",
    "eu",
    "er",
    "re",
    "le",
    "de",
    "la",
    "en",
    "es",
    "qu",
    "ch",
    "tion",
  ];
  const patternHits = patterns.reduce((count, pattern) => {
    return count + (letters.includes(pattern) ? 1 : 0);
  }, 0);

  return vowelRatio + patternHits * 0.032;
}

function detectSecretInputMode(text: string): ModeCode {
  const lowerText = text.toLowerCase().trim();
  if (!lowerText) {
    return "normal";
  }

  // Evite les faux positifs sur commandes, code, acronymes et abreviations courantes.
  const knownNormalTokens = new Set([
    "npm",
    "run",
    "build",
    "start",
    "dev",
    "git",
    "api",
    "url",
    "cmd",
    "cli",
    "http",
    "https",
    "www",
    "slt",
    "cv",
    "r",
    "ok",
    "stp",
    "svp",
    "mdr",
    "lol",
    "tg",
    "wsh",
    "js",
    "ts",
    "css",
    "html",
  ]);

  const rawTokens = lowerText.split(/\s+/g).filter(Boolean);
  if (
    rawTokens.some(
      (token) =>
        token.includes("/") ||
        token.includes("-") ||
        token.includes("_") ||
        token.includes(".") ||
        /\d/.test(token),
    )
  ) {
    return "normal";
  }

  const plainTokens = rawTokens.map((token) => token.replace(/[^a-z0-9]/g, ""));
  if (plainTokens.some((token) => knownNormalTokens.has(token))) {
    return "normal";
  }

  if (plainTokens.every((token) => token.length <= 3)) {
    return "normal";
  }

  const words = text
    .toLowerCase()
    .split(/[^a-z]+/g)
    .filter((word) => word.length > 1);

  if (words.length === 0) {
    return "normal";
  }

  let totalDelta = 0;
  let strongSecretWords = 0;
  let analyzableWords = 0;

  for (const word of words) {
    if (word.length < 4) {
      continue;
    }
    analyzableWords += 1;
    const decodedWord = convertWithMap(word, SECRET_REVERSE_MAP);
    const inputScore = languageNaturalScore(word);
    const decodedScore = languageNaturalScore(decodedWord);
    const weight = Math.min(2, word.length / 4);
    const delta = decodedScore - inputScore;
    totalDelta += delta * weight;
    if (delta > 0.11) {
      strongSecretWords += 1;
    }
  }

  // Mode strict: on passe en secret uniquement avec forte confiance.
  if (analyzableWords === 0) {
    return "normal";
  }

  const strongWordRatio = strongSecretWords / analyzableWords;
  return totalDelta > 0.3 && strongWordRatio >= 0.45 ? "secret" : "normal";
}

export default function Home() {
  const [appView, setAppView] = useState<AppView>("secret");
  const [sourceMode, setSourceMode] = useState<ModeCode>("secret");
  const [targetMode, setTargetMode] = useState<ModeCode>("normal");
  const [sourceLanguage, setSourceLanguage] = useState<LanguageCode>("fr");
  const [targetLanguage, setTargetLanguage] = useState<LanguageCode>("en");
  const [sourceText, setSourceText] = useState("NPAKPIT VITDPT");
  const [languageTranslatedText, setLanguageTranslatedText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied">("idle");

  const translatedText = useMemo(() => {
    if (appView === "secret") {
      return translateLocal(sourceText, sourceMode, targetMode);
    }

    if (!sourceText.trim()) {
      return "";
    }

    if (sourceLanguage === targetLanguage) {
      return sourceText;
    }

    return languageTranslatedText;
  }, [
    appView,
    sourceText,
    sourceMode,
    targetMode,
    sourceLanguage,
    targetLanguage,
    languageTranslatedText,
  ]);

  useEffect(() => {
    if (appView !== "languages") {
      return;
    }

    const trimmedText = sourceText.trim();
    if (!trimmedText || sourceLanguage === targetLanguage) {
      return;
    }

    const controller = new AbortController();
    const runTranslation = async () => {
      try {
        const response = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: sourceText,
            sourceLanguage,
            targetLanguage,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          setLanguageTranslatedText(sourceText);
          return;
        }

        const data = (await response.json()) as { translatedText?: string };
        setLanguageTranslatedText(data.translatedText ?? sourceText);
      } catch {
        if (controller.signal.aborted) {
          return;
        }
        setLanguageTranslatedText(sourceText);
      }
    };

    void runTranslation();

    return () => {
      controller.abort();
    };
  }, [appView, sourceText, sourceLanguage, targetLanguage]);

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
    <div className={`${styles.page} ${appView === "languages" ? styles.pageLight : ""}`}>
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
              {appView === "secret" ? (
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
              ) : (
                <select
                  className={styles.languageSelect}
                  value={sourceLanguage}
                  onChange={(event) => {
                    setSourceLanguage(event.target.value as LanguageCode);
                  }}
                >
                  {LANGUAGES.map((language) => (
                    <option key={language.code} value={language.code}>
                      {language.label}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <textarea
              className={styles.textarea}
              value={sourceText}
              onChange={(event) => {
                const nextText = event.target.value;
                if (appView === "secret") {
                  const detectedMode = detectSecretInputMode(nextText);
                  if (detectedMode !== sourceMode) {
                    setSourceMode(detectedMode);
                    setTargetMode(getOppositeMode(detectedMode));
                  }
                }
                setSourceText(nextText);
              }}
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
                <Image
                  src="/icons/mic-icon.png"
                  alt="Micro"
                  width={24}
                  height={24}
                  className={styles.iconPng}
                />
              </button>
              <button
                type="button"
                className={styles.iconButton}
                onClick={() => speakText(sourceText, sourceVoice)}
                title="Lire le texte"
                aria-label="Lire le texte"
              >
                <Image
                  src="/icons/speaker-icon.png"
                  alt="Audio"
                  width={24}
                  height={24}
                  className={styles.iconPng}
                />
              </button>
            </div>
          </article>

          <div className={styles.swapWrap}>
            <button type="button" className={styles.swapButton} onClick={handleSwap}>
              <SwapIcon />
            </button>
          </div>

          <article className={styles.panel}>
            <div className={styles.panelTop}>
              {appView === "secret" ? (
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
              ) : (
                <select
                  className={styles.languageSelect}
                  value={targetLanguage}
                  onChange={(event) => {
                    setTargetLanguage(event.target.value as LanguageCode);
                  }}
                >
                  {LANGUAGES.map((language) => (
                    <option key={language.code} value={language.code}>
                      {language.label}
                    </option>
                  ))}
                </select>
              )}
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
                {copyStatus === "copied" ? (
                  <span className={styles.iconGlyph}>✓</span>
                ) : (
                  <Image
                    src="/icons/copy-icon.png"
                    alt="Copier"
                    width={24}
                    height={24}
                    className={styles.iconPng}
                  />
                )}
              </button>
              <button
                type="button"
                className={styles.iconButton}
                onClick={() => speakText(translatedText, targetVoice)}
                title="Lire la traduction"
                aria-label="Lire la traduction"
              >
                <Image
                  src="/icons/speaker-icon.png"
                  alt="Audio"
                  width={24}
                  height={24}
                  className={styles.iconPng}
                />
              </button>
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}
