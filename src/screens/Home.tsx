import { useState } from "react";
import { hu, levelName } from "../hu";
import { bumpQuota, patchProfile } from "../lib/db";
import { explainFailure } from "../lib/fail";
import { createVocabulary } from "../lib/generate";
import { duePhrase, greeting } from "../lib/language";
import { readKey } from "../lib/key";
import { useApp } from "../state";
import { Wordmark } from "../ui/Icons";

export function Home() {
  const { profile, setProfile, counts, refreshCounts, setScreen, hasKey } = useApp();
  const ready = counts.due + Math.max(0, Math.min(counts.fresh, profile.quota - profile.newToday));
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function moreFromDeck() {
    const next = await bumpQuota(5);
    setProfile(next);
    await refreshCounts(next.level);
    setScreen("cards");
  }

  async function moreFromKey() {
    const key = readKey();
    if (!key || busy) return;
    setBusy(true);
    setNote(hu.gen.words);
    try {
      const count = await createVocabulary({
        key,
        level: profile.level,
        onProgress: setNote,
      });
      setNote(hu.gen.done(count));
      await refreshCounts(profile.level);
      setScreen("cards");
    } catch (error) {
      setNote(explainFailure(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack loose">
      <header className="top">
        <Wordmark />
        <span className="pill">
          {profile.level} · {levelName[profile.level]}
        </span>
      </header>
      {!profile.tipSeen && (
        <aside className="tip">
          <p>{hu.home.tip}</p>
          <button
            type="button"
            className="btn tiny"
            onClick={() => {
              void patchProfile({ tipSeen: true }).then(setProfile);
            }}
          >
            {hu.home.tipOk}
          </button>
        </aside>
      )}
      <section className="hero">
        <p className="eyebrow">{greeting()}</p>
        <p className="big-count">{ready}</p>
        <h1>{hu.home.dueLine(ready)}</h1>
        <button className="btn primary" type="button" onClick={() => setScreen("cards")}>
          {hu.home.study}
        </button>
        <div className="split">
          <button className="btn ghost" type="button" onClick={() => setScreen("practice")}>
            {hu.home.practice}
          </button>
          <button className="btn ghost" type="button" onClick={() => setScreen("talk")}>
            {hu.home.talk}
          </button>
        </div>
      </section>
      <section className="panel stack">
        <h2>{hu.home.today}</h2>
        <p>{hu.home.newLine(profile.newToday, profile.quota)}</p>
        <p>{hu.home.learnedLine(counts.learned)}</p>
        <p>{hu.home.freshLine(counts.fresh)}</p>
        {ready === 0 && counts.nextDue && <p>{duePhrase(counts.nextDue)}</p>}
        {counts.fresh > 0 && profile.newToday >= profile.quota && (
          <button className="btn ghost" type="button" onClick={() => void moreFromDeck()}>
            {hu.home.moreDeck}
          </button>
        )}
        {hasKey ? (
          <button className="btn primary" type="button" disabled={busy} onClick={() => void moreFromKey()}>
            {busy ? note || hu.gen.words : hu.home.moreAi}
          </button>
        ) : (
          <button className="btn ghost" type="button" onClick={() => setScreen("settings")}>
            {hu.home.needKey}
          </button>
        )}
        {note && !busy && (
          <p role="status" className="note">
            {note}
          </p>
        )}
      </section>
    </div>
  );
}
