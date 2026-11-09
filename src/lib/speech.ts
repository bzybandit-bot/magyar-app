let active: HTMLAudioElement | null = null;

export function stopAudio(): void {
  window.speechSynthesis?.cancel();
  if (active) {
    active.pause();
    active.src = "";
    active = null;
  }
}

export function playBlob(blob: Blob): Promise<void> {
  stopAudio();
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  active = audio;
  return new Promise((resolve, reject) => {
    const finish = () => {
      URL.revokeObjectURL(url);
      if (active === audio) active = null;
    };
    audio.onended = () => {
      finish();
      resolve();
    };
    audio.onerror = () => {
      finish();
      reject(new Error("audio"));
    };
    void audio.play().catch((error: unknown) => {
      finish();
      reject(error instanceof Error ? error : new Error("audio"));
    });
  });
}

export function speak(text: string): Promise<void> {
  const synth = window.speechSynthesis;
  if (!synth) return Promise.reject(new Error("no-tts"));
  synth.cancel();
  if (active) {
    active.pause();
    active = null;
  }
  return new Promise((resolve, reject) => {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "hu-HU";
    utter.rate = 0.92;
    const voice = synth.getVoices().find((item) => item.lang.toLowerCase().startsWith("hu"));
    if (voice) utter.voice = voice;
    utter.onend = () => resolve();
    utter.onerror = () => reject(new Error("tts"));
    synth.resume();
    synth.speak(utter);
  });
}

export function primeVoices(): void {
  const synth = window.speechSynthesis;
  if (!synth) return;
  synth.getVoices();
  synth.addEventListener("voiceschanged", () => {
    synth.getVoices();
  });
}

export type Recorder = {
  stop: () => Promise<Blob>;
  cancel: () => void;
};

export async function openRecorder(): Promise<Recorder> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const preferred = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
  const mime = preferred.find((item) => MediaRecorder.isTypeSupported(item)) ?? "";
  const recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
  const chunks: Blob[] = [];
  recorder.addEventListener("dataavailable", (event) => {
    if (event.data.size) chunks.push(event.data);
  });
  recorder.start();
  const release = () => {
    stream.getTracks().forEach((track) => track.stop());
  };
  return {
    cancel() {
      if (recorder.state !== "inactive") recorder.stop();
      release();
    },
    stop() {
      return new Promise((resolve, reject) => {
        recorder.addEventListener(
          "stop",
          () => {
            release();
            resolve(new Blob(chunks, { type: recorder.mimeType || mime || "audio/webm" }));
          },
          { once: true },
        );
        recorder.addEventListener("error", () => reject(new Error("rec")), { once: true });
        if (recorder.state !== "inactive") recorder.stop();
        else release();
      });
    },
  };
}
