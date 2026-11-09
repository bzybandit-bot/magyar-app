export const LEVELS = ["A0", "A1", "A2", "B1", "B2"] as const;

export type Level = (typeof LEVELS)[number];

export type Grade = 0 | 3 | 4 | 5;

export type Kind = "noun" | "verb" | "other";

export type Source = "starter" | "generated";

export type Screen = "home" | "cards" | "practice" | "talk" | "settings";

export type Signal = {
  at: number;
  ok: boolean;
};

export type Card = {
  id: string;
  source: Source;
  kind: Kind;
  word: string;
  display: string;
  sentence: string;
  hint: string;
  emoji: string;
  level: Level;
  imageId?: string;
  audioId?: string;
  ease: number;
  interval: number;
  repetitions: number;
  due: number;
  lapses: number;
  introduced: boolean;
  createdAt: number;
};

export type Profile = {
  placementDone: boolean;
  level: Level;
  signals: Signal[];
  day: string;
  newToday: number;
  quota: number;
  autoGenerate: boolean;
  autoAudio: boolean;
  speakReplies: boolean;
  tipSeen: boolean;
};

export type DeckCounts = {
  due: number;
  fresh: number;
  learned: number;
  nextDue: number | null;
};

export type ChatTurn = {
  id: string;
  role: "user" | "partner";
  text: string;
};
