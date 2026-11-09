import { useMemo, useState } from "react";
import { STARTER, starterDisplay } from "../data/deck";
import { PLACEMENT } from "../data/placement";
import { learn, levelBlurb, levelName, ui } from "../hu";
import { shuffle } from "../lib/language";
import { levelFromPlacement } from "../lib/level";
import { speak, stopAudio } from "../lib/speech";
import type { Level } from "../types";
import { useApp } from "../state";
import { Picture } from "../ui/Picture";
import { Tulip } from "../ui/Icons";

const byId = new Map(STARTER.map((card) => [card.id, card]));

export function Placement({ onDone }: { onDone: (level: Level) => Promise<void> }) {
  const { online } = useApp();
  const [phase, setPhase] = useState<"intro" | "quiz" | "result">("intro");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const item = PLACEMENT[index];
  const options = useMemo(() => (item ? shuffle(item.options) : []), [item]);

  async function speakAnswer() {
    if (!item) return;
    const card = byId.get(item.answer);
    if (!card) return;
    try {
      await speak(starterDisplay(card));
    } catch {
      /* a készülék hangja nem mindig elérhető */
    }
  }

  function begin() {
    setPhase("quiz");
    const first = PLACEMENT[0];
    if (first?.mode === "audio") {
      const card = byId.get(first.answer);
      if (card) void speak(starterDisplay(card)).catch(() => undefined);
    }
  }

  function choose(id: string) {
    if (!item || picked || busy) return;
    setPicked(id);
    const ok = id === item.answer;
    const nextAnswers = [...answers, ok];
    window.setTimeout(() => {
      stopAudio();
      if (index + 1 >= PLACEMENT.length) {
        setAnswers(nextAnswers);
        setPhase("result");
        setPicked(null);
        return;
      }
      const upcoming = PLACEMENT[index + 1];
      setAnswers(nextAnswers);
      setIndex(index + 1);
      setPicked(null);
      if (upcoming?.mode === "audio") {
        const card = byId.get(upcoming.answer);
        if (card) void speak(starterDisplay(card)).catch(() => undefined);
      }
    }, 700);
  }

  if (phase === "intro") {
    return (
      <main className="gate">
        <Tulip />
        <h1>{ui.appName}</h1>
        <p className="lead">{ui.placement.tagline}</p>
        <p>{ui.placement.intro}</p>
        {!online && <p className="banner">{ui.offline}</p>}
        <button className="btn primary" type="button" onClick={begin}>
          {ui.placement.start}
        </button>
        <button className="btn ghost" type="button" onClick={() => void onDone("A0")}>
          {ui.placement.beginner}
        </button>
      </main>
    );
  }

  if (phase === "result") {
    const level = levelFromPlacement(PLACEMENT.map((entry, entryIndex) => ({ level: entry.level, ok: answers[entryIndex] ?? false })));
    return (
      <main className="gate">
        <p className="eyebrow">{ui.placement.result}</p>
        <h1>
          {level}
          <span> · {levelName[level]}</span>
        </h1>
        <p className="lead">{levelBlurb[level]}</p>
        <button className="btn primary" type="button" disabled={busy} onClick={() => {
          setBusy(true);
          void onDone(level);
        }}>
          {ui.placement.go}
        </button>
      </main>
    );
  }

  if (!item) return null;
  const answer = byId.get(item.answer);
  if (!answer) return null;

  return (
    <main className="gate">
      <p className="eyebrow">{ui.placement.progress(index + 1, PLACEMENT.length)}</p>
      <h1 lang="hu">{item.mode === "audio" ? learn.placement.audio : learn.placement.picture}</h1>
      {item.mode === "picture" ? (
        <Picture id={answer.id} emoji={answer.emoji} label={learn.cards.what} lang="hu" />
      ) : (
        <button className="btn ghost" type="button" onClick={() => void speakAnswer()}>
          {ui.placement.replay}
        </button>
      )}
      <div className={item.mode === "audio" ? "choices" : "stack"}>
        {options.map((id, optionIndex) => {
          const card = byId.get(id);
          if (!card) return null;
          const state = picked ? (id === item.answer ? "right" : id === picked ? "bad" : "") : "";
          if (item.mode === "audio") {
            return (
              <button key={id} type="button" className={`choice ${state}`} onClick={() => choose(id)}>
                <Picture id={card.id} emoji={card.emoji} label={ui.practice.choice(optionIndex + 1)} />
              </button>
            );
          }
          return (
            <button key={id} type="button" className={`btn ghost choice-text ${state}`} lang="hu" onClick={() => choose(id)}>
              {starterDisplay(card)}
            </button>
          );
        })}
      </div>
    </main>
  );
}
