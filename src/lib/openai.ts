import type { Level } from "../types";
import { hasEnglishLeak } from "./english";
import { stretchLevel } from "./language";
import { tutorMessages, type TutorHistory } from "./tutor";
import { hu } from "../hu";

export type AiFailure = "auth" | "quota" | "network" | "empty" | "other";

export class AiError extends Error {
  failure: AiFailure;

  constructor(failure: AiFailure) {
    super(failure);
    this.failure = failure;
  }
}

export type DraftWord = {
  word: string;
  kind: "noun" | "verb" | "other";
  sentence: string;
  hint: string;
  emoji: string;
  image: string;
};

const WORD = /^[a-záéíóöőúüű][a-záéíóöőúüű\- ]{0,48}$/i;
const CHAT_MODELS = ["gpt-4.1-mini", "gpt-4o-mini"];
const TTS_MODELS = ["gpt-4o-mini-tts", "tts-1"];
const TRANSCRIBE_MODELS = ["gpt-4o-mini-transcribe", "whisper-1"];
const IMAGE_MODELS = ["gpt-image-2.5-flare", "dall-e-3"];

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

async function request(path: string, key: string, init: RequestInit): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${key}`);
  let response: Response;
  try {
    response = await fetch(`https://api.openai.com/v1${path}`, { ...init, headers });
  } catch {
    throw new AiError("network");
  }
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) throw new AiError("auth");
    if (response.status === 429) throw new AiError("quota");
    throw new AiError("other");
  }
  return response;
}

export function parseJsonObject(text: string): unknown {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  return JSON.parse(trimmed);
}

export function parseDrafts(payload: unknown, known: Set<string>): DraftWord[] {
  if (!payload || typeof payload !== "object") return [];
  const cards = (payload as { cards?: unknown }).cards;
  if (!Array.isArray(cards)) return [];
  const drafts: DraftWord[] = [];
  for (const item of cards) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const word = typeof row.word === "string" ? row.word.trim() : "";
    const kind = row.kind === "verb" || row.kind === "other" || row.kind === "noun" ? row.kind : "noun";
    const sentence = typeof row.sentence === "string" ? row.sentence.trim() : "";
    const hint = typeof row.hint === "string" ? row.hint.trim() : "";
    const emoji = typeof row.emoji === "string" ? Array.from(row.emoji.trim()).slice(0, 4).join("") : "✨";
    const image = typeof row.image === "string" ? row.image.trim() : "";
    if (!WORD.test(word)) continue;
    if (known.has(word.toLocaleLowerCase("hu"))) continue;
    if (sentence.length < 4 || sentence.length > 220) continue;
    if (hasEnglishLeak(word) || hasEnglishLeak(sentence) || (hint && hasEnglishLeak(hint))) continue;
    drafts.push({
      word,
      kind,
      sentence,
      hint,
      emoji: emoji || "✨",
      image: image || `A clear everyday scene showing: ${word}`,
    });
  }
  return drafts;
}

async function completeChat(
  key: string,
  messages: ChatMessage[],
  signal: AbortSignal | undefined,
  options: { json?: boolean; temperature?: number; maxTokens?: number },
): Promise<string> {
  let last = new AiError("other");
  for (const model of CHAT_MODELS) {
    try {
      const body: Record<string, unknown> = {
        model,
        messages,
        max_tokens: options.maxTokens ?? 240,
        temperature: options.temperature ?? 0.7,
      };
      if (options.json) body.response_format = { type: "json_object" };
      const response = await request("/chat/completions", key, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal,
      });
      const json = (await response.json()) as {
        choices?: { message?: { content?: string | null } }[];
      };
      const text = json.choices?.[0]?.message?.content?.trim() ?? "";
      if (!text) throw new AiError("empty");
      return text;
    } catch (error) {
      last = error instanceof AiError ? error : new AiError("other");
      if (last.failure === "auth" || last.failure === "quota" || signal?.aborted) throw last;
    }
  }
  throw last;
}

function wordPrompt(target: string): string {
  return [
    "You write Hungarian vocabulary for an immersion app. The learner never sees English.",
    'Return JSON only: {"cards":[{"word":"","kind":"noun","sentence":"","hint":"","emoji":"","image":""}]}',
    "kind is noun, verb, or other.",
    "word, sentence and hint are Hungarian only. No English words, no translations, no parentheses with another language.",
    "nouns are singular dictionary forms. verbs are third-person singular dictionary forms.",
    `sentence is one natural sentence at about CEFR ${target} that uses the word.`,
    "hint explains the meaning in simpler Hungarian, one short sentence.",
    "emoji is one emoji.",
    "image is an English description of one concrete scene for an illustrator. No text in the picture.",
    `Create 3 visual, concrete words at about CEFR ${target}, just above the learner. Do not repeat known words.`,
  ].join("\n");
}

export async function imagineWords(key: string, level: Level, known: string[], signal?: AbortSignal): Promise<DraftWord[]> {
  const target = stretchLevel(level);
  const text = await completeChat(
    key,
    [
      { role: "system", content: wordPrompt(target) },
      {
        role: "user",
        content: `Szint: ${level}. Kerülendő szavak: ${known.slice(0, 300).join(", ") || "nincs"}.`,
      },
    ],
    signal,
    { json: true, temperature: 0.4, maxTokens: 900 },
  );
  let parsed: unknown;
  try {
    parsed = parseJsonObject(text);
  } catch {
    throw new AiError("empty");
  }
  const knownSet = new Set(known.map((word) => word.toLocaleLowerCase("hu")));
  const drafts = parseDrafts(parsed, knownSet).slice(0, 3);
  if (!drafts.length) throw new AiError("empty");
  return drafts;
}

export async function replyAsTutor(
  key: string,
  level: Level,
  scene: string,
  history: TutorHistory[],
  simplify: boolean,
  signal?: AbortSignal,
): Promise<string> {
  const messages = tutorMessages({ level, scene, history, simplify });
  let text = await completeChat(key, messages, signal, { temperature: 0.7, maxTokens: 220 });
  if (hasEnglishLeak(text)) {
    text = await completeChat(
      key,
      [
        ...messages,
        { role: "assistant", content: text },
        {
          role: "system",
          content: "Az előző válaszod nem csak magyar volt. Mondd újra, kizárólag egyszerű magyar mondatokkal.",
        },
      ],
      signal,
      { temperature: 0.4, maxTokens: 180 },
    );
  }
  if (hasEnglishLeak(text)) return hu.talk.safeFallback;
  return text;
}

export async function synthesize(key: string, text: string, signal?: AbortSignal): Promise<Blob> {
  let last = new AiError("other");
  for (const model of TTS_MODELS) {
    try {
      const body: Record<string, unknown> = {
        model,
        voice: "coral",
        input: text,
        response_format: "mp3",
      };
      if (model === "gpt-4o-mini-tts") {
        body.instructions = "Beszélj tisztán, természetes magyar kiejtéssel, tanulóknak elég lassan. Semmi más nyelv.";
      }
      const response = await request("/audio/speech", key, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal,
      });
      return await response.blob();
    } catch (error) {
      last = error instanceof AiError ? error : new AiError("other");
      if (last.failure === "auth" || last.failure === "quota" || signal?.aborted) throw last;
    }
  }
  throw last;
}

export async function transcribe(key: string, blob: Blob, signal?: AbortSignal): Promise<string> {
  const ext = blob.type.includes("mp4") || blob.type.includes("m4a") ? "m4a" : blob.type.includes("wav") ? "wav" : "webm";
  let last = new AiError("other");
  for (const model of TRANSCRIBE_MODELS) {
    try {
      const form = new FormData();
      form.append("file", blob, `beszed.${ext}`);
      form.append("model", model);
      form.append("language", "hu");
      const response = await request("/audio/transcriptions", key, { method: "POST", body: form, signal });
      const json = (await response.json()) as { text?: string };
      return (json.text ?? "").trim();
    } catch (error) {
      last = error instanceof AiError ? error : new AiError("other");
      if (last.failure === "auth" || last.failure === "quota" || signal?.aborted) throw last;
    }
  }
  throw last;
}

export async function generateImage(key: string, description: string, signal?: AbortSignal): Promise<Blob> {
  const prompt = `Simple educational illustration, one subject, centered, soft daylight, plain background, no text, no letters, no watermark, no logo. ${description}`;
  let last = new AiError("other");
  for (const model of IMAGE_MODELS) {
    try {
      const body: Record<string, unknown> = {
        model,
        prompt,
        n: 1,
        size: "1024x1024",
      };
      if (model.startsWith("gpt-image")) {
        body.quality = "low";
        body.output_format = "webp";
        body.output_compression = 70;
      } else {
        body.quality = "standard";
        body.response_format = "b64_json";
      }
      const response = await request("/images/generations", key, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal,
      });
      const json = (await response.json()) as { data?: { b64_json?: string; url?: string }[] };
      const item = json.data?.[0];
      if (item?.b64_json) return base64ToBlob(item.b64_json, model.startsWith("gpt-image") ? "image/webp" : "image/png");
      if (item?.url) {
        const image = await fetch(item.url, { signal });
        if (!image.ok) throw new AiError("other");
        return await image.blob();
      }
      throw new AiError("empty");
    } catch (error) {
      last = error instanceof AiError ? error : new AiError("other");
      if (last.failure === "auth" || last.failure === "quota" || signal?.aborted) throw last;
    }
  }
  throw last;
}

function base64ToBlob(value: string, type: string): Blob {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return new Blob([bytes], { type });
}

export const REALTIME_MODELS = ["gpt-realtime-2.1-mini", "gpt-realtime-mini", "gpt-4o-mini-realtime-preview"];

export function realtimeSession(model: string, instructions: string): Record<string, unknown> {
  return {
    type: "realtime",
    model,
    instructions,
    output_modalities: ["audio"],
    audio: {
      input: {
        transcription: { model: "gpt-4o-mini-transcribe", language: "hu" },
        turn_detection: {
          type: "server_vad",
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 800,
        },
      },
      output: { voice: "marin" },
    },
  };
}

export async function postRealtimeCall(key: string, sdp: string, model: string, instructions: string): Promise<string> {
  const form = new FormData();
  form.append("sdp", new Blob([sdp], { type: "application/sdp" }), "offer.sdp");
  form.append("session", new Blob([JSON.stringify(realtimeSession(model, instructions))], { type: "application/json" }));
  const response = await request("/realtime/calls", key, { method: "POST", body: form });
  const text = (await response.text()).trim();
  if (text.startsWith("v=")) return text;
  try {
    const json = JSON.parse(text) as { sdp?: string };
    if (json.sdp?.trim().startsWith("v=")) return json.sdp.trim();
  } catch {
    /* not json */
  }
  throw new AiError("other");
}
