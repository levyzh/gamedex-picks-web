// AuthForm.tsx — the screen you see when you're logged out.
//
// Adapted from the main app's AuthForm. Two deliberate differences:
//   1. Sign-in only. Signing up HERE would create a Gamedex account whose
//      list is empty, so the first thing the new user sees is the cold-start
//      fallback. Account creation belongs on the main site, where there's
//      something to do next.
//   2. The copy says "Gamedex account" out loud. This is a different domain
//      asking for Gamedex credentials — if it doesn't explain itself it reads
//      like phishing, which is the whole reason this is a sub-brand.
//
// Still no onLoginSuccess callback, same as the original: when signIn
// succeeds Supabase fires the auth change event, watchSession in App.tsx
// hears it, App re-renders, and this form disappears on its own.

import { useState, type CSSProperties } from "react";
import { signIn } from "../api/auth";
import { useT, display, body } from "../lib/theme";

const GAMEDEX_WEB_URL = import.meta.env.VITE_GAMEDEX_WEB_URL;

export function AuthForm() {
  const T = useT();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // For telling the human what went wrong ("Invalid login credentials"),
  // and for disabling the button while we wait on the network.
  const [errorMessage, setErrorMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit() {
    setErrorMessage("");
    setBusy(true);

    try {
      await signIn(email, password);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  // Background is T.bg (the page color) so the fields read as "sunken"
  // against the raised T.surface card.
  const inputStyle: CSSProperties = {
    width: "100%", boxSizing: "border-box", padding: "9px 12px",
    borderRadius: 9, border: `1px solid ${T.borderH}`, background: T.bg,
    fontSize: 13, color: T.text, outline: "none",
    colorScheme: T.scheme, fontFamily: body,
  };

  return (
    <div style={{
      width: "100%", maxWidth: 360, background: T.surface,
      border: `1px solid ${T.border}`, borderRadius: 14,
      padding: "28px 26px", boxShadow: T.shadow, fontFamily: body,
    }}>
      {/* Same logo mark as the main app, different wordmark. The shared mark
          is doing real work here — it's the visual half of "yes, this really
          is us" that the copy below states in words. */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: T.accent, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: display, fontWeight: 700, fontSize: 13 }}>gdx</div>
        <span style={{ fontFamily: display, fontWeight: 700, fontSize: 17, letterSpacing: "-0.02em", color: T.text }}>
          Gamedex <span style={{ color: T.accent }}>Picks</span>
        </span>
      </div>

      <h2 style={{ margin: 0, fontFamily: display, fontWeight: 700, fontSize: 20, letterSpacing: "-0.02em", color: T.text }}>
        Log in for your picks
      </h2>
      <p style={{ margin: "6px 0 20px", color: T.meta, fontSize: 13, lineHeight: 1.5 }}>
        Use your <strong style={{ color: T.textBody, fontWeight: 600 }}>Gamedex account</strong> —
        same email and password as the main site. Picks reads your list to work
        out what to recommend.
      </p>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
        style={{ ...inputStyle, marginBottom: 10 }}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
        style={{ ...inputStyle, marginBottom: 16 }}
      />

      <button
        onClick={handleSubmit}
        disabled={busy}
        style={{
          width: "100%", padding: "10px 0", borderRadius: 9, border: "none",
          background: T.accent, color: "#fff", fontWeight: 600, fontSize: 13.5,
          fontFamily: body, cursor: busy ? "default" : "pointer",
          opacity: busy ? 0.6 : 1,
        }}
      >
        {busy ? "Working..." : "Log in"}
      </button>

      {/* Red is hardcoded because the theme has no "danger" token — one shade
          that stays readable on both surfaces. Same as the main app. */}
      {errorMessage && (
        <p style={{ margin: "12px 0 0", color: "#EF4444", fontSize: 12.5, lineHeight: 1.5 }}>
          {errorMessage}
        </p>
      )}

      <div style={{ textAlign: "center", marginTop: 18 }}>
        <a
          href={GAMEDEX_WEB_URL}
          style={{ color: T.link, fontSize: 13, fontWeight: 500, fontFamily: body, textDecoration: "none" }}
        >
          No account? Sign up on Gamedex
        </a>
      </div>
    </div>
  );
}
