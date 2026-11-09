import type { Level } from "./types";

export const levelName: Record<Level, string> = {
  A0: "first steps",
  A1: "beginner",
  A2: "elementary",
  B1: "intermediate",
  B2: "advanced",
};

/** Hungarian level names for Lili's prompt only. Never shown as an English gloss. */
export const levelNameHu: Record<Level, string> = {
  A0: "első lépés",
  A1: "kezdő",
  A2: "alapfok",
  B1: "középfok",
  B2: "haladó",
};

export const levelBlurb: Record<Level, string> = {
  A0: "We start with the most useful words.",
  A1: "The basics are in place. Short sentences come next.",
  A2: "You already recognize a lot. Everyday situations come next.",
  B1: "Your ear can handle more layered situations.",
  B2: "Finer meanings and longer speech come next.",
};

export const ui = {
  appName: "Magyar",
  boot: "Loading…",
  skip: "Skip to content",
  navLabel: "Main menu",
  close: "Close",
  retry: "Try again",
  backHome: "Back to home",
  offline: "No network. Saved cards still work.",
  levelUp: (level: string) => `New level: ${level}`,
  nav: {
    home: "Home",
    cards: "Cards",
    practice: "Practice",
    talk: "Talk",
    settings: "Settings",
  },
  placement: {
    tagline: "Pictures. Sentences. Conversation.",
    intro: "Let's see where you are. You see a picture or hear a word, and you answer in Hungarian.",
    start: "Start",
    beginner: "I'm a complete beginner",
    result: "Your level",
    go: "Continue",
    progress: (n: number, total: number) => `${n} / ${total}`,
    replay: "Listen again",
  },
  home: {
    study: "Study",
    practice: "Practice",
    talk: "Talk",
    tip: "The picture carries the meaning. The word is Hungarian. There is no translation.",
    tipOk: "Got it",
    moreDeck: "More from the deck",
    moreAi: "New words",
    needKey: "Add a key for new pictures",
    rest: "The deck is resting.",
    today: "Today",
    dueLine: (n: number) =>
      n === 0 ? "No cards are due right now." : n === 1 ? "One card is waiting." : `${n} cards are waiting.`,
    learnedLine: (n: number) => `Words you know: ${n}.`,
    newLine: (used: number, quota: number) => `New words today: ${used} / ${quota}.`,
    freshLine: (n: number) =>
      n === 0 ? "No more new words in the deck at this level." : `${n} new words are still in the deck.`,
  },
  cards: {
    title: "Cards",
    show: "Show the word",
    listen: "Listen",
    word: "Word",
    sentence: "Sentence",
    simpler: "Simpler",
    again: "Again",
    hard: "Hard",
    good: "Good",
    easy: "Easy",
    done: "Round complete.",
    another: "Another round",
    emptyToday: "Today's new words are used up.",
    queue: (n: number) => (n === 1 ? "One card is in the queue." : `${n} cards are in the queue.`),
    cancel: "Cancel",
    betterVoice: "Better voice",
    audioFail: "The sound did not start.",
  },
  practice: {
    title: "Practice",
    hear: "Listen",
    see: "Picture",
    write: "Type",
    check: "Check",
    score: (n: number) => `Correct this round: ${n}.`,
    empty: "Not enough words for this practice yet.",
    choice: (n: number) => `Picture ${n}`,
    next: "Next",
  },
  talk: {
    title: "Talk",
    intro: "Lili speaks only Hungarian. She stays a little above your level, and says the same thing more simply if you get stuck.",
    pick: "Choose a scene.",
    placeholder: "Write in Hungarian…",
    send: "Send",
    simpler: "Simpler",
    call: "Call",
    hangup: "End call",
    record: "Speak",
    recordStop: "Done",
    connecting: "Connecting…",
    listening: "Listening",
    speaking: "Lili is speaking",
    live: "Call is live",
    needKey: "Conversation needs a key on this device.",
    toKey: "Open key setup",
    emptyHeard: "Nothing was heard. Try again.",
    mic: "Microphone permission is needed.",
    callFail: "The voice call did not start. You can still send a sentence.",
    partner: "Lili",
    you: "You",
    thinking: "Lili is thinking…",
    scene: "Scene",
  },
  settings: {
    title: "Settings",
    keyTitle: "Key",
    keyHelp:
      "Paste your own key. It stays on this device only. New pictures and conversation go straight from the browser to the provider.",
    keyPlaceholder: "paste it here",
    save: "Save",
    saved: "The key is saved on this device.",
    replace: "Replace",
    clearKey: "Delete key",
    keyShort: "That looks too short.",
    show: "Show",
    hide: "Hide",
    voiceTitle: "Voice",
    autoAudio: "Say the word when a card appears",
    speakReplies: "Lili answers out loud",
    autoGen: "Make new words automatically when the queue runs out",
    levelTitle: "Level",
    levelHelp: "If you set this by hand, the next round follows it.",
    progressTitle: "Progress",
    reset: "Delete all progress",
    resetHelp: "Words and the level are deleted. The key stays.",
    resetYes: "Yes, delete",
    resetNo: "Cancel",
    phoneTitle: "Phone",
    install: "Install on this phone",
    installHelp:
      "You can add this app to the home screen from the browser share menu. The starter deck works with no internet.",
    installed: "Installed on this device.",
  },
  errors: {
    service: "That did not work. Check the key and the network, then try again.",
    auth: "The service rejected the key.",
    quota: "The quota for this key is used up.",
    storage: "Saved progress could not be opened.",
    image: "The picture was not created. The word was kept.",
    emptyGen: "No new word came back. Try again.",
  },
  gen: {
    words: "Making new words…",
    image: (n: number, total: number) => `Making picture ${n} of ${total}.`,
    audio: (n: number, total: number) => `Making audio ${n} of ${total}.`,
    done: (n: number) => (n === 1 ? "One new word is ready." : `${n} new words are ready.`),
  },
};

/** Task content. Hungarian only: prompts, answers, and the line Lili falls back to. */
export const learn = {
  placement: {
    picture: "Melyik szó illik a képhez?",
    audio: "Hallgasd meg, és válaszd ki a képet.",
  },
  cards: {
    what: "Mi ez?",
  },
  practice: {
    placeholder: "Írd a magyar szót",
    accentNote: "Az ékezet számít.",
    correct: "Így van.",
    accent: (display: string) => `Majdnem. Az ékezet más: ${display}.`,
    wrong: (display: string) => `Nem ez volt. A szó: ${display}.`,
    picture: "Melyik szó illik a képhez?",
    audio: "Melyik kép illik a hanghoz?",
    type: "Mi van a képen? Írd magyarul.",
  },
  talk: {
    safeFallback: "Nem mondom el más nyelven. Mondd röviden, magyarul.",
  },
};

function walk(value: unknown, out: string[]): void {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) value.forEach((item) => walk(item, out));
  else if (value && typeof value === "object") Object.values(value as object).forEach((item) => walk(item, out));
}

export function chromeCopy(): string[] {
  const out: string[] = [];
  walk(ui, out);
  walk(levelName, out);
  walk(levelBlurb, out);
  out.push(
    ui.levelUp("A2"),
    ui.placement.progress(3, 10),
    ui.home.dueLine(0),
    ui.home.dueLine(1),
    ui.home.dueLine(12),
    ui.home.learnedLine(0),
    ui.home.learnedLine(8),
    ui.home.newLine(1, 8),
    ui.home.freshLine(0),
    ui.home.freshLine(4),
    ui.cards.queue(1),
    ui.cards.queue(6),
    ui.practice.score(3),
    ui.practice.choice(2),
    ui.gen.image(1, 3),
    ui.gen.audio(2, 3),
    ui.gen.done(1),
    ui.gen.done(3),
  );
  return out;
}

export function learningCopy(): string[] {
  const out: string[] = [];
  walk(learn, out);
  walk(levelNameHu, out);
  out.push(learn.practice.accent("az alma"), learn.practice.wrong("a kutya"));
  return out;
}
