import { useEffect, useState } from "react";
import { fetchCovers } from "../api/picks";
import { useT } from "../lib/theme";

// enough small tiles to fill even a 1440p screen; the list repeats if it runs short.
const TILES = 160;

export function CoverWall() {
  const T = useT();
  const [covers, setCovers] = useState<string[]>([]);

  useEffect(() => {
    fetchCovers().then(setCovers);
  }, []);

  // repeat the list so a short response still fills the wall.
  const tiles: string[] = [];
  while (covers.length > 0 && tiles.length < TILES) tiles.push(...covers);

  return (
    // no positioned ancestor, so this spans the full page width, under the header too.
    <div aria-hidden style={{
      position: "absolute", top: 0, left: 0, width: "100%", height: "100svh",
      overflow: "hidden", zIndex: 0, pointerEvents: "none",
      opacity: tiles.length ? 1 : 0, transition: "opacity 0.6s",
    }}>
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(150px, 30vw), 1fr))",
        gap: 6, padding: 6,
      }}>
        {tiles.slice(0, TILES).map((cover, i) => (
          <div key={i} style={{
            aspectRatio: "16/9", borderRadius: 6,
            backgroundImage: `url(${cover})`, backgroundSize: "cover", backgroundPosition: "center",
          }} />
        ))}
      </div>

      {/* T.bg is a 6-digit hex, so two more digits give it an alpha. */}
      <div style={{
        position: "absolute", inset: 0,
        background: [
          `radial-gradient(ellipse 50% 40% at 50% 50%, ${T.bg}99 0%, transparent 100%)`,
          `linear-gradient(to bottom, ${T.bg}b3 0%, ${T.bg}c7 70%, ${T.bg} 100%)`,
        ].join(", "),
      }} />
    </div>
  );
}
