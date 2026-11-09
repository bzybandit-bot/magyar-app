import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { chromeCopy, learn, learningCopy, levelNameHu, ui } from "../hu";
import { hasEnglishLeak, hasUiEnglish } from "./english";
import { parseDrafts, parseJsonObject } from "./openai";

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name: string) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return path.endsWith(".tsx") ? [path] : [];
  });
}

function visibleLiterals(source: string): string[] {
  const stripped = source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:"'])\/\/.*$/gm, "$1");
  const found: string[] = [];
  const text = /<[A-Za-z][^<>]*>([^<>{}\n]*[A-Za-zÁÉÍÓÖŐÚÜŰáéíóöőúüű][^<>{}\n]*)<\//g;
  const attr = /\b(?:aria-label|placeholder|alt|title)=["']([^"']*[A-Za-zÁÉÍÓÖŐÚÜŰáéíóöőúüű][^"']*)["']/g;
  for (const match of stripped.matchAll(text)) found.push(match[1].trim());
  for (const match of stripped.matchAll(attr)) found.push(match[1].trim());
  return found.filter(Boolean);
}

const HUNGARIAN_CHROME = /Kezdőlap|Kártyák|Gyakorlás|Beszéd|Beállítások|Betöltés|Mentés|Kulcs|Hallgasd|Újra hallgatom/;
const GLOSS = /\b(apple|dog|cat|water|bread|hello|please|thank you|translation|means|the word for)\b/i;

describe("chrome copy", () => {
  it("names navigation, setup, and errors in English", () => {
    expect(ui.nav).toEqual({
      home: "Home",
      cards: "Cards",
      practice: "Practice",
      talk: "Talk",
      settings: "Settings",
    });
    expect(ui.boot).toBe("Loading…");
    expect(ui.placement.start).toBe("Start");
    expect(ui.placement.beginner).toBe("I'm a complete beginner");
    expect(ui.placement.replay).toBe("Listen again");
    expect(ui.settings.title).toBe("Settings");
    expect(ui.settings.keyTitle).toBe("Key");
    expect(ui.settings.save).toBe("Save");
    expect(ui.settings.clearKey).toBe("Delete key");
    expect(ui.cards.again).toBe("Again");
    expect(ui.cards.show).toBe("Show the word");
    expect(ui.errors.auth).toBe("The service rejected the key.");
    expect(ui.errors.storage).toBe("Saved progress could not be opened.");
    expect(ui.talk.call).toBe("Call");
    expect(ui.talk.hangup).toBe("End call");
    expect(ui.talk.placeholder).toBe("Write in Hungarian…");
  });

  it("does not leave Hungarian menus in the chrome catalog", () => {
    for (const line of chromeCopy()) expect(line, line).not.toMatch(HUNGARIAN_CHROME);
  });
});

describe("task content", () => {
  it("keeps prompts, answers, and Lili's fallback in Hungarian", () => {
    expect(learn.placement.picture).toBe("Melyik szó illik a képhez?");
    expect(learn.placement.audio).toBe("Hallgasd meg, és válaszd ki a képet.");
    expect(learn.cards.what).toBe("Mi ez?");
    expect(learn.practice.picture).toBe("Melyik szó illik a képhez?");
    expect(learn.practice.audio).toBe("Melyik kép illik a hanghoz?");
    expect(learn.practice.type).toBe("Mi van a képen? Írd magyarul.");
    expect(learn.practice.placeholder).toBe("Írd a magyar szót");
    expect(learn.practice.accentNote).toBe("Az ékezet számít.");
    expect(learn.practice.correct).toBe("Így van.");
    expect(learn.practice.accent("az alma")).toBe("Majdnem. Az ékezet más: az alma.");
    expect(learn.practice.wrong("a kutya")).toBe("Nem ez volt. A szó: a kutya.");
    expect(learn.talk.safeFallback).toBe("Nem mondom el más nyelven. Mondd röviden, magyarul.");
    expect(levelNameHu).toEqual({
      A0: "első lépés",
      A1: "kezdő",
      A2: "alapfok",
      B1: "középfok",
      B2: "haladó",
    });
    for (const line of learningCopy()) {
      expect(hasEnglishLeak(line), line).toBe(false);
      expect(hasUiEnglish(line), line).toBe(false);
    }
  });

  it("does not bake English glosses into the interface files", () => {
    const offenders: string[] = [];
    for (const file of [...sourceFiles(join(process.cwd(), "src")), join(process.cwd(), "index.html")]) {
      for (const literal of visibleLiterals(readFileSync(file, "utf8"))) {
        if (GLOSS.test(literal) || HUNGARIAN_CHROME.test(literal)) offenders.push(`${file}: ${literal}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});

describe("generated cards", () => {
  it("drops English drafts and keeps a Hungarian one", () => {
    const parsed = parseJsonObject('```json\n{"cards":[{"word":"pékség","kind":"noun","sentence":"A pékségben kenyeret veszek.","hint":"Itt kenyeret sütnek.","emoji":"🥖","image":"bakery"}]}\n```');
    const drafts = parseDrafts(parsed, new Set());
    expect(drafts).toHaveLength(1);
    expect(drafts[0]?.word).toBe("pékség");
    const rejected = parseDrafts(
      { cards: [{ word: "bread", kind: "noun", sentence: "This is bread.", hint: "food", emoji: "🍞", image: "bread" }] },
      new Set(["pékség"]),
    );
    expect(rejected).toEqual([]);
  });
});
