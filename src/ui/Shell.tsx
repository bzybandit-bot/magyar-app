import type { ReactNode } from "react";
import { hu } from "../hu";
import { useApp } from "../state";
import { IconCards, IconHome, IconPractice, IconSettings, IconTalk } from "./Icons";
import type { Screen } from "../types";

const ITEMS: { id: Screen; label: string; icon: ReactNode }[] = [
  { id: "home", label: hu.nav.home, icon: <IconHome /> },
  { id: "cards", label: hu.nav.cards, icon: <IconCards /> },
  { id: "practice", label: hu.nav.practice, icon: <IconPractice /> },
  { id: "talk", label: hu.nav.talk, icon: <IconTalk /> },
  { id: "settings", label: hu.nav.settings, icon: <IconSettings /> },
];

export function Shell({ children }: { children: ReactNode }) {
  const { screen, setScreen, online } = useApp();
  return (
    <div className="app">
      <a className="skip" href="#tartalom">
        {hu.skip}
      </a>
      {!online && <p className="banner">{hu.offline}</p>}
      <main id="tartalom" className={screen === "talk" ? "main talk-main" : "main"}>
        {children}
      </main>
      <nav className="nav" aria-label={hu.navLabel}>
        {ITEMS.map((item) => (
          <button key={item.id} type="button" aria-current={screen === item.id ? "page" : undefined} onClick={() => setScreen(item.id)}>
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
