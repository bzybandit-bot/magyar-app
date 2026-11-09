import type { Grade } from "../types";

export type SrsState = {
  ease: number;
  interval: number;
  repetitions: number;
  due: number;
  lapses: number;
};

const DAY = 24 * 60 * 60 * 1000;
const AGAIN = 10 * 60 * 1000;

export function initialSrs(now = Date.now()): SrsState {
  return { ease: 2.5, interval: 0, repetitions: 0, due: now, lapses: 0 };
}

export function applySm2(card: SrsState, grade: Grade, now = Date.now()): SrsState {
  let { ease, interval, repetitions, lapses } = card;
  if (grade < 3) {
    return {
      ease,
      interval: 0,
      repetitions: 0,
      lapses: lapses + 1,
      due: now + AGAIN,
    };
  }
  if (repetitions === 0) interval = 1;
  else if (repetitions === 1) interval = 6;
  else interval = Math.max(1, Math.round(interval * ease));
  repetitions += 1;
  ease = ease + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
  if (ease < 1.3) ease = 1.3;
  interval = Math.min(365, interval);
  return { ease, interval, repetitions, lapses, due: now + interval * DAY };
}

export function interleave<T>(due: T[], fresh: T[]): T[] {
  if (!due.length) return [...fresh];
  const out: T[] = [];
  let freshIndex = 0;
  for (const card of due) {
    out.push(card);
    if (out.length % 2 === 0 && freshIndex < fresh.length) {
      out.push(fresh[freshIndex]);
      freshIndex += 1;
    }
  }
  while (freshIndex < fresh.length) {
    out.push(fresh[freshIndex]);
    freshIndex += 1;
  }
  return out;
}
