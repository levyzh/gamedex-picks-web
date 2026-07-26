// PickCard.tsx — one recommendation.
//
// Deliberately NOT the main app's GameCard. That card answers "what is this
// game" (score, genre, year); this one answers "why am I being shown this",
// which is the match strength. Same proportions, hover lift and adult
// treatment so the two sites still feel related.

import { useState, type CSSProperties } from "react";
import { useT, clamp2, body } from "../lib/theme";
import type { Recommendation } from "../lib/types";

const GAMEDEX_WEB_URL = import.meta.env.VITE_GAMEDEX_WEB_URL;

// copied from rawg.ts in the main app — used when RAWG has no cover art.
const FALLBACK_COVER = "linear-gradient(135deg,#1f2433,#3a4358)";

export function PickCard({ game }: { game: Recommendation }) {
  const T = useT();
  const [hover, setHover] = useState(false);
  const [revealed, setRevealed] = useState(false);

  // Adult games start blurred. First click reveals, second opens. Same two
  // step as the main app — and it only ever fires when the recommender's
  // adult gate opened, so nobody sees these who didn't ask for them.
  const blurred = game.adult && !revealed;

  function handleClick() {
    if (blurred) {
      setRevealed(true);
      return;
    }
    // Picks has no detail page of its own. Send them to the main app, which
    // is where the "add to list" button lives — that's the point of showing
    // a recommendation at all. New tab so they don't lose their picks.
    window.open(`${GAMEDEX_WEB_URL}/game/${game.id}`, "_blank", "noopener");
  }

  // cosine 0..1 rendered as a percentage. NOT a probability and not a
  // guarantee — it's "how close to your taste vector", only meaningful
  // relative to the other numbers in this same list. the copy says "match"
  // rather than anything that implies a real statistic.
  const match = game.similarity === null ? null : Math.round(game.similarity * 100);

  const styles: Record<string, CSSProperties> = {
    card: {
      aspectRatio: "3/4",
      borderRadius: 10,
      background: T.cardH,
      border: `1px solid ${T.border}`,
      transform: hover ? "translateY(-3px)" : "none",
      boxShadow: hover ? T.shadowH : T.shadow,
      transition: "all 0.16s",
      position: "relative",
      overflow: "hidden",
    },
    cover: {
      position: "absolute",
      inset: 0,
      ...(game.cover
        ? { backgroundImage: `url(${game.cover})`, backgroundSize: "cover", backgroundPosition: "center" }
        : { background: FALLBACK_COVER }),
      filter: blurred ? "blur(18px)" : "none",
      transform: blurred ? "scale(1.15)" : "none", // hide blur bleed at the edges
      transition: "filter 0.2s, transform 0.2s",
    },
    // accent-coloured, unlike the main app's white score badge — at a glance
    // that's how you know you're looking at a pick and not a catalogue entry.
    matchBadge: {
      position: "absolute",
      top: 8,
      left: 8,
      background: T.accent,
      color: "#fff",
      fontSize: 11,
      fontWeight: 700,
      padding: "3px 8px",
      borderRadius: 999,
      letterSpacing: "-0.01em",
    },
    adultOverlay: {
      position: "absolute",
      inset: 0,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      textAlign: "center",
      padding: 12,
      background: "rgba(0,0,0,0.55)",
      color: "#fff",
    },
    title: {
      marginTop: 8,
      color: blurred ? T.metaDim : T.text,
      fontWeight: 500,
      fontSize: 13,
      lineHeight: 1.3,
      ...clamp2,
    },
    meta: {
      color: T.metaDim,
      fontSize: 11.5,
      marginTop: 2,
    },
  };

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ cursor: "pointer", fontFamily: body }}
    >
      <div style={styles.card}>
        <div style={styles.cover} />

        {/* no badge on the cold-start path — similarity is null there because
            nothing was ranked, and inventing a number would be a lie. */}
        {!blurred && match !== null && (
          <div style={styles.matchBadge}>{match}% match</div>
        )}

        {blurred && (
          <div style={styles.adultOverlay}>
            <div style={{ fontSize: 12, fontWeight: 600 }}>Adult content</div>
            <div style={{ fontSize: 11, opacity: 0.85 }}>Click to show</div>
          </div>
        )}
      </div>

      <div style={styles.title}>{game.title ?? "Untitled"}</div>
      <div style={styles.meta}>
        {game.genre[0] ?? "Unknown"} · {game.year ?? "—"}
      </div>
    </div>
  );
}
