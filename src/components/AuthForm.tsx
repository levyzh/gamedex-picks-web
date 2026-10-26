import { useState, type CSSProperties, type FocusEvent, type FormEvent } from "react";
import { signIn } from "../api/auth";
import { useT, body } from "../lib/theme";

const GAMEDEX_WEB_URL = import.meta.env.VITE_GAMEDEX_WEB_URL;

const STILL = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const EASE = "cubic-bezier(0.2, 0.8, 0.2, 1)";

// Sign-in only: an account made here would start with an empty list.
// No success callback needed — watchSession in App.tsx swaps the screen.
export function AuthForm() {
  const T = useT();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  // stays open while typing or once anything is filled in, not just on hover,
  // so moving the mouse away mid-password doesn't hide the field.
  const open = hovered || focused || email !== "" || password !== "";

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

  function handleBlur(e: FocusEvent<HTMLFormElement>) {
    // blur fires when focus moves between the two fields too; only close if it left the form.
    if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false);
  }

  const transition = (props: string) =>
    STILL ? "none" : props.split(",").map((p) => `${p.trim()} 320ms ${EASE}`).join(", ");

  const inputStyle: CSSProperties = {
    width: "100%", boxSizing: "border-box", height: 48, padding: "0 16px",
    border: "none", background: "transparent", outline: "none",
    fontSize: 15, color: T.text, colorScheme: T.scheme, fontFamily: body,
  };

  return (
    // minHeight = the fully open height, so opening grows into reserved space
    // instead of nudging the vertically centred hero text above it.
    <div style={{ marginTop: 32, width: "100%", maxWidth: 380, minHeight: 177, fontFamily: body }}>
      <form
        onSubmit={handleSubmit}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setFocused(true)}
        onBlur={handleBlur}
        style={{
          background: T.surface, borderRadius: 14, overflow: "hidden", textAlign: "left",
          border: `1px solid ${open ? T.accent : T.borderH}`,
          boxShadow: open ? T.shadowH : T.shadow,
          transition: transition("border-color, box-shadow"),
        }}
      >
        <input
          type="email"
          placeholder="Enter email"
          aria-label="Email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />

        {/* 0fr -> 1fr animates to the content's real height, which max-height can't do exactly. */}
        <div style={{
          display: "grid", gridTemplateRows: open ? "1fr" : "0fr",
          transition: transition("grid-template-rows"),
        }}>
          <div style={{
            overflow: "hidden", minHeight: 0,
            opacity: open ? 1 : 0, transform: open ? "none" : "translateY(-6px)",
            transition: transition("opacity, transform"),
          }}>
            <div style={{ height: 1, background: T.border, margin: "0 16px" }} />

            <input
              type="password"
              placeholder="Enter password"
              aria-label="Password"
              autoComplete="current-password"
              tabIndex={open ? 0 : -1}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
            />

            <div style={{ padding: "0 8px 8px" }}>
              <button
                type="submit"
                disabled={busy}
                tabIndex={open ? 0 : -1}
                style={{
                  width: "100%", height: 40, borderRadius: 9, border: "none",
                  background: T.accent, color: "#fff", fontWeight: 600, fontSize: 14,
                  fontFamily: body, cursor: busy ? "default" : "pointer",
                  opacity: busy ? 0.6 : 1,
                }}
              >
                {busy ? "Logging in…" : "Log in"}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* theme has no danger token; this red reads on both surfaces. */}
      {errorMessage && (
        <p style={{ margin: "12px 0 0", color: "#EF4444", fontSize: 13, lineHeight: 1.5 }}>
          {errorMessage}
        </p>
      )}

      <p style={{ margin: "14px 0 0", color: T.meta, fontSize: 13 }}>
        Same login as Gamedex.{" "}
        <a href={GAMEDEX_WEB_URL} style={{ color: T.link, fontWeight: 500, textDecoration: "none" }}>
          No account? Sign up
        </a>
      </p>
    </div>
  );
}