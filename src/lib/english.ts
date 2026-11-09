const LEAK =
  /\b(the|and|you|your|yours|what|where|when|why|how|please|hello|sorry|means|meaning|translation|english|because|should|would|could|this is|that is)\b/i;

export function hasEnglishLeak(text: string): boolean {
  return LEAK.test(text);
}

const UI_LEAK =
  /\b(the|and|you|your|please|welcome|settings|loading|error|listen|speak|start|next|back|home|cards?|level|save|delete|chat|voice|practice|conversation|correct|wrong|easy|hard|again|word|picture|click|submit|cancel|close|search|login|password|lesson|review|deck|openai|english|translation|retry|offline|install)\b/i;

export function hasUiEnglish(text: string): boolean {
  return UI_LEAK.test(text);
}
