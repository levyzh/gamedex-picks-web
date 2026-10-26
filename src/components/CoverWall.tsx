import { useEffect, useState } from "react";
import { fetchCovers } from "../api/picks";
import { useT } from "../lib/theme";

const SPEED_PX_PER_SEC = 3;
const ROW_SPEEDS = [1, 0.8, 1.15, 0.9, 1.25, 0.85];
const GAP = 6;

// RAWG's originals are often 1-2MB each. Re-decoding ~200 of them when the tab
// regains focus is what froze the page; RAWG's resize path serves ~30KB versions.
function small(url: string) {
  return url.replace("media.rawg.io/media/games/", "media.rawg.io/media/resize/420/-/games/")
    .replace("media.rawg.io/media/screenshots/", "media.rawg.io/media/resize/420/-/screenshots/");
}

function tileWidth() {
  return Math.min(150, window.innerWidth * 0.3);
}

function rowCount() {
  const rowHeight = (tileWidth() * 9) / 16 + GAP;
  return Math.ceil(window.innerHeight / rowHeight) + 1;
}

export function CoverWall() {
  const T = useT();
  const [covers, setCovers] = useState<string[]>([]);
  const [rows, setRows] = useState(rowCount);

  useEffect(() => {
    fetchCovers().then(setCovers);

    const onResize = () => setRows(rowCount());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const width = tileWidth();
  const perRow = Math.ceil(covers.length / rows);
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    // no positioned ancestor, so this spans the full page width, under the header too.
    <div aria-hidden style={{
      position: "absolute", top: 0, left: 0, width: "100%", height: "100svh",
      overflow: "hidden", zIndex: 0, pointerEvents: "none",
      opacity: covers.length ? 1 : 0, transition: "opacity 0.6s",
    }}>
      <div style={{ paddingTop: GAP }}>
        {Array.from({ length: rows }, (_, r) => {
          const slice = covers.slice(r * perRow, (r + 1) * perRow);
          if (slice.length === 0) return null;

          // the slice is drawn twice and the row slides by half its width, so the
          // second copy lands exactly where the first started and the loop is seamless.
          const trackWidth = slice.length * (width + GAP);
          const duration = trackWidth / (SPEED_PX_PER_SEC * ROW_SPEEDS[r % ROW_SPEEDS.length]);

          return (
            <div key={r} style={{
              display: "flex", gap: GAP, marginBottom: GAP, width: "max-content",
              willChange: "transform",
              animation: still ? "none" : `gdxp-slide ${duration}s linear infinite`,
              animationDirection: r % 2 ? "reverse" : "normal",
              // negative delay starts each row mid-loop instead of all lined up.
              animationDelay: `${-((r * 0.37) % 1) * duration}s`,
            }}>
              {[...slice, ...slice].map((cover, i) => (
                <img
                  key={i}
                  src={small(cover)}
                  alt=""
                  decoding="async"
                  // set on the element directly: a state update per tile would re-render all ~400.
                  onLoad={(e) => { e.currentTarget.style.opacity = "1"; }}
                  // if RAWG ever drops the resize path, fall back to the full image once.
                  onError={(e) => { if (e.currentTarget.src !== cover) e.currentTarget.src = cover; }}
                  style={{
                    width, aspectRatio: "16/9", flexShrink: 0, borderRadius: 6,
                    objectFit: "cover", display: "block",
                    opacity: 0, transition: still ? "none" : "opacity 0.6s ease",
                  }}
                />
              ))}
            </div>
          );
        })}
      </div>

      {/* T.bg is a 6-digit hex, so two more digits give it an alpha. */}
      <div style={{
        position: "absolute", inset: 0,
        background: [
          `radial-gradient(ellipse 50% 40% at 50% 50%, ${T.bg}80 0%, transparent 100%)`,
          `linear-gradient(to bottom, ${T.bg}99 0%, ${T.bg}b3 70%, ${T.bg} 100%)`,
        ].join(", "),
      }} />
    </div>
  );
}