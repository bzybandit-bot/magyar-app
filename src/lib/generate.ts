import { ui } from "../hu";
import type { Level } from "../types";
import { knownWords, putMedia, saveGeneratedCard } from "./db";
import { stretchLevel } from "./language";
import { AiError, generateImage, imagineWords, synthesize } from "./openai";
import { displayOf } from "./language";

function fatal(error: unknown): boolean {
  return error instanceof AiError && (error.failure === "auth" || error.failure === "quota" || error.failure === "network");
}

let creating = false;

export async function createVocabulary(options: {
  key: string;
  level: Level;
  onProgress?: (text: string) => void;
  signal?: AbortSignal;
}): Promise<number> {
  if (creating) return 0;
  creating = true;
  try {
    options.onProgress?.(ui.gen.words);
    const known = await knownWords();
    const drafts = await imagineWords(options.key, options.level, known, options.signal);
    const target = stretchLevel(options.level);
    let saved = 0;
    for (let index = 0; index < drafts.length; index += 1) {
      if (options.signal?.aborted) break;
      const draft = drafts[index];
      const id = `g-${crypto.randomUUID()}`;
      let imageId: string | undefined;
      options.onProgress?.(ui.gen.image(index + 1, drafts.length));
      try {
        const image = await generateImage(options.key, draft.image, options.signal);
        imageId = `img-${id}`;
        await putMedia(imageId, image);
      } catch (error) {
        if (options.signal?.aborted) break;
        if (fatal(error) && saved === 0) throw error;
      }
      let audioId: string | undefined;
      options.onProgress?.(ui.gen.audio(index + 1, drafts.length));
      try {
        const spoken = `${displayOf(draft.kind, draft.word)}. ${draft.sentence}`;
        const audio = await synthesize(options.key, spoken, options.signal);
        audioId = `aud-${id}`;
        await putMedia(audioId, audio);
      } catch (error) {
        if (options.signal?.aborted) break;
        if (fatal(error) && saved === 0 && !imageId) throw error;
      }
      if (options.signal?.aborted) break;
      await saveGeneratedCard(id, draft, target, imageId, audioId);
      saved += 1;
    }
    if (!saved && !options.signal?.aborted) throw new AiError("empty");
    return saved;
  } finally {
    creating = false;
  }
}
