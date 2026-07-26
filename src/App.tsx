// App.tsx — the whole app for now. Logged out shows the form, logged in
// fetches recommendations and dumps them raw. Step 4 turns that dump into
// actual cards; the fetching and error handling below shouldn't need to move.

import { useState, useEffect } from "react";
import type { Session } from "@supabase/supabase-js";
import { AuthForm } from "./components/AuthForm";
import { watchSession, signOut } from "./api/auth";
import { fetchRecommendations } from "./api/picks";
import type { PicksResponse } from "./lib/types";
import { THEMES, ThemeCtx, useT, body, display } from "./lib/theme";

// separate storage key from the main app's "gdx-theme". localStorage is
// per-origin so they wouldn't collide today anyway, but they will the day
// both live on gamedex.com subdomains.
const THEME_KEY = "gdxp-theme";

function Picks() {
  const T = useT();

  const [data, setData] = useState<PicksResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError(null);

    try {
      setData(await fetchRecommendations());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  // NOTE: StrictMode runs this twice in dev, so I'll see two requests in the
  // uvicorn log and two rounds of RAWG calls. That's dev-only and expected —
  // it does NOT happen in a build. Worth remembering before I go hunting for
  // a double-fetch bug that isn't there.
  useEffect(() => { load(); }, []);

  const panel = {
    background: T.surface, border: `1px solid ${T.border}`,
    borderRadius: 14, padding: "22px 24px", boxShadow: T.shadow,
  };

  if (loading) {
    return (
      <div style={{ ...panel, width: "100%", maxWidth: 720 }}>
        <div style={{ color: T.text, fontSize: 14, fontWeight: 600 }}>Working out your picks…</div>
        <div style={{ color: T.meta, fontSize: 13, marginTop: 8, lineHeight: 1.6 }}>
          This one's genuinely slow — the server is pulling candidate games from
          RAWG before it can rank anything. Several seconds is normal.
        </div>
      </div>
    );
  }

  if (error) {
    // "Failed to fetch" is the browser's way of saying the request never got
    // a usable response at all — service down, or blocked by cors. anything
    // else came back THROUGH the service as a fastapi `detail`, which means
    // the connection is fine and the problem is further upstream. showing the
    // cors hint on a rawg outage just sends me hunting in the wrong place.
    const isConnectionFailure = error.toLowerCase().includes("failed to fetch");

    return (
      <div style={{ ...panel, width: "100%", maxWidth: 720 }}>
        <div style={{ color: T.text, fontSize: 15, fontWeight: 600 }}>Couldn't load your picks</div>
        <div style={{ color: "#EF4444", fontSize: 13, marginTop: 8, lineHeight: 1.6 }}>{error}</div>
        <div style={{ color: T.metaDim, fontSize: 12.5, marginTop: 10, lineHeight: 1.6 }}>
          {isConnectionFailure
            ? "The Python service probably isn't running, or this origin isn't in its CORS_ORIGINS."
            : "This came back from the service itself, so the connection is fine. If it mentions RAWG, that's an upstream outage — try again in a minute."}
        </div>
        <button
          onClick={load}
          style={{ marginTop: 16, padding: "9px 18px", borderRadius: 8, border: "none", background: T.accent, color: "#fff", fontWeight: 600, fontSize: 13, fontFamily: body, cursor: "pointer" }}
        >
          Try again
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div style={{ width: "100%", maxWidth: 720 }}>
      <div style={{ ...panel, marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ color: T.text, fontSize: 15, fontWeight: 600, fontFamily: display }}>
              {data.results.length} picks
            </div>
            <div style={{ color: T.meta, fontSize: 13, marginTop: 4, lineHeight: 1.5 }}>
              {data.basis === "content"
                ? `Based on ${data.from_entries} games from your list, out of ${data.candidates_considered} candidates.`
                : "Popular right now — not enough in your list to go on yet."}
              {data.adult_included && " Adult titles included."}
            </div>
            {data.note && (
              <div style={{ color: T.metaDim, fontSize: 12.5, marginTop: 6 }}>{data.note}</div>
            )}
          </div>

          <button
            onClick={load}
            style={{ padding: "7px 14px", borderRadius: 8, border: `1px solid ${T.borderH}`, background: T.btn, color: T.text, fontSize: 12.5, fontWeight: 600, fontFamily: body, cursor: "pointer", whiteSpace: "nowrap" }}
          >
            Reload
          </button>
        </div>
      </div>

      {/* raw on purpose. step 4 replaces this with cards — until then I want
          to see exactly what the api sent, not my own rendering of it. */}
      <pre style={{
        margin: 0, padding: "16px 18px", background: T.surface,
        border: `1px solid ${T.border}`, borderRadius: 14,
        fontSize: 11.5, lineHeight: 1.55, color: T.textBody,
        whiteSpace: "pre-wrap", wordBreak: "break-word",
        maxHeight: 520, overflow: "auto",
      }}>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}

export default function App() {
  const [dark, setDark] = useState(() => localStorage.getItem(THEME_KEY) !== "light");
  const T = dark ? THEMES.dark : THEMES.light;

  useEffect(() => {
    localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
  }, [dark]);

  const [session, setSession] = useState<Session | null>(null);
  // brief moment on load before supabase answers. showing nothing beats
  // flashing the login form at someone who's already logged in.
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const stopWatching = watchSession((newSession) => {
      setSession(newSession);
      setCheckingSession(false);
    });

    return stopWatching;
  }, []);

  return (
    <ThemeCtx.Provider value={T}>
      <div style={{
        minHeight: "100vh", background: T.bg, color: T.text,
        fontFamily: body, colorScheme: T.scheme,
        display: "flex", flexDirection: "column", alignItems: "center",
      }}>
        <header style={{
          width: "100%", maxWidth: 900, padding: "18px 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: T.accent, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: display, fontWeight: 700, fontSize: 13 }}>gdx</div>
            <span style={{ fontFamily: display, fontWeight: 700, fontSize: 17, letterSpacing: "-0.02em", color: T.text }}>
              Gamedex <span style={{ color: T.accent }}>Picks</span>
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={() => setDark(!dark)}
              style={{ padding: "7px 12px", borderRadius: 8, border: `1px solid ${T.borderH}`, background: T.btn, color: T.text, fontSize: 12.5, fontWeight: 500, fontFamily: body, cursor: "pointer" }}
            >
              {dark ? "Light" : "Dark"}
            </button>

            {/* hidden while checking, so a logged-in user never sees this
                flash on and off during page load. */}
            {!checkingSession && session && (
              <button
                onClick={() => signOut()}
                style={{ padding: "7px 12px", borderRadius: 8, border: `1px solid ${T.borderH}`, background: T.btn, color: T.text, fontSize: 12.5, fontWeight: 500, fontFamily: body, cursor: "pointer" }}
              >
                Log out
              </button>
            )}
          </div>
        </header>

        <main style={{
          flex: 1, width: "100%", padding: "24px 24px 60px",
          display: "flex", justifyContent: "center", alignItems: "flex-start",
        }}>
          {checkingSession
            ? <div style={{ color: T.meta, fontSize: 13.5 }}>Checking your session…</div>
            : session
              ? <Picks />
              : <AuthForm />}
        </main>
      </div>
    </ThemeCtx.Provider>
  );
}