import { useState, type CSSProperties, type FormEvent } from "react";
import { signIn } from "../api/auth";
import { useT, display, body } from "../lib/theme";

const GAMEDEX_WEB_URL = import.meta.env.VITE_GAMEDEX_WEB_URL;

// Sign-in only: an account made here would start with an empty list.
// No success callback needed — watchSession in App.tsx swaps the screen.
export function AuthForm() {
  const T = useT();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
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

  // T.bg, not T.surface, so the fields read as sunken inside the card.
  const inputStyle: CSSProperties = {
    width: "100%", boxSizing: "border-box", padding: "9px 12px",
    borderRadius: 9, border: `1px solid ${T.borderH}`, background: T.bg,
    fontSize: 13, color: T.text, outline: "none",
    colorScheme: T.scheme, fontFamily: body,
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        width: "100%", maxWidth: 360, background: T.surface,
        border: `1px solid ${T.border}`, borderRadius: 14,
        padding: "28px 26px", boxShadow: T.shadow, fontFamily: body,
      }}
    >
      <h2 style={{ margin: 0, fontFamily: display, fontWeight: 700, fontSize: 20, letterSpacing: "-0.02em", color: T.text }}>
        Log in
      </h2>
      <p style={{ margin: "6px 0 20px", color: T.meta, fontSize: 13, lineHeight: 1.5 }}>
        Same email and password as Gamedex.
      </p>

      <input
        type="email"
        placeholder="Email"
        autoComplete="email"
        autoFocus
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ ...inputStyle, marginBottom: 10 }}
      />

      <input
        type="password"
        placeholder="Password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ ...inputStyle, marginBottom: 16 }}
      />

      <button
        type="submit"
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

      {/* theme has no danger token; this red reads on both surfaces. */}
      {errorMessage && (
        <p style={{ margin: "12px 0 0", color: "#EF4444", fontSize: 12.5, lineHeight: 1.5 }}>
          {errorMessage}
        </p>
      )}

      <div style={{ textAlign: "center", marginTop: 18 }}>
        <a href={GAMEDEX_WEB_URL} style={{ color: T.link, fontSize: 13, fontWeight: 500, textDecoration: "none" }}>
          No account? Sign up on Gamedex
        </a>
      </div>
    </form>
  );
}
