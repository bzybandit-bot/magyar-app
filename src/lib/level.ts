import type { Level, Signal } from "../types";
import { LEVELS } from "../types";
import { shiftLevel } from "./language";

export function levelFromPlacement(results: { level: Level; ok: boolean }[]): Level {
  let reached: Level = "A0";
  for (const level of LEVELS) {
    const rows = results.filter((item) => item.level === level);
    if (!rows.length) continue;
    const rate = rows.filter((item) => item.ok).length / rows.length;
    if (rate >= 0.5) reached = level;
    else break;
  }
  return reached;
}

export function adaptLevel(level: Level, signals: Signal[]): Level {
  const recent = signals.slice(-16);
  if (recent.length < 10) return level;
  const rate = recent.filter((signal) => signal.ok).length / recent.length;
  if (rate >= 0.88) return shiftLevel(level, 1);
  if (rate <= 0.4) return shiftLevel(level, -1);
  return level;
}
