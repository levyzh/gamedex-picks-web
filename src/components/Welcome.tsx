import { useEffect, useState, type CSSProperties } from "react";
import { CoverWall } from "./CoverWall";
import { fetchStats } from "../api/picks";
import type { StatsResponse } from "../lib/types";
import { display, useT } from "../lib/theme";

// 893412 -> "893K+". exact counts drift daily, so the rounded figure reads more honestly.
function formatCount(n: number) {
  return n >= 1000 ? `${Math.floor(n / 1000).toLocaleString()}K+` : n.toLocaleString();
}

const STEPS = [
  {
    title: "Log in",
    text: "With a Gamedex account. Same email and password as the main site.",
  },
  {
    title: "Read the list",
    text: "Genres and tags from every game, weighted by score. Dropped games count against.",
  },
  {
    title: "Search RAWG",
    text: "Candidates that match the strongest genres and tags. Games already on the list are filtered out.",
  },
  {
    title: "Rank the picks",
    text: "The top 20, ordered by how closely each one matches the list.",
  },
];

export function Welcome({ onGetStarted }: { onGetStarted: () => void }) {
  const T = useT();
  const [stats, setStats] = useState<StatsResponse | null>(null);

  useEffect(() => {
    fetchStats().then(setStats);
  }, []);

  const statItems = stats
    ? [
        { value: formatCount(stats.games), label: "games" },
        { value: formatCount(stats.genres), label: "genres" },
        { value: formatCount(stats.tags), label: "tags" },
      ]
    : [];

  const sectionTitle: CSSProperties = {
    margin: 0, fontFamily: display, fontWeight: 700, fontSize: 28,
    letterSpacing: "-0.02em", color: T.text, textAlign: "center",
  };

  return (
    <>
      <CoverWall />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1040, margin: "0 auto" }}>
        {/* fills the first screen; stats and steps start below the fold. */}
        <section style={{
          minHeight: "100svh", padding: "48px 0",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          textAlign: "center",
        }}>
          <h1 style={{
            margin: "0 auto", maxWidth: 760, fontFamily: display, fontWeight: 700,
            fontSize: "clamp(34px, 6vw, 56px)", lineHeight: 1.05, letterSpacing: "-0.03em",
            color: T.text,
          }}>
            Game recommendations built from a Gamedex list.
          </h1>

          <h2 style={{ margin: "22px 0 0", fontFamily: display, fontWeight: 600, fontSize: 20, letterSpacing: "-0.01em", color: T.textBody }}>
            What to play next, decided by what's already been played.
          </h2>

          <p style={{ margin: "8px auto 0", maxWidth: 540, color: T.meta, fontSize: 15.5, lineHeight: 1.55 }}>
            Picks reads the games on a list, how they were scored and which were
            dropped, then ranks new games by how closely they match.
          </p>

          <button
            onClick={onGetStarted}
            style={{
              marginTop: 32, flexShrink: 0, height: 44, padding: "0 26px", borderRadius: 10,
              border: "none", background: T.accent, color: "#fff",
              fontSize: 15, fontWeight: 600, cursor: "pointer",
            }}
          >
            Get started
          </button>
        </section>

        {statItems.length > 0 && (
          <section style={{
            marginTop: 56,
            // 1px gaps over a border-coloured background draw the dividers, in rows or stacked.
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 1,
            background: T.border, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden",
          }}>
            {statItems.map((stat) => (
              <div key={stat.label} style={{ padding: "22px 20px", textAlign: "center", background: T.surface }}>
                <div style={{ fontFamily: display, fontWeight: 700, fontSize: 30, letterSpacing: "-0.02em", color: T.text }}>
                  {stat.value}
                </div>
                <div style={{ marginTop: 4, color: T.meta, fontSize: 13 }}>{stat.label}</div>
              </div>
            ))}
          </section>
        )}

        <section style={{ padding: "80px 0 20px" }}>
          <h2 style={sectionTitle}>How Picks works</h2>

          <ol style={{
            listStyle: "none", padding: 0, margin: "28px 0 0",
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16,
          }}>
            {STEPS.map((step, i) => (
              <li key={step.title} style={{
                background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12,
                padding: "20px 20px 22px",
              }}>
                <div style={{ fontFamily: display, fontWeight: 700, fontSize: 30, letterSpacing: "-0.02em", color: T.accent, lineHeight: 1 }}>
                  {i + 1}
                </div>
                <div style={{ marginTop: 14, color: T.text, fontSize: 15, fontWeight: 600 }}>{step.title}</div>
                <div style={{ marginTop: 6, color: T.meta, fontSize: 13, lineHeight: 1.55 }}>{step.text}</div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </>
  );
}