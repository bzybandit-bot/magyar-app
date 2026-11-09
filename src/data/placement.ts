import type { Level } from "../types";

export type PlacementMode = "picture" | "audio";

export type PlacementItem = {
  level: Level;
  mode: PlacementMode;
  answer: string;
  options: string[];
};

export const PLACEMENT: PlacementItem[] = [
  { level: "A0", mode: "picture", answer: "alma", options: ["alma", "kutya", "viz", "konyv"] },
  { level: "A0", mode: "audio", answer: "macska", options: ["macska", "auto", "haz", "eso"] },
  { level: "A1", mode: "picture", answer: "iskola", options: ["iskola", "csalad", "piac", "orvos"] },
  { level: "A1", mode: "audio", answer: "olvas", options: ["olvas", "sportol", "alszik", "foz"] },
  { level: "A2", mode: "picture", answer: "pekseg", options: ["pekseg", "gyogyszertar", "palyaudvar", "edzoterem"] },
  { level: "A2", mode: "audio", answer: "idojaras", options: ["idojaras", "berlet", "szamla", "cel"] },
  { level: "B1", mode: "picture", answer: "edzoterem", options: ["edzoterem", "pekseg", "mozi", "piac"] },
  { level: "B1", mode: "audio", answer: "hatarido", options: ["hatarido", "kompromisszum", "arnyalat", "eso"] },
  { level: "B2", mode: "picture", answer: "kompromisszum", options: ["kompromisszum", "vita", "szamla", "berlet"] },
  { level: "B2", mode: "picture", answer: "fenntarthatosag", options: ["fenntarthatosag", "elojtelet", "keses", "jegy"] },
];
