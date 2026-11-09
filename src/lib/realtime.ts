import { hasEnglishLeak } from "./english";
import { AiError, REALTIME_MODELS, postRealtimeCall } from "./openai";

export type CallActivity = "user" | "partner" | "idle";

export type LiveCall = {
  stop: () => void;
  sendText: (text: string) => void;
};

function waitForIce(connection: RTCPeerConnection): Promise<void> {
  if (connection.iceGatheringState === "complete") return Promise.resolve();
  return new Promise((resolve) => {
    const timer = window.setTimeout(resolve, 2500);
    connection.addEventListener("icegatheringstatechange", () => {
      if (connection.iceGatheringState === "complete") {
        window.clearTimeout(timer);
        resolve();
      }
    });
  });
}

export async function startRealtime(options: {
  apiKey: string;
  instructions: string;
  onUser: (text: string) => void;
  onPartner: (text: string, final: boolean) => void;
  onActivity: (activity: CallActivity) => void;
}): Promise<LiveCall> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const connection = new RTCPeerConnection();
  const playback = new Audio();
  playback.autoplay = true;
  connection.ontrack = (event) => {
    playback.srcObject = event.streams[0];
    void playback.play().catch(() => undefined);
  };
  stream.getTracks().forEach((track) => connection.addTrack(track, stream));
  const channel = connection.createDataChannel("oai-events");
  const offer = await connection.createOffer();
  await connection.setLocalDescription(offer);
  await waitForIce(connection);
  const sdp = connection.localDescription?.sdp ?? "";
  let answer = "";
  let last = new AiError("other");
  for (const model of REALTIME_MODELS) {
    try {
      answer = await postRealtimeCall(options.apiKey, sdp, model, options.instructions);
      break;
    } catch (error) {
      last = error instanceof AiError ? error : new AiError("other");
      if (last.failure === "auth" || last.failure === "quota") break;
    }
  }
  if (!answer) {
    stream.getTracks().forEach((track) => track.stop());
    connection.close();
    throw last;
  }
  await connection.setRemoteDescription({ type: "answer", sdp: answer });

  let partner = "";
  let closed = false;
  const stop = () => {
    if (closed) return;
    closed = true;
    channel.close();
    stream.getTracks().forEach((track) => track.stop());
    connection.close();
    playback.pause();
    options.onActivity("idle");
  };

  channel.addEventListener("open", () => {
    channel.send(
      JSON.stringify({
        type: "response.create",
        response: {
          instructions: "Kezdd a jelenetet egy rövid, természetes magyar mondattal. Semmi más nyelv.",
        },
      }),
    );
  });
  channel.addEventListener("message", (event) => {
    let payload: { type?: string; delta?: string; transcript?: string };
    try {
      payload = JSON.parse(String(event.data)) as { type?: string; delta?: string; transcript?: string };
    } catch {
      return;
    }
    const type = payload.type ?? "";
    if (type === "input_audio_buffer.speech_started") options.onActivity("user");
    if (type === "input_audio_buffer.speech_stopped") options.onActivity("idle");
    if (type === "response.created" || type === "response.output_audio.delta" || type === "response.audio.delta") {
      options.onActivity("partner");
    }
    if (type === "response.output_audio_transcript.delta" || type === "response.audio_transcript.delta") {
      partner += payload.delta ?? "";
      if (!hasEnglishLeak(partner)) options.onPartner(partner, false);
    }
    if (type === "response.output_audio_transcript.done" || type === "response.audio_transcript.done") {
      const text = (payload.transcript || partner).trim();
      partner = "";
      if (!text || hasEnglishLeak(text)) {
        options.onPartner("", false);
        if (channel.readyState === "open") {
          channel.send(
            JSON.stringify({
              type: "response.create",
              response: {
                instructions: "Az előző válaszod nem csak magyar volt. Mondd el újra, kizárólag egyszerű magyar mondatokkal.",
              },
            }),
          );
        }
        return;
      }
      options.onPartner(text, true);
    }
    if (type === "conversation.item.input_audio_transcription.completed" && payload.transcript?.trim()) {
      options.onUser(payload.transcript.trim());
    }
    if (type === "response.done") options.onActivity("idle");
  });

  return {
    stop,
    sendText(text: string) {
      if (channel.readyState !== "open") return;
      channel.send(
        JSON.stringify({
          type: "conversation.item.create",
          item: {
            type: "message",
            role: "user",
            content: [{ type: "input_text", text }],
          },
        }),
      );
      channel.send(JSON.stringify({ type: "response.create" }));
    },
  };
}
