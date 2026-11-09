import { useEffect, useState } from "react";
import { hu } from "../hu";
import { practicePool, recordPractice } from "../lib/db";
import { judgeAnswer, shuffle } from "../lib/language";
import { speak, stopAudio } from "../lib/speech";
import { useApp } from "../state";
import type { Card } from "../types";
import { Picture } from "../ui/Picture";

type Mode = "hear" | "see" | "write";

export function Practice() {
  const { profile, setProfile } = useApp();
  const [mode, setMode] = useState<Mode>("see");
  const [pool, setPool] = useState<Card[]>([]);
  const [card, setCard] = useState<Card | null>(null);
  const [options, setOptions] = useState<Card[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [typed, setTyped] = useState("");
  const [judgement, setJudgement] = useState<"exact" | "accent" | "miss" | null>(null);
  const [score, setScore] = useState(0);
  const [ready, setReady] = useState(false);

  function draw(cards: Card[], nextMode: Mode, previous?: string, speakNow = false) {
    if (!cards.length) {
      setCard(null);
      return;
    }
    const rest = cards.filter((item) => item.id !== previous);
    const source = rest.length ? rest : cards;
    const next = source[Math.floor(Math.random() * source.length)];
    setCard(next);
    setPicked(null);
    setTyped("");
    setJudgement(null);
    if (nextMode === "write") setOptions([]);
    else setOptions(shuffle([next, ...shuffle(cards.filter((item) => item.id !== next.id)).slice(0, 3)]));
    if (speakNow && nextMode === "hear") void speak(next.display).catch(() => undefined);
  }

  useEffect(() => {
    let alive = true;
    void practicePool(profile.level).then((cards) => {
      if (!alive) return;
      setPool(cards);
      setReady(true);
      if (cards.length) {
        const next = cards[Math.floor(Math.random() * cards.length)];
        setCard(next);
        setOptions(shuffle([next, ...shuffle(cards.filter((item) => item.id !== next.id)).slice(0, 3)]));
      }
    });
    return () => {
      alive = false;
      stopAudio();
    };
  }, [profile.level]);

  async function finish(ok: boolean) {
    if (ok) setScore((value) => value + 1);
    const next = await recordPractice(ok);
    setProfile(next);
  }

  function choose(option: Card) {
    if (!card || judgement) return;
    setPicked(option.id);
    const ok = option.id === card.id;
    setJudgement(ok ? "exact" : "miss");
    void finish(ok);
  }

  function checkTyped() {
    if (!card || judgement) return;
    const result = judgeAnswer(typed, card);
    setJudgement(result);
    void finish(result === "exact");
  }

  function another() {
    if (!card) return;
    draw(pool, mode, card.id, true);
  }

  const feedback =
    judgement === "exact"
      ? hu.practice.correct
      : judgement === "accent" && card
        ? hu.practice.accent(card.display)
        : judgement === "miss" && card
          ? hu.practice.wrong(card.display)
          : "";

  return (
    <div className="stack">
      <header className="top">
        <h1>{hu.practice.title}</h1>
      </header>
      <div className="modes" role="tablist">
        {(
          [
            ["hear", hu.practice.hear],
            ["see", hu.practice.see],
            ["write", hu.practice.write],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={mode === id}
            className={mode === id ? "on" : ""}
            onClick={() => {
              setMode(id);
              if (card) draw(pool, id, card.id, true);
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="muted">{hu.practice.score(score)}</p>
      {!ready && <p>{hu.boot}</p>}
      {ready && !card && <p>{hu.practice.empty}</p>}
      {card && (
        <>
          <h2>{mode === "hear" ? hu.practice.audio : mode === "write" ? hu.practice.type : hu.practice.picture}</h2>
          {mode !== "hear" && <Picture id={card.id} emoji={card.emoji} imageId={card.imageId} label={hu.cards.what} />}
          {mode === "hear" && (
            <button className="btn ghost" type="button" onClick={() => void speak(card.display).catch(() => undefined)}>
              {hu.placement.replay}
            </button>
          )}
          {mode === "write" ? (
            <form
              className="stack"
              onSubmit={(event) => {
                event.preventDefault();
                checkTyped();
              }}
            >
              <input
                lang="hu"
                value={typed}
                onChange={(event) => setTyped(event.target.value)}
                placeholder={hu.practice.placeholder}
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                disabled={Boolean(judgement)}
              />
              <p className="muted">{hu.practice.accentNote}</p>
              {!judgement && (
                <button className="btn primary" type="submit">
                  {hu.practice.check}
                </button>
              )}
            </form>
          ) : (
            <div className={mode === "hear" ? "choices" : "stack"}>
              {options.map((option, optionIndex) => {
                const state = judgement ? (option.id === card.id ? "right" : option.id === picked ? "bad" : "") : "";
                if (mode === "hear") {
                  return (
                    <button key={option.id} type="button" className={`choice ${state}`} onClick={() => choose(option)} disabled={Boolean(judgement)}>
                      <Picture id={option.id} emoji={option.emoji} imageId={option.imageId} label={hu.practice.choice(optionIndex + 1)} />
                    </button>
                  );
                }
                return (
                  <button key={option.id} type="button" className={`btn ghost choice-text ${state}`} onClick={() => choose(option)} disabled={Boolean(judgement)}>
                    {option.display}
                  </button>
                );
              })}
            </div>
          )}
          {feedback && (
            <p role="status" className={judgement === "exact" ? "note good-note" : "note"}>
              {feedback}
            </p>
          )}
          {judgement && (
            <button className="btn primary" type="button" onClick={another}>
              {hu.practice.next}
            </button>
          )}
        </>
      )}
    </div>
  );
}
