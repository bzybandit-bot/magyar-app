import type { Card, Kind, Level } from "../types";
import { LEVELS } from "../types";

const VOWEL = /^[aáeéiíoóöőuúüű]/i;

export function expectedArticle(word: string): "a" | "az" {
  return VOWEL.test(word.trim()) ? "az" : "a";
}

export function displayOf(kind: Kind, word: string): string {
  if (kind !== "noun") return word;
  return `${expectedArticle(word)} ${word}`;
}

export function normalize(value: string): string {
  return value.trim().toLocaleLowerCase("hu").replace(/[?.!,;:]+/g, "").replace(/\s+/g, " ");
}

export function foldAccents(value: string): string {
  return normalize(value).normalize("NFD").replace(/\p{M}/gu, "");
}

export type AnswerJudgement = "exact" | "accent" | "miss";

export function judgeAnswer(input: string, card: Pick<Card, "word" | "display">): AnswerJudgement {
  const forms = [card.word, card.display];
  const foldedInput = foldAccents(input);
  if (!normalize(input)) return "miss";
  if (forms.some((form) => normalize(form) === normalize(input))) return "exact";
  if (forms.some((form) => foldAccents(form) === foldedInput)) return "accent";
  return "miss";
}

export function levelIndex(level: Level): number {
  return LEVELS.indexOf(level);
}

export function shiftLevel(level: Level, direction: -1 | 1): Level {
  const next = levelIndex(level) + direction;
  return LEVELS[Math.max(0, Math.min(LEVELS.length - 1, next))];
}

export function learnable(user: Level, card: Level): boolean {
  return levelIndex(card) <= levelIndex(user) + 1;
}

export function stretchLevel(level: Level): Level {
  return shiftLevel(level, 1);
}

export function todayKey(date = new Date()): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function greeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 10) return "Jó reggelt";
  if (hour < 18) return "Jó napot";
  if (hour < 22) return "Jó estét";
  return "Szép éjszakát";
}

export function duePhrase(when: number, now = Date.now()): string {
  const minutes = Math.round((when - now) / 60000);
  if (minutes <= 1) return "The next card is coming soon.";
  if (minutes < 60) return `${minutes} minutes until the next card.`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hours until the next card.`;
  const days = Math.round(hours / 24);
  return `${days} days until the next card.`;
}

export function shuffle<T>(list: T[]): T[] {
  const copy = [...list];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

export function hueOf(id: string): number {
  let hash = 0;
  for (const char of id) hash = (hash * 33 + char.charCodeAt(0)) >>> 0;
  return hash % 360;
}
