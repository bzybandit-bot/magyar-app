import type { ReactNode } from "react";
import { ui } from "../hu";
import { useApp } from "../state";
import { IconCards, IconHome, IconPractice, IconSettings, IconTalk } from "./Icons";
import type { Screen } from "../types";

const ITEMS: { id: Screen; label: string; icon: ReactNode }[] = [
  { id: "home", label: ui.nav.home, icon: <IconHome /> },
  { id: "cards", label: ui.nav.cards, icon: <IconCards /> },
  { id: "practice", label: ui.nav.practice, icon: <IconPractice /> },
  { id: "talk", label: ui.nav.talk, icon: <IconTalk /> },
  { id: "settings", label: ui.nav.settings, icon: <IconSettings /> },
];

export function Shell({ children }: { children: ReactNode }) {
  const { screen, setScreen, online } = useApp();
  return (
    <div className="app">
      <a className="skip" href="#content">
        {ui.skip}
      </a>
      {!online && <p className="banner">{ui.offline}</p>}
      <main id="content" className={screen === "talk" ? "main talk-main" : "main"}>
        {children}
      </main>
      <nav className="nav" aria-label={ui.navLabel}>
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
