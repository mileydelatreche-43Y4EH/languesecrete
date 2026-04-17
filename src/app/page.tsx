"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import styles from "./page.module.css";

type AppView = "secret" | "languages";
type ModeCode =
  | "normal"
  | "secret"
  | "mirror"
  | "shift7"
  | "rot13"
  | "shift3"
  | "double"
  | "shift11"
  | "pairs"
  | "splitmirror"
  | "triple"
  | "dynamic";
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
  { code: "normal",      label: "Texte normal", voice: "fr-FR" },
  { code: "secret",      label: "1",            voice: "fr-FR" },
  { code: "mirror",      label: "2",            voice: "fr-FR" },
  { code: "shift7",      label: "3",            voice: "fr-FR" },
  { code: "rot13",       label: "4",            voice: "fr-FR" },
  { code: "shift3",      label: "5",            voice: "fr-FR" },
  { code: "double",      label: "6",            voice: "fr-FR" },
  { code: "shift11",     label: "7",            voice: "fr-FR" },
  { code: "pairs",       label: "8",            voice: "fr-FR" },
  { code: "splitmirror", label: "9",            voice: "fr-FR" },
  { code: "triple",      label: "10",           voice: "fr-FR" },
  { code: "dynamic",     label: "11",           voice: "fr-FR" },
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

const ALPHABET = "abcdefghijklmnopqrstuvwxyz";

// Mode Miroir : A=Z, B=Y, C=X... (symetrique)
const MIRROR_MAP: Record<string, string> = Object.fromEntries(
  ALPHABET.split("").map((c, i) => [c, ALPHABET[25 - i]]),
);

// Mode Decalage +7 : A=H, B=I...
const SHIFT7_MAP: Record<string, string> = Object.fromEntries(
  ALPHABET.split("").map((c, i) => [c, ALPHABET[(i + 7) % 26]]),
);
const SHIFT7_REVERSE_MAP: Record<string, string> = Object.fromEntries(
  ALPHABET.split("").map((c, i) => [c, ALPHABET[(i + 19) % 26]]),
);

// Mode ROT13 : A=N... (symetrique)
const ROT13_MAP: Record<string, string> = Object.fromEntries(
  ALPHABET.split("").map((c, i) => [c, ALPHABET[(i + 13) % 26]]),
);

// Mode Decalage +3 : A=D, B=E...
const SHIFT3_MAP: Record<string, string> = Object.fromEntries(
  ALPHABET.split("").map((c, i) => [c, ALPHABET[(i + 3) % 26]]),
);
const SHIFT3_REVERSE_MAP: Record<string, string> = Object.fromEntries(
  ALPHABET.split("").map((c, i) => [c, ALPHABET[(i + 23) % 26]]),
);

// Mode Decalage +11 : A=L, B=M...
const SHIFT11_MAP: Record<string, string> = Object.fromEntries(
  ALPHABET.split("").map((c, i) => [c, ALPHABET[(i + 11) % 26]]),
);
const SHIFT11_REVERSE_MAP: Record<string, string> = Object.fromEntries(
  ALPHABET.split("").map((c, i) => [c, ALPHABET[(i + 15) % 26]]),
);

// Mode Paires : a<->b, c<->d, e<->f... (symetrique)
const PAIRS_MAP: Record<string, string> = Object.fromEntries(
  ALPHABET.split("").map((c, i) => [c, i % 2 === 0 ? ALPHABET[i + 1] : ALPHABET[i - 1]]),
);

// Mode Miroir double : groupe a-m inverse, groupe n-z inverse (symetrique)
const SPLITMIRROR_MAP: Record<string, string> = Object.fromEntries(
  ALPHABET.split("").map((c, i) =>
    i <= 12 ? [c, ALPHABET[12 - i]] : [c, ALPHABET[38 - i]],
  ),
);

const SECRET_REVERSE_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(SECRET_MAP).map(([from, to]) => [to, from]),
);

// Mode Double : chiffrement perso applique 2 fois (a→z→e)
const DOUBLE_MAP: Record<string, string> = Object.fromEntries(
  Object.keys(SECRET_MAP).map((c) => [c, SECRET_MAP[SECRET_MAP[c] ?? c] ?? c]),
);
const DOUBLE_REVERSE_MAP: Record<string, string> = Object.fromEntries(
  Object.keys(SECRET_REVERSE_MAP).map((c) => [
    c,
    SECRET_REVERSE_MAP[SECRET_REVERSE_MAP[c] ?? c] ?? c,
  ]),
);

// Mode Triple : chiffrement perso applique 3 fois (a→z→e→r)
const TRIPLE_MAP: Record<string, string> = Object.fromEntries(
  Object.keys(SECRET_MAP).map((c) => {
    const s1 = SECRET_MAP[c] ?? c;
    const s2 = SECRET_MAP[s1] ?? s1;
    return [c, SECRET_MAP[s2] ?? s2];
  }),
);
const TRIPLE_REVERSE_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(TRIPLE_MAP).map(([from, to]) => [to, from]),
);

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

// Mode Dynamique : decalage = nombre de lettres dans le texte
function getDynamicShift(text: string): number {
  return text.replace(/[^a-zA-Z]/g, "").length % 26;
}

function buildShiftMap(shift: number): Record<string, string> {
  return Object.fromEntries(ALPHABET.split("").map((c, i) => [c, ALPHABET[(i + shift) % 26]]));
}

function getEncodeMap(mode: ModeCode): Record<string, string> {
  switch (mode) {
    case "secret":      return SECRET_MAP;
    case "mirror":      return MIRROR_MAP;
    case "shift7":      return SHIFT7_MAP;
    case "rot13":       return ROT13_MAP;
    case "shift3":      return SHIFT3_MAP;
    case "double":      return DOUBLE_MAP;
    case "shift11":     return SHIFT11_MAP;
    case "pairs":       return PAIRS_MAP;
    case "splitmirror": return SPLITMIRROR_MAP;
    case "triple":      return TRIPLE_MAP;
    default: return {};
  }
}

function getDecodeMap(mode: ModeCode): Record<string, string> {
  switch (mode) {
    case "secret":      return SECRET_REVERSE_MAP;
    case "mirror":      return MIRROR_MAP;
    case "shift7":      return SHIFT7_REVERSE_MAP;
    case "rot13":       return ROT13_MAP;
    case "shift3":      return SHIFT3_REVERSE_MAP;
    case "double":      return DOUBLE_REVERSE_MAP;
    case "shift11":     return SHIFT11_REVERSE_MAP;
    case "pairs":       return PAIRS_MAP;
    case "splitmirror": return SPLITMIRROR_MAP;
    case "triple":      return TRIPLE_REVERSE_MAP;
    default: return {};
  }
}

function translateLocal(text: string, source: ModeCode, target: ModeCode) {
  if (!text) return "";
  if (source === target) return text;

  if (source === "normal" && target === "dynamic") {
    const shift = getDynamicShift(text);
    return convertWithMap(text, buildShiftMap(shift));
  }
  if (source === "dynamic") {
    const shift = getDynamicShift(text);
    const reverseShift = (26 - shift) % 26;
    return convertWithMap(text, buildShiftMap(reverseShift));
  }

  if (source === "normal") return convertWithMap(text, getEncodeMap(target));
  return convertWithMap(text, getDecodeMap(source));
}

function getOppositeMode(mode: ModeCode): ModeCode {
  return mode === "normal" ? "secret" : "normal";
}

const ALL_SECRET_MODES: ModeCode[] = [
  "secret", "mirror", "shift7", "rot13", "shift3",
  "double", "shift11", "pairs", "splitmirror", "triple", "dynamic",
];

// Vérifie si un mot est "proche" d'un mot connu (tolère fautes légères)
function isApproxKnown(
  word: string,
  shortSet: Set<string>,
  longSet: Set<string>,
): boolean {
  if (!word || word.length < 2) return false;
  const set = word.length <= 3 ? shortSet : longSet;
  const both = (w: string) => shortSet.has(w) || longSet.has(w);

  // Correspondance exacte
  if (both(word)) return true;

  // Lettre(s) en trop à la fin (sallut → salut, mdrrrr → mdr)
  const dedup = word.replace(/(.)\1+/g, "$1");
  if (both(dedup)) return true;

  // Dernière lettre manquante (salu → salut)
  if (word.length >= 4 && both(word.slice(0, -1))) return true;

  // Suffixe classique oublié : s, t, e, r, x, z
  for (const s of ["s", "t", "e", "r", "x", "z"]) {
    if (set.has(word + s)) return true;
  }

  // Première lettre manquante (bonjour → onjour type coquille rare)
  if (word.length >= 5 && both(word.slice(1))) return true;

  return false;
}

// Mots courts (2-3 lettres) très fréquents — FR + EN + ES
const COMMON_FR_WORDS = new Set([
  // Français
  "je", "tu", "il", "on", "en", "un", "ma", "ta", "sa", "va",
  "au", "du", "si", "ou", "et", "ne", "se", "le", "la", "de",
  "ce", "me", "te", "ai", "as", "ah", "oh", "ok", "ca", "ya",
  "les", "des", "mes", "tes", "ses", "son", "ton", "mon", "pas",
  "qui", "que", "par", "sur", "aux", "lui", "oui", "non", "bon",
  "est", "ont", "une", "ces", "eux", "moi", "toi", "soi", "ici",
  "nos", "vos", "car", "but", "top", "sec", "nul",
  // Anglais
  "my", "he", "we", "is", "it", "to", "in", "of", "at", "be",
  "do", "go", "no", "up", "so", "by", "or", "if", "us", "hi",
  "yes", "bro", "can", "did", "get", "got", "had", "has", "him",
  "his", "how", "its", "let", "not", "now", "off", "old", "one",
  "out", "own", "put", "say", "see", "she", "the", "too", "two",
  "use", "was", "way", "who", "why", "yet", "you", "are", "for",
  "and", "but", "imo", "ngl", "omg", "wtf", "lol", "brb", "irl",
  // Espagnol
  "yo", "el", "lo", "le", "mi", "su", "al", "con", "por", "que",
  "una", "los", "las", "del", "sin", "mas", "hay", "fue",
]);

// Mots longs courants — FR + EN + ES : signal fort si le décodé est ici
const COMMON_FR_FULL_WORDS = new Set([
  // Français
  "salut", "bonjour", "bonsoir", "merci", "super", "trop", "bien", "tres",
  "cool", "bonne", "nuit", "matin", "soir", "jour", "gros", "petit",
  "grand", "beau", "belle", "vieux", "fort", "quoi", "donc", "alors",
  "aussi", "encore", "jamais", "toujours", "comment", "pourquoi", "parce",
  "comme", "quand", "apres", "avant", "nous", "vous", "elle", "elles",
  "ils", "leur", "cela", "cette", "tout", "tous", "toute", "avec", "sans",
  "pour", "dans", "mais", "suis", "etes", "sont", "avez", "avons", "font",
  "fait", "fais", "aller", "venir", "faire", "voir", "dire", "voila",
  "maintenant", "demain", "hier", "genre", "grave", "chelou", "zarbi",
  "ouais", "frere", "poto", "attends", "message", "appelle", "reviens",
  "partir", "viens", "reste", "cest", "jtm", "mdr", "ptdr",
  // Anglais
  "what", "that", "this", "with", "have", "from", "they", "will", "your",
  "been", "more", "when", "come", "here", "just", "like", "time", "know",
  "good", "make", "some", "then", "very", "well", "also", "back", "after",
  "over", "think", "look", "want", "them", "long", "made", "down", "into",
  "year", "take", "most", "even", "much", "give", "keep", "turn", "live",
  "tell", "play", "call", "work", "last", "only", "both", "real", "life",
  "each", "must", "next", "home", "feel", "move", "open", "same", "than",
  "them", "then", "these", "those", "should", "could", "would", "about",
  "right", "there", "their", "which", "where", "while", "again", "going",
  "hello", "okay", "yeah", "nope", "sure", "nice", "wait", "stop", "help",
  "please", "sorry", "thank", "later", "really", "actually", "literally",
  "anyway", "still", "never", "every", "other", "after", "before", "always",
  "maybe", "night", "today", "tomorrow", "yesterday", "nothing", "something",
  "everyone", "someone", "anyone", "because", "though", "already", "enough",
  "miss", "love", "hate", "need", "want", "true", "fake", "bro", "bruh",
  "dude", "girl", "omfg", "lmao", "lmfao", "noway", "damn", "okay",
  "mybad", "wassup", "deadass", "lowkey", "highkey", "facts", "word",
  // Espagnol
  "hola", "como", "pero", "para", "todo", "esto", "esta", "bien",
  "aqui", "solo", "hace", "algo", "otra", "quiero", "gracias", "donde",
  "cuando", "porque", "hasta", "desde", "entre", "sobre", "mismo",
  "mucho", "muchos", "tiempo", "bueno", "buena", "siempre", "nunca",
  "mejor", "peor", "nada", "nadie", "todos", "vamos", "claro", "vale",
  "madre", "padre", "amigo", "amiga", "chico", "chica", "venga", "tios",
]);

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
  if (!lowerText) return "normal";

  const knownNormalTokens = new Set([
    // Tech / commandes
    "npm", "run", "build", "start", "dev", "git", "api", "url", "cmd", "cli",
    "http", "https", "www", "js", "ts", "css", "html", "rot", "rot13",
    // Abréviations FR
    "slt", "cv", "r", "ok", "stp", "svp", "tg", "wsh",
    "ptdr", "jsp", "jpp", "osef", "bcp", "qqun", "qqch",
    "flm", "flmm", "tdc", "ntm", "fdp", "pd", "grv", "lvdm", "pq", "clc",
    "mdr", "mdrr", "mdrrr", "mdrrrr", "mdrrrrr",
    "lol", "loll", "lolll", "loool", "looool",
    "nn", "oe", "oue", "az", "azy", "aze", "vaz", "vazi", "we",
    "att", "attt", "atttt", "attttt",
    // Anglais courant court
    "my", "bad", "no", "yes", "hi", "hey", "bye", "omg", "wtf", "lmao",
    "brb", "irl", "imo", "ngl", "tbh", "idk", "idc", "smh", "fyi",
    "asap", "atm", "btw", "eta", "gtg", "hmu", "irl", "nvm", "rn",
    // Espagnol court
    "si", "no", "que", "hola", "vale",
  ]);

  const rawTokens = lowerText.split(/\s+/g).filter(Boolean);

  // Rires type ahaha, hahaha, ahahah, lollll... → toujours texte normal
  if (rawTokens.some((token) => /^(a?ha+)+h?$/.test(token) || /^lo+l+$/.test(token))) {
    return "normal";
  }

  if (
    rawTokens.some(
      (token) =>
        token.includes("/") || token.includes("-") ||
        token.includes("_") || token.includes(".") || /\d/.test(token),
    )
  ) {
    return "normal";
  }

  const plainTokens = rawTokens.map((token) => token.replace(/[^a-z0-9]/g, ""));
  if (plainTokens.some((token) => knownNormalTokens.has(token))) return "normal";

  const words = text.toLowerCase().split(/[^a-z]+/g).filter((w) => w.length > 1);
  if (words.length === 0) return "normal";

  let bestMode: ModeCode = "normal";
  let bestScore = 0;

  for (const mode of ALL_SECRET_MODES) {
    const isDynamic = mode === "dynamic";
    const shift = isDynamic ? getDynamicShift(lowerText) : 0;
    const reverseShift = isDynamic ? (26 - shift) % 26 : 0;
    const decodeMap = isDynamic ? buildShiftMap(reverseShift) : getDecodeMap(mode);
    let totalDelta = 0;
    let strongWords = 0;
    let analyzableWords = 0;

    for (const word of words) {
      if (word.length < 4) continue;
      const decoded = convertWithMap(word, decodeMap);
      const isKnownWord = isApproxKnown(decoded, COMMON_FR_WORDS, COMMON_FR_FULL_WORDS);
      const hasVowel = /[aeiouy]/.test(word);

      // Mot sans voyelle : on l'inclut seulement s'il décode vers un mot connu
      if (!hasVowel && !isKnownWord) continue;

      analyzableWords++;
      const weight = Math.min(2, word.length / 4);

      if (isKnownWord) {
        totalDelta += 0.6 * weight;
        strongWords++;
      } else {
        const inputScore = languageNaturalScore(word);
        const decodedScore = languageNaturalScore(decoded);
        const delta = decodedScore - inputScore;
        totalDelta += delta * weight;
        if (delta > 0.11) strongWords++;
      }
    }

    // Bonus : mots courts (2-3 lettres) qui decodent en mots francais courants
    let commonWordMatches = 0;
    let shortWordsChecked = 0;
    for (const word of words) {
      if (word.length >= 2 && word.length <= 3) {
        shortWordsChecked++;
        const decoded = convertWithMap(word, decodeMap);
        if (isApproxKnown(decoded, COMMON_FR_WORDS, COMMON_FR_FULL_WORDS)) commonWordMatches++;
      }
    }
    const shortWordBonus = shortWordsChecked > 0 ? commonWordMatches / shortWordsChecked : 0;
    const compositeScore = totalDelta + shortWordBonus;
    const strongRatio = analyzableWords > 0 ? strongWords / analyzableWords : 0;
    const hasCommonWordSignal = commonWordMatches >= 2;

    if (
      compositeScore > 0.3 &&
      (strongRatio >= 0.45 || hasCommonWordSignal) &&
      compositeScore > bestScore
    ) {
      bestScore = compositeScore;
      bestMode = mode;
    }
  }

  return bestMode;
}

export default function Home() {
  const [appView, setAppView] = useState<AppView>("secret");
  const [sourceMode, setSourceMode] = useState<ModeCode>("secret");
  const [targetMode, setTargetMode] = useState<ModeCode>("normal");
  const [sourceLanguage, setSourceLanguage] = useState<LanguageCode>("fr");
  const [targetLanguage, setTargetLanguage] = useState<LanguageCode>("en");
  const [sourceText, setSourceText] = useState("");
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
    if (!trimmedText) {
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
            sourceLanguage: "auto",
            targetLanguage,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          setLanguageTranslatedText(sourceText);
          return;
        }

        const data = (await response.json()) as {
          translatedText?: string;
          detectedLanguage?: string;
        };
        setLanguageTranslatedText(data.translatedText ?? sourceText);

        // Met à jour le sélecteur source si la langue détectée est dans notre liste
        if (data.detectedLanguage) {
          const detected = data.detectedLanguage as LanguageCode;
          if (LANGUAGES.some((l) => l.code === detected) && detected !== sourceLanguage) {
            setSourceLanguage(detected);
          }
        }
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
