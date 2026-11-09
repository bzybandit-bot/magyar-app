import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { allCopy } from "../hu";
import { hasUiEnglish } from "./english";
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

describe("learner-facing copy", () => {
  it("keeps the string catalog free of English UI words", () => {
    for (const line of allCopy()) expect(hasUiEnglish(line), line).toBe(false);
  });

  it("does not bake English sentences into the interface files", () => {
    const offenders: string[] = [];
    for (const file of [...sourceFiles(join(process.cwd(), "src")), join(process.cwd(), "index.html")]) {
      for (const literal of visibleLiterals(readFileSync(file, "utf8"))) {
        if (hasUiEnglish(literal)) offenders.push(`${file}: ${literal}`);
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
