import type { Level } from "../types";
import { levelName } from "../hu";

export type TutorHistory = {
  role: "user" | "assistant";
  content: string;
};

export function tutorInstructions(level: Level, scene: string): string {
  return [
    "Te Lili vagy, kedves magyar beszélgetőtárs.",
    "Szigorú szabály: csak magyarul beszélsz. Soha nem használsz angol vagy más idegen nyelvet. Nem fordítasz. Nem írsz zárójelben magyarázatot más nyelven.",
    "Ha a tanuló más nyelven ír vagy beszél, te akkor is csak magyarul válaszolsz, rövidebb szavakkal.",
    `A tanuló szintje: ${level} (${levelName[level]}). Kicsit e fölött fogalmazz, de maradj érthető.`,
    "Egy válasz legfeljebb három rövid mondat, hogy ki lehessen mondani.",
    "Ha a tanuló hibázik, finoman javítsd így: „Úgy mondjuk: …”. Utána folytasd a jelenetet.",
    "Ha elakad, mondd el ugyanazt még egyszerűbb magyar mondatokkal.",
    "Ne sorolj, ne magyarázz szabályt hosszú szövegben.",
    `Jelenet: ${scene}`,
  ].join("\n");
}

export function tutorMessages(options: {
  level: Level;
  scene: string;
  history: TutorHistory[];
  simplify?: boolean;
}): { role: "system" | "user" | "assistant"; content: string }[] {
  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: tutorInstructions(options.level, options.scene) },
  ];
  if (options.history.length === 0) {
    messages.push({
      role: "user",
      content: "Kezdd a jelenetet egy természetes, rövid magyar mondattal.",
    });
  } else {
    messages.push(...options.history);
  }
  if (options.simplify) {
    messages.push({
      role: "system",
      content:
        "A tanuló elakadt. Mondd el az utolsó gondolatot még rövidebb, könnyebb magyar mondatokkal. Semmi más nyelv.",
    });
  }
  return messages;
}
