import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import { STARTER, starterDisplay } from "../data/deck";
import type { Card, DeckCounts, Grade, Level, Profile } from "../types";
import { learnable, todayKey } from "./language";
import { adaptLevel } from "./level";
import { applySm2, initialSrs, interleave } from "./srs";
import { displayOf } from "./language";
import type { DraftWord } from "./openai";

interface MagyarDB extends DBSchema {
  meta: {
    key: string;
    value: Profile;
  };
  cards: {
    key: string;
    value: Card;
    indexes: { "by-due": number };
  };
  media: {
    key: string;
    value: Blob;
  };
}

const DEFAULT_PROFILE: Profile = {
  placementDone: false,
  level: "A0",
  signals: [],
  day: todayKey(),
  newToday: 0,
  quota: 8,
  autoGenerate: false,
  autoAudio: true,
  speakReplies: true,
  tipSeen: false,
};

let database: Promise<IDBPDatabase<MagyarDB>> | null = null;

function getDb(): Promise<IDBPDatabase<MagyarDB>> {
  if (!database) {
    database = openDB<MagyarDB>("magyar", 1, {
      upgrade(db) {
        db.createObjectStore("meta");
        const cards = db.createObjectStore("cards", { keyPath: "id" });
        cards.createIndex("by-due", "due");
        db.createObjectStore("media");
      },
    });
  }
  return database;
}

function normalizeProfile(raw: Profile | undefined): Profile {
  return {
    ...DEFAULT_PROFILE,
    ...raw,
    signals: raw?.signals ?? [],
  };
}

async function saveProfile(profile: Profile): Promise<void> {
  const db = await getDb();
  await db.put("meta", profile, "profile");
}

export async function getProfile(): Promise<Profile> {
  const db = await getDb();
  const stored = await db.get("meta", "profile");
  let profile = normalizeProfile(stored);
  const day = todayKey();
  if (profile.day !== day) {
    profile = { ...profile, day, newToday: 0, quota: 8 };
    await saveProfile(profile);
  }
  return profile;
}

export async function patchProfile(partial: Partial<Profile>): Promise<Profile> {
  const profile = await getProfile();
  const next: Profile = { ...profile, ...partial };
  if (partial.level && partial.level !== profile.level) next.signals = [];
  await saveProfile(next);
  return next;
}

export async function bootstrap(): Promise<Profile> {
  const db = await getDb();
  const existing = await db.getAll("cards");
  const byId = new Map(existing.map((card) => [card.id, card]));
  const tx = db.transaction("cards", "readwrite");
  const now = Date.now();
  for (const starter of STARTER) {
    const content = {
      word: starter.word,
      display: starterDisplay(starter),
      sentence: starter.sentence,
      hint: starter.hint,
      emoji: starter.emoji,
      kind: starter.kind,
      level: starter.level,
    };
    const previous = byId.get(starter.id);
    if (!previous) {
      const card: Card = {
        id: starter.id,
        source: "starter",
        ...content,
        ...initialSrs(0),
        introduced: false,
        createdAt: now,
      };
      await tx.store.add(card);
    } else if (previous.source === "starter") {
      await tx.store.put({ ...previous, ...content });
    }
  }
  await tx.done;
  return getProfile();
}

export async function listCards(): Promise<Card[]> {
  const db = await getDb();
  return db.getAll("cards");
}

export async function knownWords(): Promise<string[]> {
  const cards = await listCards();
  return cards.map((card) => card.word);
}

export async function deckCounts(level: Level): Promise<DeckCounts> {
  const cards = await listCards();
  const now = Date.now();
  const future = cards.filter((card) => card.introduced && card.due > now).map((card) => card.due);
  return {
    due: cards.filter((card) => card.introduced && card.due <= now).length,
    fresh: cards.filter((card) => !card.introduced && learnable(level, card.level)).length,
    learned: cards.filter((card) => card.introduced).length,
    nextDue: future.length ? Math.min(...future) : null,
  };
}

export async function practicePool(level: Level): Promise<Card[]> {
  const cards = await listCards();
  return cards.filter((card) => learnable(level, card.level));
}

let sessionChain: Promise<unknown> = Promise.resolve();

export function buildSession(): Promise<Card[]> {
  const run = sessionChain.then(() => buildSessionInner());
  sessionChain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function buildSessionInner(): Promise<Card[]> {
  const db = await getDb();
  const profile = await getProfile();
  const cards = await db.getAll("cards");
  const now = Date.now();
  const due = cards
    .filter((card) => card.introduced && card.due <= now)
    .sort((a, b) => a.due - b.due || b.lapses - a.lapses);
  const slots = Math.max(0, profile.quota - profile.newToday);
  const fresh = cards
    .filter((card) => !card.introduced && learnable(profile.level, card.level))
    .sort((a, b) => {
      const levelDelta = a.level.localeCompare(b.level);
      if (levelDelta) return levelDelta;
      const left = STARTER.findIndex((item) => item.id === a.id);
      const right = STARTER.findIndex((item) => item.id === b.id);
      return (left === -1 ? 1000 : left) - (right === -1 ? 1000 : right);
    })
    .slice(0, Math.min(8, slots));
  if (fresh.length) {
    const tx = db.transaction("cards", "readwrite");
    for (const card of fresh) {
      card.introduced = true;
      card.due = now;
      await tx.store.put(card);
    }
    await tx.done;
    profile.newToday += fresh.length;
    await saveProfile(profile);
  }
  return interleave(due, fresh).slice(0, 24);
}

export async function bumpQuota(by = 5): Promise<Profile> {
  const profile = await getProfile();
  profile.quota += by;
  await saveProfile(profile);
  return profile;
}

async function recordOutcome(ok: boolean): Promise<Profile> {
  const profile = await getProfile();
  const signals = [...profile.signals, { at: Date.now(), ok }].slice(-40);
  let next: Profile = { ...profile, signals };
  const level = adaptLevel(profile.level, signals);
  if (level !== profile.level) next = { ...next, level, signals: [] };
  await saveProfile(next);
  return next;
}

export async function gradeCard(id: string, grade: Grade): Promise<Profile> {
  const db = await getDb();
  const card = await db.get("cards", id);
  if (!card) return getProfile();
  const next = applySm2(card, grade);
  await db.put("cards", { ...card, ...next, introduced: true });
  return recordOutcome(grade !== 0);
}

export async function recordPractice(ok: boolean): Promise<Profile> {
  return recordOutcome(ok);
}

export async function completePlacement(level: Level): Promise<Profile> {
  return patchProfile({ placementDone: true, level, signals: [] });
}

export async function resetProgress(): Promise<Profile> {
  const db = await getDb();
  await db.clear("cards");
  await db.clear("media");
  await db.delete("meta", "profile");
  return bootstrap();
}

export async function putMedia(id: string, blob: Blob): Promise<void> {
  const db = await getDb();
  await db.put("media", blob, id);
}

export async function getMedia(id: string): Promise<Blob | undefined> {
  const db = await getDb();
  return db.get("media", id);
}

export async function attachAudio(cardId: string, blob: Blob): Promise<void> {
  const audioId = `aud-${cardId}`;
  await putMedia(audioId, blob);
  const db = await getDb();
  const card = await db.get("cards", cardId);
  if (card) await db.put("cards", { ...card, audioId });
}

export async function saveGeneratedCard(id: string, draft: DraftWord, level: Level, imageId?: string, audioId?: string): Promise<Card> {
  const now = Date.now();
  const card: Card = {
    id,
    source: "generated",
    kind: draft.kind,
    word: draft.word,
    display: displayOf(draft.kind, draft.word),
    sentence: draft.sentence,
    hint: draft.hint,
    emoji: draft.emoji || "✨",
    level,
    imageId,
    audioId,
    ...initialSrs(now),
    introduced: true,
    createdAt: now,
  };
  const db = await getDb();
  await db.put("cards", card);
  return card;
}
