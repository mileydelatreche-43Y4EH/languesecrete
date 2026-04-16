import { NextResponse } from "next/server";

type TranslateBody = {
  text?: string;
  sourceLanguage?: string;
  targetLanguage?: string;
};

function parseGoogleTranslatePayload(payload: unknown): string {
  if (!Array.isArray(payload) || !Array.isArray(payload[0])) {
    return "";
  }

  const translated = payload[0]
    .map((part) => (Array.isArray(part) ? part[0] : ""))
    .filter((part): part is string => typeof part === "string")
    .join("");

  return translated;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as TranslateBody;
    const text = body.text?.trim() ?? "";
    const source = body.sourceLanguage?.trim() ?? "auto";
    const target = body.targetLanguage?.trim() ?? "en";

    if (!text) {
      return NextResponse.json({ translatedText: "" });
    }

    const endpoint = new URL("https://translate.googleapis.com/translate_a/single");
    endpoint.searchParams.set("client", "gtx");
    endpoint.searchParams.set("sl", source || "auto");
    endpoint.searchParams.set("tl", target);
    endpoint.searchParams.set("dt", "t");
    endpoint.searchParams.set("q", text);

    const response = await fetch(endpoint, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json({ translatedText: text }, { status: 200 });
    }

    const payload = (await response.json()) as unknown;
    const translatedText = parseGoogleTranslatePayload(payload) || text;

    // Google renvoie la langue détectée en payload[2]
    const detectedLanguage =
      Array.isArray(payload) && typeof payload[2] === "string" ? payload[2] : null;

    return NextResponse.json({ translatedText, detectedLanguage });
  } catch {
    return NextResponse.json({ translatedText: "" }, { status: 200 });
  }
}
