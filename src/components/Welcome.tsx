import { useEffect, useState } from "react";
import { CoverWall } from "./CoverWall";
import { AuthForm } from "./AuthForm";
import { HowItWorks } from "./HowItWorks";
import { fetchCovers, fetchStats } from "../api/picks";
import type { StatsResponse } from "../lib/types";
import { display, useT } from "../lib/theme";

// the stats band's 56px top margin + 40px of it showing at the bottom edge.
const PEEK_SCROLL = 96;

export function Welcome() {
  const T = useT();
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [covers, setCovers] = useState<string[]>([]);

  useEffect(() => {
    fetchStats().then(setStats);
    fetchCovers().then(setCovers);
  }, []);

  // opens slightly scrolled so the stats peek out as a scroll hint; scrolling up
  // gives the full-screen hero. manual restoration stops a reload from undoing it.
  useEffect(() => {
    history.scrollRestoration = "manual";
    window.scrollTo({ top: PEEK_SCROLL, behavior: "instant" });
  }, []);

  const statItems = stats
    ? [
        { value: stats.games.toLocaleString(), label: "games" },
        { value: stats.genres.toLocaleString(), label: "genres" },
        { value: stats.tags.toLocaleString(), label: "tags" },
      ]
    : [];

  return (
    <>
      <CoverWall covers={covers} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1040, margin: "0 auto" }}>
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
            Gamedex Picks
          </h1>

          <h2 style={{ margin: "22px 0 0", fontFamily: display, fontWeight: 600, fontSize: 20, letterSpacing: "-0.01em", color: T.textBody }}>
            Game recommendations built from a Gamedex list.
          </h2>

          <AuthForm />
        </section>

        {statItems.length > 0 && (
          <section style={{
            marginTop: 56,
            display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16,
          }}>
            {statItems.map((stat) => (
              <div key={stat.label} style={{ padding: "22px 0", textAlign: "center" }}>
                <div style={{ fontFamily: display, fontWeight: 700, fontSize: 30, letterSpacing: "-0.02em", color: T.text }}>
                  {stat.value}
                </div>
                <div style={{ marginTop: 4, color: T.meta, fontSize: 13 }}>{stat.label}</div>
              </div>
            ))}
          </section>
        )}

        <HowItWorks covers={covers} />
      </div>
    </>
  );
}