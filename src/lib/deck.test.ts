import { describe, expect, it } from "vitest";
import { STARTER, starterDisplay } from "../data/deck";
import { PLACEMENT } from "../data/placement";
import { SCENARIOS } from "../data/scenarios";
import { LEVELS } from "../types";
import { hasEnglishLeak, hasUiEnglish } from "./english";
import { expectedArticle } from "./language";
import { tutorInstructions } from "./tutor";

describe("starter deck", () => {
  const byId = new Map(STARTER.map((card) => [card.id, card]));

  it("has unique ids and enough words in every band", () => {
    expect(byId.size).toBe(STARTER.length);
    for (const level of LEVELS) {
      expect(STARTER.filter((card) => card.level === level).length).toBeGreaterThanOrEqual(8);
    }
  });

  it("gives nouns the spoken article and keeps learner text Hungarian", () => {
    for (const card of STARTER) {
      expect(hasEnglishLeak(card.word), card.id).toBe(false);
      expect(hasEnglishLeak(card.sentence), card.sentence).toBe(false);
      expect(hasEnglishLeak(card.hint), card.hint).toBe(false);
      if (card.kind === "noun") {
        expect(starterDisplay(card)).toBe(`${expectedArticle(card.word)} ${card.word}`);
      } else {
        expect(starterDisplay(card)).toBe(card.word);
      }
    }
  });

  it("points every placement choice at a real card", () => {
    for (const level of LEVELS) {
      expect(PLACEMENT.filter((item) => item.level === level).length).toBeGreaterThanOrEqual(2);
    }
    for (const item of PLACEMENT) {
      expect(item.options).toContain(item.answer);
      for (const id of item.options) expect(byId.has(id), id).toBe(true);
    }
  });

  it("keeps scenes and the partner brief free of English leaks", () => {
    for (const scenario of SCENARIOS) {
      expect(hasUiEnglish(scenario.label), scenario.label).toBe(false);
      expect(hasEnglishLeak(scenario.scene), scenario.scene).toBe(false);
    }
    expect(hasEnglishLeak(tutorInstructions("A2", SCENARIOS[0].scene))).toBe(false);
  });
});
