import { useEffect, useRef, useState } from "react";
import { SCENARIOS, type Scenario } from "../data/scenarios";
import { ui } from "../hu";
import { explainFailure } from "../lib/fail";
import { readKey } from "../lib/key";
import { AiError, replyAsTutor, synthesize, transcribe } from "../lib/openai";
import { startRealtime, type CallActivity, type LiveCall } from "../lib/realtime";
import { openRecorder, playBlob, speak, stopAudio, type Recorder } from "../lib/speech";
import { tutorInstructions } from "../lib/tutor";
import { useApp } from "../state";
import type { ChatTurn } from "../types";

export function Talk() {
  const { profile, hasKey, setScreen } = useApp();
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [partial, setPartial] = useState("");
  const [text, setText] = useState("");
  const [thinking, setThinking] = useState(false);
  const [recording, setRecording] = useState(false);
  const [live, setLive] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [activity, setActivity] = useState<CallActivity>("idle");
  const [error, setError] = useState("");
  const call = useRef<LiveCall | null>(null);
  const recorder = useRef<Recorder | null>(null);
  const end = useRef<HTMLDivElement | null>(null);
  const turnsRef = useRef(turns);
  turnsRef.current = turns;

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [turns, partial, thinking]);

  useEffect(() => {
    return () => {
      call.current?.stop();
      recorder.current?.cancel();
      stopAudio();
    };
  }, []);

  async function ask(history: ChatTurn[], scene: Scenario, simplify: boolean) {
    const key = readKey();
    if (!key) return;
    setThinking(true);
    setError("");
    try {
      const reply = await replyAsTutor(
        key,
        profile.level,
        scene.scene,
        history.map((turn) => ({ role: turn.role === "user" ? "user" : "assistant", content: turn.text })),
        simplify,
      );
      setTurns((current) => [...current, { id: crypto.randomUUID(), role: "partner", text: reply }]);
      if (profile.speakReplies) {
        try {
          await playBlob(await synthesize(key, reply));
        } catch {
          try {
            await speak(reply);
          } catch {
            /* a szöveg akkor is megmarad */
          }
        }
      }
    } catch (reason) {
      setError(explainFailure(reason));
    } finally {
      setThinking(false);
    }
  }

  function choose(scene: Scenario) {
    call.current?.stop();
    call.current = null;
    setLive(false);
    stopAudio();
    setScenario(scene);
    setTurns([]);
    setPartial("");
    setError("");
    if (hasKey) void ask([], scene, false);
  }

  async function send(value: string) {
    const clean = value.trim();
    if (!clean || !scenario || thinking) return;
    const next = [...turnsRef.current, { id: crypto.randomUUID(), role: "user" as const, text: clean }];
    setTurns(next);
    setText("");
    if (call.current) {
      call.current.sendText(clean);
      return;
    }
    await ask(next, scenario, false);
  }

  async function toggleRecord() {
    if (!scenario) return;
    if (recorder.current) {
      setRecording(false);
      try {
        const blob = await recorder.current.stop();
        recorder.current = null;
        const heard = await transcribe(readKey(), blob);
        if (!heard) {
          setError(ui.talk.emptyHeard);
          return;
        }
        await send(heard);
      } catch (reason) {
        recorder.current = null;
        setError(reason instanceof DOMException ? ui.talk.mic : explainFailure(reason));
      }
      return;
    }
    try {
      recorder.current = await openRecorder();
      setRecording(true);
      setError("");
    } catch {
      setError(ui.talk.mic);
    }
  }

  async function toggleCall() {
    if (!scenario) return;
    if (call.current) {
      call.current.stop();
      call.current = null;
      setLive(false);
      setActivity("idle");
      return;
    }
    setConnecting(true);
    setError("");
    try {
      call.current = await startRealtime({
        apiKey: readKey(),
        instructions: tutorInstructions(profile.level, scenario.scene),
        onUser: (heard) => {
          setTurns((current) => [...current, { id: crypto.randomUUID(), role: "user", text: heard }]);
        },
        onPartner: (heard, final) => {
          if (!final) {
            setPartial(heard);
            return;
          }
          setPartial("");
          if (heard) setTurns((current) => [...current, { id: crypto.randomUUID(), role: "partner", text: heard }]);
        },
        onActivity: setActivity,
      });
      setLive(true);
    } catch (reason) {
      call.current = null;
      if (reason instanceof DOMException) setError(ui.talk.mic);
      else if (reason instanceof AiError) setError(explainFailure(reason));
      else setError(ui.talk.callFail);
    } finally {
      setConnecting(false);
    }
  }

  if (!hasKey) {
    return (
      <div className="stack loose">
        <h1>{ui.talk.title}</h1>
        <p>{ui.talk.needKey}</p>
        <button className="btn primary" type="button" onClick={() => setScreen("settings")}>
          {ui.talk.toKey}
        </button>
      </div>
    );
  }

  const status = connecting ? ui.talk.connecting : activity === "user" ? ui.talk.listening : activity === "partner" ? ui.talk.speaking : live ? ui.talk.live : "";

  return (
    <div className="talk">
      <header className="top">
        <h1>{ui.talk.title}</h1>
      </header>
      <p className="muted">{scenario ? scenario.label : ui.talk.pick}</p>
      <div className="scenes">
        {SCENARIOS.map((scene) => (
          <button key={scene.id} type="button" className={scenario?.id === scene.id ? "pill on" : "pill"} onClick={() => choose(scene)}>
            {scene.label}
          </button>
        ))}
      </div>
      <div className="transcript">
        {!scenario && <p>{ui.talk.intro}</p>}
        {turns.map((turn) => (
          <div key={turn.id} className={turn.role === "user" ? "bubble mine" : "bubble"}>
            <span>{turn.role === "user" ? ui.talk.you : ui.talk.partner}</span>
            <p lang="hu">{turn.text}</p>
          </div>
        ))}
        {partial && (
          <div className="bubble">
            <span>{ui.talk.partner}</span>
            <p lang="hu">{partial}</p>
          </div>
        )}
        {thinking && <p className="muted">{ui.talk.thinking}</p>}
        {error && (
          <p role="status" className="note">
            {error}
          </p>
        )}
        <div ref={end} />
      </div>
      {scenario && (
        <form
          className="composer"
          onSubmit={(event) => {
            event.preventDefault();
            void send(text);
          }}
        >
          {status && <p className="muted">{status}</p>}
          <div className="split">
            <button className="btn ghost" type="button" onClick={() => void toggleCall()} disabled={connecting || recording}>
              {live ? ui.talk.hangup : ui.talk.call}
            </button>
            <button className="btn ghost" type="button" onClick={() => void toggleRecord()} disabled={live || connecting}>
              {recording ? ui.talk.recordStop : ui.talk.record}
            </button>
            <button className="btn tiny" type="button" disabled={thinking || live} onClick={() => void ask(turnsRef.current, scenario, true)}>
              {ui.talk.simpler}
            </button>
          </div>
          <div className="composer-row">
            <input
              lang="hu"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder={ui.talk.placeholder}
              autoCapitalize="sentences"
              spellCheck={false}
            />
            <button className="btn primary" type="submit" disabled={thinking || !text.trim()}>
              {ui.talk.send}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
