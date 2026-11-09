const STORAGE_KEY = "magyar.kulcs";

export function readKey(): string {
  try {
    return localStorage.getItem(STORAGE_KEY)?.trim() ?? "";
  } catch {
    return "";
  }
}

export function writeKey(value: string): void {
  const trimmed = value.trim();
  if (!trimmed) localStorage.removeItem(STORAGE_KEY);
  else localStorage.setItem(STORAGE_KEY, trimmed);
}

export function keyLooksPlausible(value: string): boolean {
  return value.trim().length >= 20;
}
