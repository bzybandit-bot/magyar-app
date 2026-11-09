import { useEffect, useRef, useState } from "react";
import { hu } from "../hu";
import { attachAudio, buildSession, bumpQuota, getMedia, gradeCard } from "../lib/db";
import { explainFailure } from "../lib/fail";
import { createVocabulary } from "../lib/generate";
import { readKey } from "../lib/key";
import { synthesize } from "../lib/openai";
import { playBlob, speak, stopAudio } from "../lib/speech";
import { useApp } from "../state";
import type { Card, Grade } from "../types";
import { Picture } from "../ui/Picture";

const RATINGS: { grade: Grade; label: string; tone: string }[] = [
  { grade: 0, label: hu.cards.again, tone: "again" },
  { grade: 3, label: hu.cards.hard, tone: "hard" },
  { grade: 4, label: hu.cards.good, tone: "good" },
  { grade: 5, label: hu.cards.easy, tone: "easy" },
];

export function Cards() {
  const { profile, setProfile, hasKey, counts, refreshCounts, setScreen } = useApp();
  const [queue, setQueue] = useState<Card[]>([]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);
  const [finished, setFinished] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const abort = useRef<AbortController | null>(null);
  const card = queue[index];

  async function load() {
    setLoading(true);
    const next = await buildSession();
    setQueue(next);
    setIndex(0);
    setRevealed(false);
    setDone(next.length === 0);
    setFinished(false);
    setLoading(false);
    await refreshCounts();
  }

  useEffect(() => {
    void load();
    return () => {
      stopAudio();
      abort.current?.abort();
    };
    // The queue is built once when the screen opens. Later rounds call load directly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!done || finished || !profile.autoGenerate || !hasKey || busy) return;
    void generate();
    // generate is intentionally tied to the empty-queue moment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done, finished, profile.autoGenerate, hasKey]);

  async function play(current: Card, part: "word" | "sentence") {
    const text = part === "word" ? current.display : current.sentence;
    try {
      if (part === "word" && current.audioId) {
        const blob = await getMedia(current.audioId);
        if (blob) {
          await playBlob(blob);
          return;
        }
      }
      await speak(text);
    } catch {
      setNote(hu.cards.audioFail);
    }
  }

  async function rate(grade: Grade) {
    if (!card || lock.current) return;
    lock.current = true;
    const current = card;
    const upcomingIndex = index + 1;
    let nextQueue = queue;
    if (grade === 0) {
      nextQueue = [...queue];
      nextQueue.splice(Math.min(nextQueue.length, index + 3), 0, current);
      setQueue(nextQueue);
    }
    const upcoming = nextQueue[upcomingIndex];
    if (upcoming) {
      setIndex(upcomingIndex);
      setRevealed(false);
      if (profile.autoAudio) void play(upcoming, "word");
    } else {
      setDone(true);
      setFinished(true);
    }
    try {
      const before = profile.level;
      const nextProfile = await gradeCard(current.id, grade);
      setProfile(nextProfile);
      await refreshCounts(nextProfile.level);
      if (nextProfile.level !== before) setNote(hu.levelUp(nextProfile.level));
    } finally {
      lock.current = false;
    }
  }

  async function betterVoice() {
    const key = readKey();
    if (!card || !key || busy) return;
    setBusy(true);
    setNote(hu.gen.audio(1, 1));
    try {
      const blob = await synthesize(key, `${card.display}. ${card.sentence}`);
      await attachAudio(card.id, blob);
      setQueue((items) => items.map((item) => (item.id === card.id ? { ...item, audioId: `aud-${card.id}` } : item)));
      await playBlob(blob);
      setNote("");
    } catch (error) {
      setNote(explainFailure(error));
    } finally {
      setBusy(false);
    }
  }

  async function generate() {
    const key = readKey();
    if (!key || busy) return;
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    setBusy(true);
    setNote(hu.gen.words);
    try {
      const count = await createVocabulary({
        key,
        level: profile.level,
        signal: controller.signal,
        onProgress: setNote,
      });
      if (count) setNote(hu.gen.done(count));
      await load();
    } catch (error) {
      if (!controller.signal.aborted) setNote(explainFailure(error));
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <p className="boot-inline">{hu.boot}</p>;
  }

  if (!card || done) {
    return (
      <div className="stack loose">
        <h1>{hu.cards.title}</h1>
        <p className="lead">
          {finished ? hu.cards.done : counts.fresh > 0 && profile.newToday >= profile.quota ? hu.cards.emptyToday : hu.home.rest}
        </p>
        {note && (
          <p role="status" className="note">
            {note}
          </p>
        )}
        <button className="btn primary" type="button" onClick={() => void load()}>
          {hu.cards.another}
        </button>
        {profile.newToday >= profile.quota && (
          <button
            className="btn ghost"
            type="button"
            onClick={() => {
              void bumpQuota(5).then(async (next) => {
                setProfile(next);
                await load();
              });
            }}
          >
            {hu.home.moreDeck}
          </button>
        )}
        {hasKey && (
          <button className="btn ghost" type="button" disabled={busy} onClick={() => void generate()}>
            {hu.home.moreAi}
          </button>
        )}
        {busy && (
          <button className="btn tiny" type="button" onClick={() => abort.current?.abort()}>
            {hu.cards.cancel}
          </button>
        )}
        {!hasKey && (
          <button className="btn ghost" type="button" onClick={() => setScreen("settings")}>
            {hu.home.needKey}
          </button>
        )}
        <button className="btn tiny" type="button" onClick={() => setScreen("home")}>
          {hu.backHome}
        </button>
      </div>
    );
  }

  return (
    <div className="stack">
      <header className="top">
        <h1>{hu.cards.title}</h1>
        <span className="pill">{hu.placement.progress(index + 1, queue.length)}</span>
      </header>
      <Picture id={card.id} emoji={card.emoji} imageId={card.imageId} label={revealed ? card.display : hu.cards.what} />
      {revealed ? (
        <div className="stack">
          <p className="word">{card.display}</p>
          <p className="sentence">{card.sentence}</p>
          {card.hint && (
            <p className="hint">
              <span>{hu.cards.simpler}</span>
              {card.hint}
            </p>
          )}
          <div className="split">
            <button className="btn ghost" type="button" onClick={() => void play(card, "word")}>
              {hu.cards.word}
            </button>
            <button className="btn ghost" type="button" onClick={() => void play(card, "sentence")}>
              {hu.cards.sentence}
            </button>
          </div>
          {hasKey && !card.audioId && (
            <button className="btn tiny" type="button" disabled={busy} onClick={() => void betterVoice()}>
              {hu.cards.betterVoice}
            </button>
          )}
          <div className="ratings">
            {RATINGS.map((item) => (
              <button key={item.grade} type="button" className={item.tone} onClick={() => void rate(item.grade)}>
                {item.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="stack">
          <p className="lead">{hu.cards.what}</p>
          <button className="btn ghost" type="button" onClick={() => void play(card, "word")}>
            {hu.cards.listen}
          </button>
          <button className="btn primary" type="button" onClick={() => setRevealed(true)}>
            {hu.cards.show}
          </button>
        </div>
      )}
      {note && (
        <p role="status" className="note">
          {note}
        </p>
      )}
    </div>
  );
}

