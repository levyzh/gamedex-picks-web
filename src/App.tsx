// App.tsx — the whole app for now. Logged out shows the form, logged in
// shows proof that auth works. Step 3 replaces that proof with the actual
// recommendations call; nothing else on this screen should need to move.

import { useState, useEffect } from "react";
import type { Session } from "@supabase/supabase-js";
import { AuthForm } from "./components/AuthForm";
import { watchSession, signOut } from "./api/auth";
import { THEMES, ThemeCtx, useT, body, display } from "./lib/theme";

// separate storage key from the main app's "gdx-theme". localStorage is
// per-origin so they wouldn't collide today anyway, but they will the day
// both live on gamedex.com subdomains.
const THEME_KEY = "gdxp-theme";

function SignedIn({ session }: { session: Session }) {
  const T = useT();
  const [copied, setCopied] = useState(false);

  // the token is the thing worth having on screen right now — it's what
  // /docs wants pasted into the Authorize box, and it's the proof that this
  // app and the python service agree about who I am.
  const token = session.access_token;

  async function copyToken() {
    await navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const labelStyle = { color: T.metaDim, fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" as const };

  return (
    <div style={{ width: "100%", maxWidth: 620 }}>
      <div style={{
        background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14,
        padding: "24px 26px", boxShadow: T.shadow,
      }}>
        <h2 style={{ margin: 0, fontFamily: display, fontWeight: 700, fontSize: 18, letterSpacing: "-0.02em", color: T.text }}>
          Logged in
        </h2>
        <p style={{ margin: "6px 0 20px", color: T.meta, fontSize: 13, lineHeight: 1.5 }}>
          Auth works end to end. Recommendations land here next.
        </p>

        <div style={{ marginBottom: 14 }}>
          <div style={labelStyle}>Email</div>
          <div style={{ color: T.textBody, fontSize: 13.5, marginTop: 3 }}>{session.user.email}</div>
        </div>

        <div style={{ marginBottom: 14 }}>
          {/* this is `sub` in the JWT — the same value auth.py pulls out and
              gamedex_client.py puts in the /api/users/{id}/list URL. */}
          <div style={labelStyle}>User ID</div>
          <div style={{ color: T.textBody, fontSize: 13, marginTop: 3, fontFamily: "monospace" }}>{session.user.id}</div>
        </div>

        <div style={labelStyle}>Access token</div>
        <pre style={{
          margin: "5px 0 0", padding: "10px 12px", background: T.bg,
          border: `1px solid ${T.border}`, borderRadius: 9,
          fontSize: 11, lineHeight: 1.5, color: T.meta,
          whiteSpace: "pre-wrap", wordBreak: "break-all", maxHeight: 110, overflow: "auto",
        }}>{token}</pre>

        <button
          onClick={copyToken}
          style={{
            marginTop: 10, padding: "7px 14px", borderRadius: 8,
            border: `1px solid ${T.borderH}`, background: T.btn,
            color: T.text, fontSize: 12.5, fontWeight: 600,
            fontFamily: body, cursor: "pointer",
          }}
        >
          {copied ? "Copied" : "Copy token"}
        </button>
      </div>
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
          flex: 1, width: "100%", padding: "40px 24px 60px",
          display: "flex", justifyContent: "center", alignItems: "flex-start",
        }}>
          {checkingSession
            ? <div style={{ color: T.meta, fontSize: 13.5 }}>Checking your session…</div>
            : session
              ? <SignedIn session={session} />
              : <AuthForm />}
        </main>
      </div>
    </ThemeCtx.Provider>
  );
}
