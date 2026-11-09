import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { deckCounts } from "./lib/db";
import { readKey } from "./lib/key";
import type { DeckCounts, Level, Profile, Screen } from "./types";

type AppContext = {
  profile: Profile;
  setProfile: (profile: Profile) => void;
  screen: Screen;
  setScreen: (screen: Screen) => void;
  hasKey: boolean;
  refreshKey: () => void;
  counts: DeckCounts;
  refreshCounts: (level?: Level) => Promise<void>;
  online: boolean;
};

const Ctx = createContext<AppContext | null>(null);

function storedScreen(): Screen {
  const value = sessionStorage.getItem("magyar.screen");
  if (value === "home" || value === "cards" || value === "practice" || value === "talk" || value === "settings") return value;
  return "home";
}

export function AppState({
  profile,
  setProfile,
  children,
}: {
  profile: Profile;
  setProfile: (profile: Profile) => void;
  children: ReactNode;
}) {
  const [screen, setScreenState] = useState<Screen>(storedScreen);
  const [hasKey, setHasKey] = useState(() => Boolean(readKey()));
  const [counts, setCounts] = useState<DeckCounts>({ due: 0, fresh: 0, learned: 0, nextDue: null });
  const [online, setOnline] = useState(() => navigator.onLine);

  const refreshCounts = useCallback(
    async (level?: Level) => {
      setCounts(await deckCounts(level ?? profile.level));
    },
    [profile.level],
  );

  useEffect(() => {
    void refreshCounts();
  }, [refreshCounts]);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  const value = useMemo<AppContext>(
    () => ({
      profile,
      setProfile,
      screen,
      setScreen: (next) => {
        setScreenState(next);
        sessionStorage.setItem("magyar.screen", next);
      },
      hasKey,
      refreshKey: () => setHasKey(Boolean(readKey())),
      counts,
      refreshCounts,
      online,
    }),
    [profile, setProfile, screen, hasKey, counts, refreshCounts, online],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppContext {
  const value = useContext(Ctx);
  if (!value) throw new Error("app");
  return value;
}
