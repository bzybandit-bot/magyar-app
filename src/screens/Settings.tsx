import { useEffect, useState } from "react";
import { hu, levelName } from "../hu";
import { patchProfile, resetProgress } from "../lib/db";
import { keyLooksPlausible, readKey, writeKey } from "../lib/key";
import { LEVELS, type Level } from "../types";
import { useApp } from "../state";

type InstallPrompt = Event & { prompt: () => Promise<void> };

export function Settings() {
  const { profile, setProfile, refreshKey, setScreen } = useApp();
  const [draft, setDraft] = useState("");
  const [stored, setStored] = useState(() => Boolean(readKey()));
  const [replacing, setReplacing] = useState(() => !readKey());
  const [visible, setVisible] = useState(false);
  const [note, setNote] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);
  const [install, setInstall] = useState<InstallPrompt | null>(null);

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setInstall(event as InstallPrompt);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  async function saveKey() {
    if (!keyLooksPlausible(draft)) {
      setNote(hu.settings.keyShort);
      return;
    }
    writeKey(draft);
    setDraft("");
    setStored(true);
    setReplacing(false);
    setVisible(false);
    setNote("");
    refreshKey();
  }

  function clearKey() {
    writeKey("");
    setStored(false);
    setReplacing(true);
    setDraft("");
    setNote("");
    refreshKey();
  }

  async function toggle(partial: Partial<typeof profile>) {
    setProfile(await patchProfile(partial));
  }

  async function changeLevel(level: Level) {
    setProfile(await patchProfile({ level }));
  }

  return (
    <div className="stack loose">
      <h1>{hu.settings.title}</h1>
      <section className="panel stack">
        <h2>{hu.settings.keyTitle}</h2>
        <p>{hu.settings.keyHelp}</p>
        {stored && !replacing ? (
          <p className="note">{hu.settings.saved}</p>
        ) : (
          <>
            <input
              type={visible ? "text" : "password"}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={hu.settings.keyPlaceholder}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
            />
            <div className="split">
              <button className="btn ghost" type="button" onClick={() => setVisible((value) => !value)}>
                {visible ? hu.settings.hide : hu.settings.show}
              </button>
              <button className="btn primary" type="button" onClick={() => void saveKey()}>
                {hu.settings.save}
              </button>
            </div>
          </>
        )}
        {stored && !replacing && (
          <div className="split">
            <button className="btn ghost" type="button" onClick={() => setReplacing(true)}>
              {hu.settings.replace}
            </button>
            <button className="btn ghost" type="button" onClick={clearKey}>
              {hu.settings.clearKey}
            </button>
          </div>
        )}
        {note && <p role="status">{note}</p>}
      </section>
      <section className="panel stack">
        <h2>{hu.settings.voiceTitle}</h2>
        <button type="button" className={profile.autoAudio ? "toggle on" : "toggle"} aria-pressed={profile.autoAudio} onClick={() => void toggle({ autoAudio: !profile.autoAudio })}>
          {hu.settings.autoAudio}
        </button>
        <button type="button" className={profile.speakReplies ? "toggle on" : "toggle"} aria-pressed={profile.speakReplies} onClick={() => void toggle({ speakReplies: !profile.speakReplies })}>
          {hu.settings.speakReplies}
        </button>
        <button type="button" className={profile.autoGenerate ? "toggle on" : "toggle"} aria-pressed={profile.autoGenerate} onClick={() => void toggle({ autoGenerate: !profile.autoGenerate })}>
          {hu.settings.autoGen}
        </button>
      </section>
      <section className="panel stack">
        <h2>{hu.settings.levelTitle}</h2>
        <p>{hu.settings.levelHelp}</p>
        <div className="level-grid">
          {LEVELS.map((level) => (
            <button key={level} type="button" className={profile.level === level ? "pill on" : "pill"} onClick={() => void changeLevel(level)}>
              <strong>{level}</strong>
              <span>{levelName[level]}</span>
            </button>
          ))}
        </div>
      </section>
      <section className="panel stack">
        <h2>{hu.settings.progressTitle}</h2>
        <p>{hu.settings.resetHelp}</p>
        {confirmReset ? (
          <div className="split">
            <button
              className="btn danger"
              type="button"
              onClick={() => {
                void resetProgress().then((next) => {
                  setProfile(next);
                  setScreen("home");
                });
              }}
            >
              {hu.settings.resetYes}
            </button>
            <button className="btn ghost" type="button" onClick={() => setConfirmReset(false)}>
              {hu.settings.resetNo}
            </button>
          </div>
        ) : (
          <button className="btn ghost" type="button" onClick={() => setConfirmReset(true)}>
            {hu.settings.reset}
          </button>
        )}
      </section>
      <section className="panel stack">
        <h2>{hu.settings.phoneTitle}</h2>
        <p>{hu.settings.installHelp}</p>
        {install && (
          <button
            className="btn primary"
            type="button"
            onClick={() => {
              void install.prompt().then(() => {
                setInstall(null);
                setNote(hu.settings.installed);
              });
            }}
          >
            {hu.settings.install}
          </button>
        )}
      </section>
    </div>
  );
}
