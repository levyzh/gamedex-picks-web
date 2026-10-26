import { useState, useEffect } from "react";
import type { Session } from "@supabase/supabase-js";
import { Welcome } from "./components/Welcome";
import { AuthForm } from "./components/AuthForm";
import { PickCard } from "./components/PickCard";
import Icon from "./components/ui/Icon";
import { watchSession, signOut } from "./api/auth";
import { fetchRecommendations } from "./api/picks";
import type { PicksResponse } from "./lib/types";
import { THEMES, ThemeCtx, useT, body, display } from "./lib/theme";

// separate from the main app's "gdx-theme" so they won't clash on shared subdomains.
const THEME_KEY = "gdxp-theme";

function Picks() {
  const T = useT();

  const [data, setData] = useState<PicksResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // debug aid while recommender.py's weights are untuned. drop once they settle.
  const [showRaw, setShowRaw] = useState(false);

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

  // StrictMode fires this twice in dev only: two requests in the uvicorn log is expected.
  useEffect(() => { load(); }, []);

  const panel = {
    background: T.surface, border: `1px solid ${T.border}`,
    borderRadius: 14, padding: "22px 24px", boxShadow: T.shadow,
  };

  if (loading) {
    return (
      <div style={{ ...panel, maxWidth: 720 }}>
        <div style={{ color: T.text, fontSize: 14, fontWeight: 600 }}>Working out your picks…</div>
        <div style={{ color: T.meta, fontSize: 13, marginTop: 8, lineHeight: 1.6 }}>
          This one's genuinely slow — the server is pulling candidate games from
          RAWG before it can rank anything. Several seconds is normal.
        </div>
      </div>
    );
  }

  if (error) {
    // "Failed to fetch" = no usable response (service down or CORS). anything else
    // is a FastAPI `detail`, so the connection itself is fine.
    const isConnectionFailure = error.toLowerCase().includes("failed to fetch");

    return (
      <div style={{ ...panel, maxWidth: 720 }}>
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

  const isColdStart = data.basis === "popular";

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ ...panel, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ color: T.text, fontSize: 17, fontWeight: 700, fontFamily: display, letterSpacing: "-0.02em" }}>
              {isColdStart ? "Popular right now" : "Your picks"}
            </div>
            <div style={{ color: T.meta, fontSize: 13, marginTop: 5, lineHeight: 1.5 }}>
              {isColdStart
                ? "Not enough in your list yet to work out your taste — so here's what everyone's playing. Rate a few more games and this page changes."
                : `Ranked from ${data.from_entries} games on your list, out of ${data.candidates_considered} candidates.`}
            </div>
            {data.adult_included && !isColdStart && (
              <div style={{ color: T.metaDim, fontSize: 12.5, marginTop: 6 }}>
                Adult titles included, based on what's already on your list.
              </div>
            )}
            {data.note && (
              <div style={{ color: T.metaDim, fontSize: 12.5, marginTop: 6 }}>{data.note}</div>
            )}
          </div>
        </div>
      </div>

      {data.results.length === 0 ? (
        <div style={{ ...panel, textAlign: "center" }}>
          <div style={{ color: T.text, fontSize: 14, fontWeight: 600 }}>Nothing to show</div>
          <div style={{ color: T.meta, fontSize: 13, marginTop: 6, lineHeight: 1.6 }}>
            Every candidate was either already on your list or filtered out.
          </div>
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
          gap: 20,
        }}>
          {data.results.map((game) => <PickCard key={game.id} game={game} />)}
        </div>
      )}

      <div style={{ marginTop: 28, textAlign: "center" }}>
        <button
          onClick={() => setShowRaw(!showRaw)}
          style={{ background: "none", border: "none", color: T.metaDim, fontSize: 12, fontFamily: body, cursor: "pointer", padding: 0 }}
        >
          {showRaw ? "Hide raw response" : "Show raw response"}
        </button>
      </div>

      {showRaw && (
        <pre style={{
          margin: "12px 0 0", padding: "16px 18px", background: T.surface,
          border: `1px solid ${T.border}`, borderRadius: 14,
          fontSize: 11.5, lineHeight: 1.55, color: T.textBody,
          whiteSpace: "pre-wrap", wordBreak: "break-word",
          maxHeight: 420, overflow: "auto",
        }}>{JSON.stringify(data, null, 2)}</pre>
      )}
    </div>
  );
}

export default function App() {
  const [dark, setDark] = useState(() => localStorage.getItem(THEME_KEY) !== "light");
  const T = dark ? THEMES.dark : THEMES.light;

  useEffect(() => {
    localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    document.body.style.background = T.bg;
  }, [T.bg]);

  const [session, setSession] = useState<Session | null>(null);
  // avoids flashing the welcome page at someone who's already logged in.
  const [checkingSession, setCheckingSession] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  // bumping this remounts <Picks>, which re-runs the recommender.
  const [runId, setRunId] = useState(0);

  useEffect(() => {
    const stopWatching = watchSession((newSession) => {
      setSession(newSession);
      setCheckingSession(false);
      if (newSession) setShowLogin(false);
    });

    return stopWatching;
  }, []);

  return (
    <ThemeCtx.Provider value={T}>
      <div style={{
        minHeight: "100vh", background: T.bg, color: T.text,
        fontFamily: body, colorScheme: T.scheme,
        display: "flex", flexDirection: "column",
      }}>
        {session && (
        <header style={{ position: "sticky", top: 0, zIndex: 50, background: T.headerBg, backdropFilter: "blur(10px)", borderBottom: `1px solid ${T.border}` }}>
          <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px", height: 60, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontFamily: display, fontWeight: 700, fontSize: 17, letterSpacing: "-0.02em", color: T.text }}>
              Game<span style={{ color: T.accent }}>dex</span>
              <span style={{ color: T.meta, fontWeight: 600, marginLeft: 6 }}>Picks</span>
            </span>

            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
              <button
                onClick={() => setDark(!dark)}
                title={dark ? "Switch to light mode" : "Switch to dark mode"}
                aria-label="Toggle theme"
                style={{
                  width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                  border: `1px solid ${T.borderH}`, background: T.surface, color: T.text,
                  display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                }}
              >
                <Icon name={dark ? "sun" : "moon"} size={17} color={T.text} />
              </button>

              <button
                onClick={() => setRunId(runId + 1)}
                style={{
                  height: 36, padding: "0 14px", borderRadius: 9, flexShrink: 0,
                  border: `1px solid ${T.borderH}`, background: T.surface, color: T.text,
                  fontSize: 13, fontWeight: 500, fontFamily: body, cursor: "pointer",
                }}
              >
                Rerun
              </button>

              <button
                onClick={() => signOut()}
                style={{
                  height: 36, padding: "0 14px", borderRadius: 9, flexShrink: 0,
                  border: `1px solid ${T.borderH}`, background: T.surface, color: T.text,
                  fontSize: 13, fontWeight: 500, fontFamily: body, cursor: "pointer",
                }}
              >
                Log out
              </button>
            </div>
          </div>
        </header>
        )}

        <main style={{ flex: 1, width: "100%", maxWidth: 1280, margin: "0 auto", padding: "0 24px 60px" }}>
          {checkingSession
            ? null
            : session
              ? <div style={{ paddingTop: 22 }}><Picks key={runId} /></div>
              : <Welcome onGetStarted={() => setShowLogin(true)} />}
        </main>

        {/* required by RAWG's free terms, same as the main app. */}
        <footer style={{ borderTop: `1px solid ${T.border}`, padding: "20px 24px", textAlign: "center" }}>
          <span style={{ color: T.metaDim, fontSize: 12 }}>
            Game data by{" "}
            <a href="https://rawg.io" target="_blank" rel="noopener noreferrer" style={{ color: T.link, fontWeight: 500, textDecoration: "none" }}>RAWG</a>
          </span>
        </footer>

        {showLogin && !session && (
          <div
            // close only when the press itself starts on the backdrop, so a drag
            // out of an input doesn't dismiss the form. same as the main app.
            onPointerDown={(e) => { if (e.target === e.currentTarget) setShowLogin(false); }}
            style={{
              position: "fixed", inset: 0, zIndex: 100,
              background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
              display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
            }}
          >
            <AuthForm />
          </div>
        )}
      </div>
    </ThemeCtx.Provider>
  );
}