import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type TouchEvent } from "react";
import Icon from "./ui/Icon";
import { fetchExamples } from "../api/picks";
import { smallCover } from "../lib/covers";
import { body, display, useT } from "../lib/theme";

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

// slugs must match EXAMPLE_SLUGS in gamedex-picks' examples.py.
const EXAMPLE_LIST = [
  { slug: "elden-ring", name: "Elden Ring", status: "Completed · 9", weight: 1 },
  { slug: "hollow-knight", name: "Hollow Knight", status: "Completed · 8", weight: 0.9 },
  { slug: "dark-souls-iii", name: "Dark Souls III", status: "Playing · 8", weight: 0.7 },
  { slug: "destiny-2", name: "Destiny 2", status: "Dropped · 3", weight: -0.8 },
];

const EXAMPLE_PICKS = [
  { slug: "lies-of-p", name: "Lies of P", match: 94 },
  { slug: "blasphemous", name: "Blasphemous", match: 91 },
  { slug: "nioh-2", name: "Nioh 2", match: 88 },
  { slug: "salt-and-sanctuary", name: "Salt and Sanctuary", match: 85 },
];

const TASTE = [
  { tag: "Souls-like", size: 17 },
  { tag: "Action RPG", size: 15 },
  { tag: "Difficult", size: 14 },
  { tag: "Dark fantasy", size: 13 },
  { tag: "Metroidvania", size: 13 },
];

const NARROW_PX = 760;
// a trackpad keeps firing wheel events for ~1s after a flick; a gap this long means a new gesture.
const GESTURE_GAP_MS = 200;
const SWIPE_PX = 40;
const STILL = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const EASE = "cubic-bezier(0.2, 0.8, 0.2, 1)";
const RED = "#EF4444";

function fade(active: boolean, delayMs = 0): CSSProperties {
  return {
    opacity: active ? 1 : 0,
    transform: active ? "none" : "translateY(12px)",
    transition: STILL ? "none" : `opacity 450ms ${EASE} ${delayMs}ms, transform 450ms ${EASE} ${delayMs}ms`,
  };
}

export function HowItWorks({ covers }: { covers: string[] }) {
  const T = useT();
  const [active, setActive] = useState(0);
  const [narrow, setNarrow] = useState(() => window.innerWidth < NARROW_PX);
  const [examples, setExamples] = useState<Record<string, string>>({});

  const widgetRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(0);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  function go(step: number) {
    const next = Math.max(0, Math.min(STEPS.length - 1, step));
    activeRef.current = next;
    setActive(next);
  }

  useEffect(() => {
    fetchExamples().then(setExamples);

    const onResize = () => setNarrow(window.innerWidth < NARROW_PX);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // one step per wheel gesture while over the widget. past the first or last step
  // the wheel is left alone, so the page scrolls on as normal.
  useEffect(() => {
    const widget = widgetRef.current;
    if (!widget) return;

    let lastWheel = 0;
    let steppedThisGesture = false;

    function onWheel(e: WheelEvent) {
      const now = Date.now();
      if (now - lastWheel > GESTURE_GAP_MS) steppedThisGesture = false;
      lastWheel = now;

      // swallow the rest of a gesture that already moved a step, so leftover momentum doesn't scroll the page.
      if (steppedThisGesture) {
        e.preventDefault();
        return;
      }
      if (Math.abs(e.deltaY) < 4) return;

      const next = activeRef.current + Math.sign(e.deltaY);
      if (next < 0 || next >= STEPS.length) return;

      e.preventDefault();
      steppedThisGesture = true;
      activeRef.current = next;
      setActive(next);
    }

    // passive: false, or preventDefault is ignored and the page scrolls anyway.
    widget.addEventListener("wheel", onWheel, { passive: false });
    return () => widget.removeEventListener("wheel", onWheel);
  }, []);

  // horizontal swipes only, so a vertical swipe still scrolls the page.
  function onTouchStart(e: TouchEvent) {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }

  function onTouchEnd(e: TouchEvent) {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const dx = e.changedTouches[0].clientX - start.x;
    const dy = e.changedTouches[0].clientY - start.y;
    if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(dy)) go(active + (dx < 0 ? 1 : -1));
  }

  const visuals = [
    <LoginVisual key="login" active={active === 0} />,
    <ListVisual key="list" active={active === 1} examples={examples} />,
    <SearchVisual key="search" active={active === 2} covers={covers} />,
    <RankVisual key="rank" active={active === 3} examples={examples} />,
  ];

  const rail = (
    <div style={{ display: "flex", flexDirection: narrow ? "row" : "column", gap: 2 }}>
      {STEPS.map((step, i) => (
        <button
          key={step.title}
          onClick={() => go(i)}
          aria-label={`Step ${i + 1}: ${step.title}`}
          aria-current={i === active ? "step" : undefined}
          style={{ padding: 6, border: "none", background: "none", cursor: "pointer" }}
        >
          <div style={{
            width: narrow ? 28 : 3, height: narrow ? 3 : 28, borderRadius: 2,
            background: i === active ? T.accent : T.borderH,
            transition: STILL ? "none" : "background 300ms",
          }} />
        </button>
      ))}
    </div>
  );

  const arrowButton = (dir: -1 | 1) => {
    const disabled = dir < 0 ? active === 0 : active === STEPS.length - 1;
    return (
      <button
        onClick={() => go(active + dir)}
        disabled={disabled}
        aria-label={dir < 0 ? "Previous step" : "Next step"}
        style={{
          width: 36, height: 36, borderRadius: 9, border: `1px solid ${T.borderH}`, background: T.surface,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.35 : 1,
        }}
      >
        <Icon name={dir < 0 ? "back" : "next"} size={16} color={T.text} />
      </button>
    );
  };

  const arrows = (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      {arrowButton(-1)}
      {arrowButton(1)}
      <span style={{ color: T.metaDim, fontSize: 13, marginLeft: 4 }}>{active + 1} / {STEPS.length}</span>
    </div>
  );

  const text = (
    <div style={{ position: "relative", height: narrow ? 150 : 180 }}>
      {STEPS.map((step, i) => (
        <div key={step.title} aria-hidden={i !== active} style={{ position: "absolute", inset: 0, ...fade(i === active) }}>
          <div style={{ fontFamily: display, fontWeight: 700, fontSize: narrow ? 40 : 56, letterSpacing: "-0.03em", color: T.accent, lineHeight: 1 }}>
            {i + 1}
          </div>
          <div style={{ marginTop: 14, fontFamily: display, fontWeight: 700, fontSize: narrow ? 20 : 24, letterSpacing: "-0.02em", color: T.text }}>
            {step.title}
          </div>
          <div style={{ marginTop: 8, color: T.meta, fontSize: 15, lineHeight: 1.55, maxWidth: 380 }}>{step.text}</div>
        </div>
      ))}
    </div>
  );

  const stage = (
    <div style={{
      position: "relative", height: narrow ? 300 : 330, borderRadius: 14,
      background: T.surface, border: `1px solid ${T.border}`, boxShadow: T.shadow, overflow: "hidden",
    }}>
      {visuals.map((visual, i) => (
        <div key={i} aria-hidden style={{ position: "absolute", inset: 0, padding: 22, pointerEvents: "none" }}>
          {visual}
        </div>
      ))}
    </div>
  );

  return (
    <section style={{ padding: "110px 0 40px", fontFamily: body }}>
      <h2 style={{
        margin: narrow ? "0 0 24px" : "0 0 44px", fontFamily: display, fontWeight: 700, fontSize: 28,
        letterSpacing: "-0.02em", color: T.text, textAlign: "center",
      }}>
        How Picks works
      </h2>

      <div ref={widgetRef} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {narrow ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              {rail}
              {arrows}
            </div>
            {text}
            {stage}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr 1.15fr", gap: 40, alignItems: "center" }}>
            {rail}
            <div>
              {text}
              <div style={{ marginTop: 20 }}>{arrows}</div>
            </div>
            {stage}
          </div>
        )}
      </div>
    </section>
  );
}

function Caption({ children }: { children: ReactNode }) {
  const T = useT();
  return <div style={{ color: T.metaDim, fontSize: 12, marginBottom: 12 }}>{children}</div>;
}

function Thumb({ src }: { src?: string }) {
  const T = useT();
  return (
    <div style={{ width: 48, aspectRatio: "16/9", borderRadius: 4, overflow: "hidden", background: T.chipBg, flexShrink: 0 }}>
      {src && <img src={smallCover(src)} alt="" decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />}
    </div>
  );
}

function LoginVisual({ active }: { active: boolean }) {
  const T = useT();
  const field: CSSProperties = { height: 44, padding: "0 14px", display: "flex", alignItems: "center", color: T.metaDim, fontSize: 14 };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 300, borderRadius: 12, border: `1px solid ${T.accent}`, background: T.bg, overflow: "hidden", ...fade(active) }}>
        <div style={field}>Enter email</div>
        <div style={{ height: 1, background: T.border, margin: "0 14px" }} />
        <div style={field}>Enter password</div>
        <div style={{ padding: "0 7px 7px" }}>
          <div style={{ height: 36, borderRadius: 8, background: T.accent, color: "#fff", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center" }}>
            Log in
          </div>
        </div>
      </div>
      <div style={{ marginTop: 14, color: T.meta, fontSize: 13, ...fade(active, 120) }}>Same login as Gamedex</div>
    </div>
  );
}

function ListVisual({ active, examples }: { active: boolean; examples: Record<string, string> }) {
  const T = useT();

  return (
    <div>
      <div style={fade(active)}><Caption>Example list</Caption></div>
      {EXAMPLE_LIST.map((game, i) => {
        const against = game.weight < 0;
        return (
          <div key={game.slug} style={{
            display: "grid", gridTemplateColumns: "auto 1fr auto 64px", gap: 12, alignItems: "center",
            padding: "9px 0", borderTop: i ? `1px solid ${T.border}` : "none", ...fade(active, 80 + i * 70),
          }}>
            <div style={{ opacity: against ? 0.5 : 1 }}><Thumb src={examples[game.slug]} /></div>
            <span style={{ color: against ? T.meta : T.text, fontSize: 14, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {game.name}
            </span>
            <span style={{ color: T.metaDim, fontSize: 12.5, whiteSpace: "nowrap" }}>{game.status}</span>
            <div style={{ height: 6, borderRadius: 3, background: T.chipBg, overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 3, background: against ? RED : T.accent,
                width: active ? `${Math.abs(game.weight) * 100}%` : 0,
                transition: STILL ? "none" : `width 600ms ${EASE} ${200 + i * 70}ms`,
              }} />
            </div>
          </div>
        );
      })}
      <div style={{ marginTop: 8, color: T.metaDim, fontSize: 12, textAlign: "right", ...fade(active, 500) }}>
        red counts against
      </div>
    </div>
  );
}

function SearchVisual({ active, covers }: { active: boolean; covers: string[] }) {
  const T = useT();
  const tiles = Array.from({ length: 10 }, (_, i) => covers[i] ?? null);
  const owned = new Set([2, 7]);

  return (
    <div>
      <div style={fade(active)}><Caption>Strongest tags from the list</Caption></div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 18 }}>
        {TASTE.map((t, i) => (
          <span key={t.tag} style={{
            padding: "4px 11px", borderRadius: 999, background: T.accentSoft, color: T.accent,
            fontSize: t.size, fontWeight: 600, ...fade(active, 60 + i * 50),
          }}>
            {t.tag}
          </span>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
        {tiles.map((src, i) => (
          <div key={i} style={{ position: "relative", aspectRatio: "16/9", borderRadius: 5, overflow: "hidden", background: T.chipBg, ...fade(active, 250 + i * 35) }}>
            {src && <img src={smallCover(src)} alt="" decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />}
            {owned.has(i) && (
              <div style={{ position: "absolute", inset: 0, background: `${T.bg}cc`, display: "flex", alignItems: "center", justifyContent: "center", color: T.meta, fontSize: 10.5, fontWeight: 600 }}>
                on list
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12, color: T.metaDim, fontSize: 12, ...fade(active, 600) }}>Up to 80 candidates from RAWG</div>
    </div>
  );
}

function RankVisual({ active, examples }: { active: boolean; examples: Record<string, string> }) {
  const T = useT();

  return (
    <div>
      <div style={fade(active)}><Caption>Example picks</Caption></div>
      {EXAMPLE_PICKS.map((pick, i) => (
        <div key={pick.slug} style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "9px 0", borderTop: i ? `1px solid ${T.border}` : "none", ...fade(active, 80 + i * 90),
        }}>
          <Thumb src={examples[pick.slug]} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 7 }}>
              <span style={{ color: T.text, fontSize: 14, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                <span style={{ color: T.metaDim, marginRight: 8 }}>{i + 1}</span>{pick.name}
              </span>
              <span style={{ color: T.accent, fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>{pick.match}% match</span>
            </div>
            <div style={{ height: 4, borderRadius: 2, background: T.chipBg, overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 2, background: T.accent,
                width: active ? `${pick.match}%` : 0,
                transition: STILL ? "none" : `width 700ms ${EASE} ${200 + i * 90}ms`,
              }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}