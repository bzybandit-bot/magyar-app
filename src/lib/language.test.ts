import { describe, expect, it } from "vitest";
import { hasUiEnglish } from "./english";
import { duePhrase, expectedArticle, greeting, judgeAnswer } from "./language";

const card = { word: "alma", display: "az alma" };

describe("articles and answers", () => {
  it("uses az before a vowel and a before a consonant", () => {
    expect(expectedArticle("alma")).toBe("az");
    expect(expectedArticle("óra")).toBe("az");
    expect(expectedArticle("víz")).toBe("a");
    expect(expectedArticle("eső")).toBe("az");
  });

  it("accepts the word with or without the article, and flags a missing accent", () => {
    expect(judgeAnswer("az alma", card)).toBe("exact");
    expect(judgeAnswer("Alma", card)).toBe("exact");
    expect(judgeAnswer("  az   alma! ", card)).toBe("exact");
    expect(judgeAnswer("álma", card)).toBe("accent");
    expect(judgeAnswer("a alma", card)).toBe("miss");
    expect(judgeAnswer("kutya", card)).toBe("miss");
    expect(judgeAnswer("   ", card)).toBe("miss");
  });
});

describe("time phrases", () => {
  const now = new Date(2026, 5, 1, 12, 0, 0).getTime();

  it("greets in Hungarian and says when the next card is due in English", () => {
    expect(greeting(new Date(2026, 5, 1, 8))).toBe("Jó reggelt");
    expect(greeting(new Date(2026, 5, 1, 14))).toBe("Jó napot");
    expect(greeting(new Date(2026, 5, 1, 20))).toBe("Jó estét");
    expect(greeting(new Date(2026, 5, 1, 23))).toBe("Szép éjszakát");
    for (const phrase of [
      greeting(new Date(2026, 5, 1, 8)),
      greeting(new Date(2026, 5, 1, 14)),
      greeting(new Date(2026, 5, 1, 20)),
      greeting(new Date(2026, 5, 1, 23)),
    ]) {
      expect(hasUiEnglish(phrase), phrase).toBe(false);
    }
    expect(duePhrase(now + 20_000, now)).toBe("The next card is coming soon.");
    expect(duePhrase(now + 12 * 60_000, now)).toBe("12 minutes until the next card.");
    expect(duePhrase(now + 3 * 3_600_000, now)).toBe("3 hours until the next card.");
    expect(duePhrase(now + 2 * 86_400_000, now)).toBe("2 days until the next card.");
  });
});
