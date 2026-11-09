# Magyar

A phone-friendly Hungarian immersion app. The learner never sees English in the interface: words, sentences, and the conversation partner stay in Hungarian, and meaning comes from pictures, context, and simpler Hungarian.

It is a static site. Nothing in this repository stores data or an API key. Progress, the key, generated pictures, and generated audio live in the browser (IndexedDB and localStorage). When a key is saved, the browser calls OpenAI directly.

Expected public URL, after GitHub Pages is enabled and `main` has been built by Actions:

**https://bzybandit-bot.github.io/magyar-app/**

## Enable GitHub Pages

The workflow [`.github/workflows/pages.yml`](.github/workflows/pages.yml) deploys on every push to `main`.

1. Open the repository on GitHub.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **GitHub Actions**.

The first deploy runs when this lands on `main`. Until Pages is switched to GitHub Actions, the workflow can succeed at building and still have nowhere to publish.

## Use the app

Open the site on a phone or computer. The first screen is a short picture placement (or “Teljesen kezdő vagyok”, which starts at A0). After that:

- **Kezdőlap** shows how many cards are due and the current level (A0–B2). The level moves up or down from later results.
- **Kártyák** is the picture deck. Look at the picture, optionally hear the word, reveal the Hungarian word with its article and an example sentence, then mark Újra / Nehéz / Jó / Könnyű. Scheduling is SM-2, so missed words come back sooner. About eight new starter words are introduced per day; **Kérek még a pakliból** raises that for today. The starter deck is bundled in the app, so this works with no key and no network.
- **Gyakorlás** has three modes and no translation: hear the word and pick the picture, see the picture and pick the Hungarian word, or see the picture and type the word. A missing accent is pointed out in Hungarian.
- **Beszéd** is a conversation with Lili. Pick a scene (kávézó, edzőterem, iskola, bolt, and others). She stays a little above the current level, recasts mistakes in Hungarian (“Úgy mondjuk: …”), and **Egyszerűbben** asks her to say the same thing with easier Hungarian. She is not given permission to use English.
- **Beállítások** is where the OpenAI key goes, along with level, voice, and reset.

Install it like a normal site: in the browser’s share menu, add it to the home screen. A starter icon is included, and a service worker caches the app shell so the starter deck still opens offline.

## Add an OpenAI key

1. Create an API key in your own OpenAI account.
2. In the app, open **Beállítások** (the gear).
3. Paste the key into **Kulcs** and press **Mentés**.

The key stays in this browser only. Card generation, speech, transcription, and the live call send it from the browser straight to `api.openai.com`. There is no backend here to hide it, which is acceptable for a personal app and a bad idea for a public multi-user one. Anyone who can open the browser profile can read the key. Clearing site data deletes it. **Kulcs törlése** removes it without deleting study progress.

Without a key, the starter deck, placement, practice, and spaced repetition still work. New illustrated words and Lili need the key.

**Kérek új szavakat** asks for three words just above the current level, then a picture and a spoken clip for each. Those are stored locally, so each generated card is paid for once. **Új szavak maguktól, ha elfogy a sor** (off by default) generates another batch when the due queue is empty. Turn it off if you want to choose when money is spent.

### Rough cost

Prices move. Check [OpenAI’s pricing](https://platform.openai.com/docs/pricing) before a long session. Figures below are approximate as of November 2026:

| Action | What it calls | Rough cost |
| --- | --- | --- |
| A chat reply or a new-word list | `gpt-4.1-mini`, then `gpt-4o-mini` if needed | Usually well under 1 cent |
| One new picture | `gpt-image-2.5-flare` at low 1024 quality, then `dall-e-3` if needed | About $0.006 |
| Three new words | text + 3 pictures + short speech | A few cents |
| Spoken card or Lili’s reply | `gpt-4o-mini-tts`, then `tts-1` | A fraction of a cent per short line |
| Live call (**Hívás**) | Realtime, trying `gpt-realtime-2.1-mini`, then `gpt-realtime-mini`, then `gpt-4o-mini-realtime-preview` | The expensive part: on the order of several cents per minute. Press **Befejezés** to stop. |

Starter cards use the device’s Hungarian voice (`speechSynthesis`, `hu-HU`) and do not call the API. **Jobb hang** on a card spends one speech request and caches it. If the live call cannot start (model access, browser, or network), **Mondom** still works: record a sentence, transcribe it, reply in text, and speak the answer.

## Local development

```bash
npm install
npm test
npm run dev
```

The dev server uses the same base path as GitHub Pages. Open `http://localhost:5173/magyar-app/`.

```bash
npm run build
npm run preview
```

The build is static files in `dist/`, including a copy of `index.html` at `404.html` so GitHub Pages can serve the app on refresh.

## Layout

- `src/data/deck.ts` — offline starter deck (original Hungarian sentences, emoji and one small drawing)
- `src/lib/srs.ts` — SM-2
- `src/lib/db.ts` — IndexedDB for cards, images, and audio
- `src/lib/openai.ts` — chat, images, speech, transcription, and the Realtime WebRTC call, all from the browser
- `src/screens` — placement, home, cards, practice, conversation, settings

Code comments and this README are in English. Learner-visible copy is Hungarian and lives in `src/hu.ts`.
