import { useEffect, useState } from "react";
import { completePlacement, bootstrap } from "./lib/db";
import { ui } from "./hu";
import { Cards } from "./screens/Cards";
import { Home } from "./screens/Home";
import { Placement } from "./screens/Placement";
import { Practice } from "./screens/Practice";
import { Settings } from "./screens/Settings";
import { Talk } from "./screens/Talk";
import { AppState, useApp } from "./state";
import type { Profile } from "./types";
import { Shell } from "./ui/Shell";

function Root() {
  const { profile, setProfile, screen } = useApp();
  if (!profile.placementDone) {
    return (
      <Placement
        onDone={async (level) => {
          setProfile(await completePlacement(level));
        }}
      />
    );
  }
  return (
    <Shell>
      {screen === "home" && <Home />}
      {screen === "cards" && <Cards />}
      {screen === "practice" && <Practice />}
      {screen === "talk" && <Talk />}
      {screen === "settings" && <Settings />}
    </Shell>
  );
}

export function App() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    void bootstrap()
      .then(setProfile)
      .catch(() => setFailed(true));
  }, []);

  if (failed) {
    return (
      <main className="gate">
        <p>{ui.errors.storage}</p>
        <button className="btn primary" type="button" onClick={() => window.location.reload()}>
          {ui.retry}
        </button>
      </main>
    );
  }
  if (!profile) {
    return (
      <main className="gate">
        <p>{ui.boot}</p>
      </main>
    );
  }
  return (
    <AppState profile={profile} setProfile={setProfile}>
      <Root />
    </AppState>
  );
}
