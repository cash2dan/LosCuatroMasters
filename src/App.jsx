import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Trophy, Flag, Target, Circle, TrendingUp, Activity, Zap, Wind, Award,
  Plus, Minus, ChevronLeft, ChevronRight, Users, Calendar, MapPin, Star,
  Check, User, ExternalLink, ChevronDown, BookOpen, AlertTriangle,
  Undo2, X, RefreshCw, Coffee, Book,
} from "lucide-react";

import {
  C, FONT, DISPLAY, MONO, PLAYERS, ROUNDS, EVENT, MASTERS, PORTRAITS,
  SCORE, SCORE_ORDER, scoreBand, TOPAR_DARK, TOPAR_PAPER,
} from "./data";
import { useScores, useMe } from "./useScores";
import { usePwaUpdate } from "./usePwaUpdate";
import Crest from "./Crest";
import { buildSeed, buildEmpty } from "./seed";
import { beerCurves, slopeText } from "./beer";
import { roundStat, leaderboardRows, dream18Rows, cardStats, computeAwards } from "./stats";

/* =========================================================
   LOS CUATRO MASTERS
   Spanien 11–13 september
   ========================================================= */

/* =========================================================
   ROOT
   ========================================================= */

export default function App() {
  const [tab, setTab] = useState("schema");
  const [roundId, setRoundId] = useState(ROUNDS[0].id);
  /* Scorekortet ligger utanför TABS och nås bara från Leaderboard. */
  const [card, setCard] = useState({ player: PLAYERS[0].id, round: ROUNDS[0].id });
  const [hole, setHole] = useState(0);
  const { scores, beers, set, addBeer, undoBeer, sync, reset, seedAll } = useScores();
  const [me, chooseMe] = useMe();
  const pwa = usePwaUpdate();

  const round = ROUNDS.find((r) => r.id === roundId);

  /* "masters" finns inte i TABS — sidan nås bara från Schema och tar
     över hela vyn, utan masthead och flikrad, för lugnets skull. */
  const about = tab === "masters";

  return (
    <div style={{ minHeight: "100vh", background: C.fairway, fontFamily: FONT, color: C.paper }}>
      <style>{`
        *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
        button{font-family:inherit}
        ::-webkit-scrollbar{display:none}
      `}</style>

      {!about && <Masthead sync={sync} />}
      {!about && <Tabs tab={tab} setTab={setTab} />}

      {about && <Masters onBack={() => { setTab("schema"); window.scrollTo(0, 0); }} />}

      {tab === "schema" && (
        <Schedule
          me={me}
          onPickMe={chooseMe}
          onReset={reset}
          onOpen={(id) => { setRoundId(id); setHole(0); setTab("bana"); }}
          onAbout={() => setTab("masters")}
        />
      )}
      {tab === "bana" && (
        <CourseGuide
          roundId={roundId} setRoundId={setRoundId}
          onPlay={() => { setHole(0); setTab("spela"); }}
        />
      )}
      {tab === "spela" && (
        <Play
          round={round} roundId={roundId} setRoundId={setRoundId}
          hole={hole} setHole={setHole}
          scores={scores[roundId]} set={set} me={me} onPickMe={chooseMe}
          beers={beers[roundId]}
          onBeer={(pid) => addBeer(roundId, pid, hole + 1)}
          onUndoBeer={(pid) => undoBeer(roundId, pid)}
        />
      )}
      {tab === "board" && (
        <Leaderboard
          scores={scores} me={me}
          onOpenCard={(playerId, view) => {
            setCard({ player: playerId, round: view === "all" ? ROUNDS[0].id : view });
            setTab("card");
            window.scrollTo(0, 0);
          }}
        />
      )}
      {tab === "card" && (
        <Scorecard
          scores={scores}
          playerId={card.player}
          roundId={card.round}
          onPickPlayer={(id) => setCard((c) => ({ ...c, player: id }))}
          onPickRound={(id) => setCard((c) => ({ ...c, round: id }))}
          onBack={() => { setTab("board"); window.scrollTo(0, 0); }}
        />
      )}
      {tab === "dream" && <Dream18 scores={scores} me={me} />}
      {tab === "ol" && <BeerCurve scores={scores} beers={beers} />}
      {tab === "awards" && <Awards scores={scores} beers={beers} />}
      {tab === "regler" && <Rules />}

      {import.meta.env.DEV && <DevSeed onSeed={seedAll} />}
      <UpdateBanner {...pwa} />
    </div>
  );
}

/* =========================================================
   CHROME
   ========================================================= */

/* En enda kompakt header på alla flikar, Schema inräknat. Den ligger
   ovanför scoreinmatningen och får inte växa. */
function Masthead({ sync }) {
  const label = sync === "loading" ? "Laddar…" : sync === "saving" ? "Sparar…" : sync === "error" ? "Ej synkad" : "Synkad";
  const dot = sync === "error" ? C.clay : sync === "ok" ? "#6FBE8F" : C.mutedGreen;
  return (
    <div style={{ padding: "20px 16px 4px", textAlign: "center" }}>
      {/* Vapnet till vänster om de två textraderna, hela gruppen
          centrerad. 40 px höjd balanserar raderna och lämnar marginal
          nog att titeln håller sig på en rad ner till 320 px. */}
      <div style={{ display: "inline-flex", alignItems: "center", gap: 11, textAlign: "left" }}>
        <Crest size={40} color={C.goldBright} />
        <div>
          <h1 style={{
            fontFamily: DISPLAY, fontSize: 26, fontWeight: 700, margin: 0,
            textTransform: "uppercase", letterSpacing: "0.04em", lineHeight: 1.1,
          }}>
            Los Cuatro <span style={{ color: C.goldBright }}>Masters</span>
          </h1>
          <div style={{ fontSize: 10.5, color: C.mutedGreen, letterSpacing: "0.18em", textTransform: "uppercase", marginTop: 4 }}>
            {`${EVENT.place} · ${EVENT.dates} ${EVENT.year}`}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, marginTop: 9, fontSize: 10.5, color: C.dim }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: dot }} />
        {label}
      </div>
    </div>
  );
}

const TABS = [
  { id: "schema", label: "Schema", icon: Calendar },
  { id: "bana", label: "Banguide", icon: MapPin },
  { id: "spela", label: "Spela", icon: Flag },
  { id: "board", label: "Leaderboard", icon: Trophy },
  { id: "dream", label: "Dream 18", icon: Star },
  { id: "ol", label: "Ölkurvan", emoji: "🍺" },
  { id: "awards", label: "Awards", icon: Award },
  { id: "regler", label: "Regler", icon: BookOpen },
];

function Tabs({ tab, setTab }) {
  const refs = useRef({});

  /* Åtta flikar får inte plats på en mobilskärm. Raden scrollar i sidled
     och den valda fliken dras alltid in i bild — annars kan man byta
     till en flik som sedan ligger utanför kanten. */
  useEffect(() => {
    refs.current[tab]?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  }, [tab]);

  return (
    <div style={{
      position: "sticky", top: 0, zIndex: 20, background: C.fairwayDark,
      borderBottom: `1px solid ${C.line}`, marginTop: 14,
    }}>
      <div style={{
        display: "flex", gap: 6, padding: "10px 12px", overflowX: "auto",
        WebkitOverflowScrolling: "touch", scrollbarWidth: "none",
      }}>
        {TABS.map((t) => {
          const I = t.icon, on = tab === t.id;
          return (
            <button
              key={t.id}
              ref={(el) => { refs.current[t.id] = el; }}
              onClick={() => setTab(t.id)}
              style={{
                display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
                padding: "9px 14px", borderRadius: 20, border: "none", cursor: "pointer",
                background: on ? C.gold : "rgba(255,255,255,0.05)",
                color: on ? C.fairwayDark : C.mutedGreen, fontSize: 12.5, fontWeight: 700,
                whiteSpace: "nowrap",
              }}
            >
              {I ? <I size={14} strokeWidth={2.4} /> : <span style={{ fontSize: 13, lineHeight: 1 }}>{t.emoji}</span>}
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Head({ icon: I, title, sub }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 16 }}>
      <div style={{
        width: 34, height: 34, borderRadius: 10, background: C.gold, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <I size={17} color={C.fairwayDark} strokeWidth={2.5} />
      </div>
      <div>
        <div style={{ fontFamily: DISPLAY, fontSize: 20, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em" }}>{title}</div>
        {sub && <div style={{ fontSize: 11.5, color: C.mutedGreen }}>{sub}</div>}
      </div>
    </div>
  );
}

function Empty({ text }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.035)", border: `1px dashed ${C.line}`,
      borderRadius: 12, padding: "22px 16px", textAlign: "center", color: C.mutedGreen, fontSize: 13,
    }}>{text}</div>
  );
}

function DayPills({ value, onChange, includeAll = false }) {
  return (
    <div style={{ display: "flex", gap: 7, marginBottom: 16 }}>
      {includeAll && <Pill label="Totalt" on={value === "all"} onClick={() => onChange("all")} />}
      {ROUNDS.map((r) => (
        <Pill key={r.id} label={r.short} on={value === r.id} onClick={() => onChange(r.id)} />
      ))}
    </div>
  );
}

function Pill({ label, on, onClick }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: "9px 4px", borderRadius: 10, border: "none", cursor: "pointer",
      background: on ? C.goldBright : "rgba(255,255,255,0.05)",
      color: on ? C.fairwayDark : C.mutedGreen, fontSize: 12.5, fontWeight: 700,
    }}>{label}</button>
  );
}

const fmtPar = (n) => (n > 0 ? `+${n}` : n === 0 ? "E" : `${n}`);
const parColor = (n) => (n < 0 ? TOPAR_DARK.under : n === 0 ? TOPAR_DARK.even : TOPAR_DARK.over);
const parInk = (n) => (n < 0 ? TOPAR_PAPER.under : n === 0 ? TOPAR_PAPER.even : TOPAR_PAPER.over);

/* Formkonventionen ritad som ram inuti rutan: ring för birdie, dubbel
   ring för eagle, ruta för bogey, dubbel ruta för dubbel eller sämre.
   Ramarna ligger absolut placerade så siffran aldrig trängs undan.

   `pad` styr hur nära kanten den yttre ramen går — den ska vara
   synlig även i rutnätets minsta grad på mobil. */
function ScoreMark({ shape, ink, pad = 2, radius = 2 }) {
  if (shape === "none") return null;
  const round = shape === "circle" || shape === "circle2";
  const dbl = shape === "circle2" || shape === "square2";
  const ring = (inset, r) => (
    <span style={{
      position: "absolute", top: inset, bottom: inset, left: inset + 1, right: inset + 1,
      border: `1.2px solid ${ink}`, borderRadius: round ? "50%" : r,
      opacity: 0.9, pointerEvents: "none",
    }} />
  );
  return <>{ring(pad, radius)}{dbl && ring(pad + 2.6, Math.max(1, radius - 1))}</>;
}

/* Färgad ruta med siffra och formmarkering — scorekortets grundcell,
   återanvänd i teckenförklaringen till scoringfördelningen. */
function ScoreBox({ d, value, height = 24, fontSize = 12, radius = 4, pad = 2 }) {
  const b = SCORE[scoreBand(d)];
  return (
    <div style={{
      position: "relative", height, display: "flex", alignItems: "center", justifyContent: "center",
      background: b.c, borderRadius: radius,
    }}>
      <ScoreMark shape={b.shape} ink={b.ink} pad={pad} />
      <span style={{
        position: "relative", fontFamily: MONO, fontSize, fontWeight: 700, color: b.ink,
      }}>{value}</span>
    </div>
  );
}

/* =========================================================
   SCHEMA
   ========================================================= */

function Schedule({ me, onPickMe, onOpen, onReset, onAbout }) {
  return (
    <div style={{ padding: "20px 16px 60px" }}>
      {/* Ligger först på sidan, direkt under flikraden. Till skillnad
          från rundkorten är det inte papper — det stannar på sidans
          egen botten och ramas in i stället, så det inte konkurrerar
          med listan under. */}
      <button onClick={onAbout} style={{
        display: "flex", alignItems: "center", gap: 14, width: "100%", textAlign: "left",
        cursor: "pointer", marginBottom: 22, padding: "14px 16px",
        background: "rgba(255,255,255,0.04)", borderRadius: 14,
        border: `1px solid rgba(243,238,221,0.35)`,
      }}>
        <Crest size={46} color={C.goldBright} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: DISPLAY, fontSize: 20, fontWeight: 700, color: C.paper,
            textTransform: "uppercase", letterSpacing: "0.03em", lineHeight: 1.15,
          }}>
            Om mästerskapet
          </div>
          <div style={{ fontSize: 12, color: C.mutedGreen, marginTop: 3 }}>
            Deltagare, historik och tidigare upplagor
          </div>
        </div>
        <ChevronRight size={18} color={C.mutedGreen} strokeWidth={2.4} style={{ flexShrink: 0 }} />
      </button>

      <WhoAmI me={me} onPick={onPickMe} />
      <Head icon={Calendar} title="Schema" sub="Tre rundor, två banor" />
      {ROUNDS.map((r) => {
        const par = r.holes.reduce((s, h) => s + h.par, 0);
        const len = r.holes.reduce((s, h) => s + h.m, 0);
        return (
          <button key={r.id} onClick={() => onOpen(r.id)} style={{
            display: "block", width: "100%", textAlign: "left", border: "none", cursor: "pointer",
            background: C.paper, borderRadius: 14, padding: "15px 17px", marginBottom: 11,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 10.5, fontWeight: 800, color: C.gold, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                  {r.day} {r.date}
                </div>
                <div style={{ fontFamily: DISPLAY, fontSize: 20, fontWeight: 700, color: C.ink, marginTop: 3, lineHeight: 1.15 }}>
                  {r.short_course}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 3, color: C.muted, fontSize: 12 }}>
                  <MapPin size={11} /> {r.location}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 18, marginTop: 12, paddingTop: 11, borderTop: `1px solid ${C.paperDark}` }}>
              <Fact k="Par" v={par} />
              <Fact k="Längd" v={`${len.toLocaleString("sv-SE")} m`} />
              <Fact k="Hål" v="18" />
            </div>
          </button>
        );
      })}

      <ResetData onReset={onReset} />
    </div>
  );
}

/* Nollställning av all scoring. Medvetet nedtonad och trög att komma åt:
   liten länk → bekräftelseyta → skriva ordet → röd knapp. */
function ResetData({ onReset }) {
  const [open, setOpen] = useState(false);
  const [word, setWord] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);
  const closeTimer = useRef(null);

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  const armed = word.trim() === "NOLLSTÄLL" && !busy;

  const close = () => {
    setOpen(false); setWord(""); setError(null); setDone(false);
  };

  const run = async () => {
    if (!armed) return;
    setBusy(true); setError(null);
    try {
      await onReset();
      setDone(true);
      closeTimer.current = setTimeout(close, 1600);
    } catch {
      setError("Kunde inte nollställa. Inget har raderats — kolla uppkopplingen och försök igen.");
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <div style={{ marginTop: 30, paddingTop: 15, borderTop: `1px solid ${C.line}` }}>
        <button onClick={() => setOpen(true)} style={{
          display: "flex", alignItems: "center", gap: 6, padding: "3px 0",
          background: "none", border: "none", cursor: "pointer",
          fontSize: 11, fontWeight: 600, color: "rgba(181,83,60,0.85)",
        }}>
          <AlertTriangle size={12} strokeWidth={2.4} /> Nollställ all data
        </button>
        <div style={{ fontSize: 10, color: C.dim, marginTop: 5, lineHeight: 1.5 }}>
          Raderar all inrapporterad scoring för alla fyra spelare. Tänkt för
          att kunna testa appen innan resan.
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 30, paddingTop: 15, borderTop: `1px solid ${C.line}` }}>
      <div style={{
        background: "rgba(181,83,60,0.09)", border: "1px solid rgba(181,83,60,0.4)",
        borderRadius: 12, padding: 14,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9 }}>
          <AlertTriangle size={15} color={C.clay} strokeWidth={2.5} />
          <span style={{ fontSize: 13, fontWeight: 800, color: C.paper }}>Nollställ all data</span>
        </div>

        <div style={{ fontSize: 11.5, color: C.paper, lineHeight: 1.6, opacity: 0.9 }}>
          Detta raderar <strong>ALL</strong> scoring för Jonsson, Johansson, Per
          och Lars över alla tre rundor. Går inte att ångra.
        </div>

        {done ? (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
            marginTop: 13, padding: "11px 0", borderRadius: 10,
            background: "rgba(46,125,79,0.25)", color: "#6FBE8F", fontSize: 12.5, fontWeight: 800,
          }}>
            <Check size={15} strokeWidth={3} /> Nollställt
          </div>
        ) : (
          <>
            <div style={{
              fontSize: 10, color: C.mutedGreen, marginTop: 13, marginBottom: 6,
              textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 800,
            }}>
              Skriv NOLLSTÄLL för att bekräfta
            </div>
            <input
              value={word}
              onChange={(e) => setWord(e.target.value)}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="characters"
              spellCheck={false}
              placeholder="NOLLSTÄLL"
              style={{
                width: "100%", fontFamily: MONO, fontSize: 15, fontWeight: 700, color: C.ink,
                background: C.paperInput, border: `1px solid ${C.paperDark}`, borderRadius: 9,
                padding: "10px 12px", outline: "none", letterSpacing: "0.06em",
              }}
            />

            {error && (
              <div style={{ fontSize: 11, color: C.clay, marginTop: 9, lineHeight: 1.5 }}>{error}</div>
            )}

            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button onClick={close} disabled={busy} style={{
                flex: 2, padding: "13px 0", borderRadius: 10, border: "none",
                background: C.gold, color: C.fairwayDark, fontSize: 13, fontWeight: 800,
                letterSpacing: "0.03em", cursor: busy ? "default" : "pointer",
              }}>
                Avbryt
              </button>
              <button onClick={run} disabled={!armed} style={{
                flex: 1, padding: "10px 0", borderRadius: 10, border: "none",
                background: armed ? C.clay : "rgba(255,255,255,0.07)",
                color: armed ? C.paper : C.dim,
                fontSize: 11.5, fontWeight: 800, letterSpacing: "0.03em",
                cursor: armed ? "pointer" : "default",
              }}>
                {busy ? "Nollställer…" : "Nollställ"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function WhoAmI({ me, onPick }) {
  const [open, setOpen] = useState(false);
  const mine = PLAYERS.find((p) => p.id === me);

  if (mine && !open) {
    return (
      <button onClick={() => setOpen(true)} style={{
        display: "flex", alignItems: "center", gap: 10, width: "100%", marginBottom: 16,
        background: "rgba(255,255,255,0.05)", border: `1px solid ${C.line}`, borderRadius: 12,
        padding: "11px 14px", cursor: "pointer", color: C.paper,
      }}>
        <span style={{ width: 9, height: 9, borderRadius: "50%", background: mine.color }} />
        <span style={{ fontSize: 13, fontWeight: 600, flex: 1, textAlign: "left" }}>
          Du spelar som <strong>{mine.name}</strong>
        </span>
        <ChevronDown size={15} color={C.mutedGreen} />
      </button>
    );
  }

  return (
    <div style={{
      background: "rgba(255,255,255,0.05)", border: `1px solid ${C.line}`,
      borderRadius: 12, padding: 14, marginBottom: 16,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 11 }}>
        <User size={14} color={C.gold} />
        <span style={{ fontSize: 12.5, fontWeight: 600 }}>Vem är du?</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {PLAYERS.map((p) => (
          <button key={p.id} onClick={() => { onPick(p.id); setOpen(false); }} style={{
            display: "flex", alignItems: "center", gap: 8, padding: "11px 12px",
            borderRadius: 10, border: "none", cursor: "pointer",
            background: me === p.id ? C.gold : "rgba(255,255,255,0.07)",
            color: me === p.id ? C.fairwayDark : C.paper, fontSize: 13, fontWeight: 700,
          }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color }} />
            {p.name}
          </button>
        ))}
      </div>
      <div style={{ fontSize: 10.5, color: C.dim, marginTop: 10, lineHeight: 1.5 }}>
        Ditt kort hamnar överst när ni spelar. Alla ser samma scoring live.
      </div>
    </div>
  );
}

function Fact({ k, v }) {
  return (
    <div>
      <div style={{ fontSize: 9.5, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em" }}>{k}</div>
      <div style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: C.ink }}>{v}</div>
    </div>
  );
}

/* =========================================================
   BANGUIDE
   ========================================================= */

/* Växlarens läge gäller alla tre rundorna och överlever omladdning —
   den som läser igenom banorna slipper trycka om för varje dag. */
const GUIDE_NOTES_KEY = "loscuatro-guidenotes-v1";

function useGuideNotes() {
  const [on, setOn] = useState(() => {
    try { return localStorage.getItem(GUIDE_NOTES_KEY) === "1"; } catch { return false; }
  });
  const toggle = () => setOn((v) => {
    try { localStorage.setItem(GUIDE_NOTES_KEY, v ? "0" : "1"); } catch { /* privat läge */ }
    return !v;
  });
  return [on, toggle];
}

function CourseGuide({ roundId, setRoundId, onPlay }) {
  const r = ROUNDS.find((x) => x.id === roundId);
  const [showNotes, toggleNotes] = useGuideNotes();
  const sum = (a, k) => a.reduce((s, h) => s + h[k], 0);
  const front = r.holes.slice(0, 9), back = r.holes.slice(9);

  return (
    <div style={{ padding: "20px 16px 60px" }}>
      <Head icon={MapPin} title="Banguide" sub={`${r.course} · ${r.location}`} />
      <DayPills value={roundId} onChange={setRoundId} />

      <CourseIntro intro={r.intro} />

      <button onClick={toggleNotes} style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
        width: "100%", marginBottom: 12, padding: "10px 0", cursor: "pointer",
        borderRadius: 10, border: "none",
        background: showNotes ? C.goldBright : "rgba(255,255,255,0.05)",
        color: showNotes ? C.fairwayDark : C.mutedGreen,
        fontSize: 12.5, fontWeight: 700,
        transition: "background .2s ease, color .2s ease",
      }}>
        {showNotes ? <BookOpen size={14} strokeWidth={2.4} /> : <Book size={14} strokeWidth={2.4} />}
        {showNotes ? "Dölj beskrivningar" : "Visa beskrivningar"}
      </button>

      <div style={{ background: C.paper, borderRadius: 14, overflow: "hidden" }}>
        <Nine title="Ut" holes={front} showNotes={showNotes} />
        <div style={{ height: 1, background: C.paperDark, margin: "0 14px" }} />
        <Nine title="In" holes={back} showNotes={showNotes} />
        <div style={{
          display: "flex", padding: "11px 14px", fontFamily: MONO, fontSize: 13, fontWeight: 700,
          color: C.ink, background: C.paperDark,
        }}>
          <span style={{ flex: 1 }}>Totalt</span>
          <span style={{ width: 34, textAlign: "center" }}>{sum(r.holes, "par")}</span>
          <span style={{ width: 36 }} />
          <span style={{ width: 50, textAlign: "right" }}>{sum(r.holes, "m").toLocaleString("sv-SE")}</span>
        </div>
      </div>

      <button onClick={onPlay} style={{
        width: "100%", marginTop: 14, background: C.gold, color: C.fairwayDark, border: "none",
        borderRadius: 11, padding: "14px 0", fontSize: 13.5, fontWeight: 800,
        letterSpacing: "0.04em", textTransform: "uppercase", cursor: "pointer",
      }}>
        Spela {r.day.toLowerCase()}
      </button>

      <a href={r.guideUrl} target="_blank" rel="noopener noreferrer" style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
        marginTop: 12, fontSize: 12, color: C.mutedGreen, textDecoration: "none",
      }}>
        Hålkartor & flyovers hos {r.short_course} <ExternalLink size={12} />
      </a>
    </div>
  );
}

/* Baninledningen, ovanför håltabellen. Ligger på sidans mörka botten
   med gott om luft — den ska hinna sätta stämningen innan siffrorna. */
function CourseIntro({ intro }) {
  if (!intro) return null;
  return (
    <div style={{ marginBottom: 22 }}>
      <h2 style={{
        fontFamily: DISPLAY, fontSize: 19, fontWeight: 700, margin: 0, color: C.paper,
        textTransform: "uppercase", letterSpacing: "0.06em", lineHeight: 1.2,
      }}>
        {intro.title}
      </h2>
      <div style={{
        fontSize: 9.5, color: C.gold, letterSpacing: "0.17em",
        textTransform: "uppercase", marginTop: 7, lineHeight: 1.6,
      }}>
        {intro.sub}
      </div>
      <div style={{ width: 40, height: 1, background: C.line, margin: "15px 0" }} />
      {intro.body.map((t, i) => (
        <p key={i} style={{
          fontSize: 13, lineHeight: 1.85, color: "rgba(243,238,221,0.8)",
          margin: i === intro.body.length - 1 ? 0 : "0 0 14px",
        }}>{t}</p>
      ))}
    </div>
  );
}

/* En hålrad. Par, index och meter syns alltid; beskrivningen styrs av
   växlaren för hela banan — enskilda hål går inte att öppna, så man
   slipper hålla reda på vilka man råkat fälla ut.

   Utfällningen animeras med grid-template-rows 0fr → 1fr i stället för
   max-height: höjden behöver då inte gissas, och texterna är olika
   långa. Webbläsare som inte interpolerar fr-enheter hoppar i stället
   direkt, vilket är ett acceptabelt fall tillbaka. */
function HoleRow({ h, zebra, showNote }) {
  return (
    <div style={{ background: zebra ? "rgba(0,0,0,0.02)" : "transparent" }}>
      <div style={{
        display: "flex", alignItems: "center",
        padding: "7px 14px", fontFamily: MONO, fontSize: 13, color: C.ink,
      }}>
        <span style={{ width: 22, fontWeight: 700, flexShrink: 0 }}>{h.hole}</span>
        <span style={{
          flex: 1, minWidth: 0, paddingRight: 8,
          fontFamily: DISPLAY, fontSize: 12.5, fontWeight: 700, color: C.muted,
          textTransform: "uppercase", letterSpacing: "0.05em",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {h.name || ""}
        </span>
        <span style={{
          width: 34, textAlign: "center", flexShrink: 0,
          color: h.par === 3 ? C.clay : h.par === 5 ? C.green : C.ink,
        }}>{h.par}</span>
        <span style={{ width: 36, textAlign: "center", flexShrink: 0, fontSize: 11.5, color: "#9A937A" }}>
          {h.si}
        </span>
        <span style={{ width: 50, textAlign: "right", flexShrink: 0 }}>{h.m}</span>
      </div>

      <div style={{
        display: "grid",
        gridTemplateRows: showNote ? "1fr" : "0fr",
        transition: "grid-template-rows .28s ease",
      }}>
        <div style={{ overflow: "hidden" }}>
          <div style={{ padding: "0 16px 11px 36px" }}>
            <div style={{
              fontFamily: MONO, fontSize: 10.5, color: "#9A937A", letterSpacing: "0.02em",
            }}>
              Par {h.par} · {h.m} m · Index {h.si}
            </div>
            <div style={{ fontSize: 12, lineHeight: 1.72, color: C.muted, marginTop: 5 }}>
              {h.note}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Nine({ title, holes, showNotes }) {
  return (
    <div>
      <div style={{
        display: "flex", padding: "11px 14px 7px", fontSize: 10,
        color: C.muted, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.09em",
      }}>
        <span style={{ flex: 1 }}>{title}</span>
        <span style={{ width: 34, textAlign: "center" }}>Par</span>
        <span style={{ width: 36, textAlign: "center" }}>Index</span>
        <span style={{ width: 50, textAlign: "right" }}>Meter</span>
      </div>
      {holes.map((h) => (
        <HoleRow key={h.hole} h={h} zebra={h.hole % 2 === 0} showNote={showNotes} />
      ))}
    </div>
  );
}

/* =========================================================
   MÄSTERSKAPET

   Nås från Schema, inte från flikraden — App döljer masthead och
   flikar medan den är öppen, så sidan får vara en sida. Texterna
   ligger i MASTERS i data.js; här finns bara typografin.

   Luftigare än övriga vyer med flit: bredare marginaler, större
   radavstånd och gott om utrymme mellan avsnitten.
   ========================================================= */

/* Rubrikstil för avsnitten: Oswald, spärrat, med ett tunt guldstreck
   under. Samma mall för Residenset, Deltagarna och varje upplaga. */
function MastersHeading({ children }) {
  return (
    <div style={{ margin: "42px 0 18px" }}>
      <h2 style={{
        fontFamily: DISPLAY, fontSize: 16, fontWeight: 700, margin: 0,
        textTransform: "uppercase", letterSpacing: "0.2em", color: C.goldBright,
      }}>
        {children}
      </h2>
      <div style={{ width: 46, height: 1, background: C.gold, marginTop: 11 }} />
    </div>
  );
}

function MastersProse({ paragraphs }) {
  return paragraphs.map((t, i) => (
    <p key={i} style={{
      fontSize: 14, lineHeight: 1.95, color: "rgba(243,238,221,0.84)",
      margin: i === 0 ? "0 0 18px" : "0 0 18px", textAlign: "left",
    }}>{t}</p>
  ));
}

/* Porträttet flyter till vänster i stället för att ligga i en egen
   flexkolumn. Texten löper då runt bilden och fortsätter i full bredd
   under den — nödvändigt vid 112 px bild, annars blir spalten bredvid
   för smal på en telefon och korten orimligt höga.
   `overflow: hidden` innesluter floaten, så kortet blir minst lika
   högt som bilden även om en text skulle bli kort. */
function MastersPerson({ id, body }) {
  const player = PLAYERS.find((x) => x.id === id);
  if (!player) return null;
  return (
    <div style={{
      overflow: "hidden",
      background: C.paper, borderRadius: 14, borderLeft: `4px solid ${player.color}`,
      padding: "16px 18px", marginBottom: 13,
    }}>
      <img
        src={PORTRAITS[id]}
        alt={player.name}
        width={112}
        height={112}
        loading="lazy"
        style={{
          width: 112, height: 112, objectFit: "cover", borderRadius: 12,
          float: "left", margin: "0 14px 0 0", display: "block", background: C.paperDark,
        }}
      />
      <div style={{
        fontFamily: DISPLAY, fontSize: 17, fontWeight: 700, color: C.ink,
        textTransform: "uppercase", letterSpacing: "0.06em", lineHeight: 1.1,
      }}>
        {player.name}
      </div>
      <p style={{ fontSize: 13, lineHeight: 1.78, color: C.muted, margin: "8px 0 0" }}>
        {body}
      </p>
    </div>
  );
}

function BackToSchedule({ onBack }) {
  return (
    <button onClick={onBack} style={{
      display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer",
      background: "rgba(255,255,255,0.05)", border: `1px solid ${C.line}`, borderRadius: 20,
      color: C.mutedGreen, fontSize: 12, fontWeight: 700, padding: "9px 15px",
    }}>
      <ChevronLeft size={14} strokeWidth={2.4} /> Schema
    </button>
  );
}

/* ---------- Historik: en spelad upplaga ----------

   Slutställningen syns direkt; rundorna, Dream 18 och awards ligger
   bakom "Visa detaljer" så sidan inte svämmar över. Alla siffror
   kommer förräknade från datakonstanten — här räknas ingenting.  */

function EditionSub({ children }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 800, color: C.mutedGreen, textTransform: "uppercase",
      letterSpacing: "0.18em", margin: "26px 0 12px",
    }}>
      {children}
    </div>
  );
}

/* Fotnot i samma dämpade ton som noterna på Ölkurvan. */
function EditionNote({ children }) {
  return (
    <p style={{ fontSize: 11.5, lineHeight: 1.7, color: C.dim, margin: "11px 0 0" }}>
      {children}
    </p>
  );
}

/* Slutställning i Leaderboardens stil: guldkort på segraren, färgprick
   per spelare, siffrorna i monospace. */
function EditionStandings({ rows }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {rows.map((r, i) => {
        const p = PLAYERS.find((x) => x.id === r.id);
        const first = i === 0;
        return (
          <div key={r.id} style={{
            display: "flex", alignItems: "center", gap: 11,
            background: first ? C.gold : C.paper, borderRadius: 12, padding: "12px 14px",
          }}>
            <div style={{
              fontFamily: DISPLAY, fontSize: 19, fontWeight: 700, width: 20,
              color: first ? C.fairwayDark : C.muted,
            }}>{i + 1}</div>
            <div style={{ width: 9, height: 9, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0, fontWeight: 800, fontSize: 14.5, color: C.ink }}>
              {p.name}
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: MONO, fontSize: 15, fontWeight: 700, color: parColor(r.over) }}>
                {fmtPar(r.over)}
              </div>
              <div style={{ fontFamily: MONO, fontSize: 11, color: C.muted }}>{r.strokes}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EditionRound({ round }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.04)", border: `1px solid ${C.line}`,
      borderRadius: 12, padding: "12px 14px", marginBottom: 9,
    }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: C.paper }}>
        {round.date} <span style={{ color: C.mutedGreen, fontWeight: 600 }}>· {round.course}</span>
      </div>
      <div style={{ fontSize: 10.5, color: C.dim, marginTop: 2 }}>Par {round.parTotal}</div>
      <div style={{ display: "flex", gap: 6, marginTop: 11, paddingTop: 10, borderTop: `1px solid ${C.line}` }}>
        {PLAYERS.map((p) => {
          const t = round.totals[p.id];
          if (!t) return null;
          return (
            <div key={p.id} style={{ flex: 1, textAlign: "center", minWidth: 0 }}>
              <div style={{
                fontSize: 9.5, color: C.mutedGreen, whiteSpace: "nowrap",
                overflow: "hidden", textOverflow: "ellipsis",
              }}>{p.name}</div>
              <div style={{ fontFamily: MONO, fontSize: 14, fontWeight: 700, color: C.paper, marginTop: 3 }}>
                {t.strokes}
              </div>
              <div style={{ fontFamily: MONO, fontSize: 10.5, color: parColor(t.over), marginTop: 1 }}>
                {fmtPar(t.over)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EditionDream18({ rows }) {
  return (
    <div style={{ background: C.paper, borderRadius: 12, overflow: "hidden" }}>
      {rows.map((r, i) => {
        const p = PLAYERS.find((x) => x.id === r.id);
        return (
          <div key={r.id} style={{
            display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
            borderTop: i === 0 ? "none" : `1px solid ${C.paperDark}`,
          }}>
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
            <span style={{ flex: 1, fontWeight: 800, fontSize: 13.5, color: C.ink }}>{p.name}</span>
            <span style={{ fontFamily: MONO, fontSize: 14, fontWeight: 700, color: C.ink }}>{r.strokes}</span>
          </div>
        );
      })}
    </div>
  );
}

/* Går igenom samma AWARDS-lista som Awards-fliken, så ikoner, rubriker
   och ordning är identiska. Saknas nyckeln i upplagans data ritas
   kortet som "—" — det gäller grenarna där 2025 saknar statistik. */
function EditionAwards({ awards }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
      {AWARDS.map((a) => {
        const w = awards[a.k], I = a.i;
        const winners = w ? w.ids.map((id) => PLAYERS.find((x) => x.id === id)).filter(Boolean) : [];
        return (
          <div key={a.k} style={{
            display: "flex", alignItems: "center", gap: 13,
            background: w ? C.paper : "rgba(255,255,255,0.035)",
            border: w ? "none" : `1px dashed ${C.line}`,
            borderRadius: 13, padding: "13px 14px",
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 11, flexShrink: 0,
              background: w ? C.fairway : "rgba(255,255,255,0.05)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <I size={19} color={w ? C.goldBright : C.dim} strokeWidth={2.2} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 13.5, color: w ? C.ink : C.mutedGreen }}>{a.t}</div>
              <div style={{ fontSize: 11, color: w ? C.muted : C.dim, marginTop: 1 }}>{a.d}</div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              {w ? (
                <>
                  {winners.map((p) => (
                    <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
                      <span style={{ fontWeight: 800, fontSize: 12.5, color: C.ink }}>{p.name}</span>
                    </div>
                  ))}
                  <div style={{ fontFamily: MONO, fontSize: 10, color: C.muted, marginTop: 3 }}>
                    {winners.length > 1 ? `delad · ${w.v}` : w.v}
                  </div>
                </>
              ) : <span style={{ fontSize: 11.5, color: C.dim }}>—</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EditionDetails({ data }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <EditionStandings rows={data.standings} />

      <button onClick={() => setOpen((o) => !o)} style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
        width: "100%", marginTop: 12, padding: "11px 0", cursor: "pointer",
        background: "rgba(255,255,255,0.04)", border: `1px solid ${C.line}`, borderRadius: 12,
        color: C.mutedGreen, fontSize: 12, fontWeight: 700, letterSpacing: "0.06em",
      }}>
        {open ? "Dölj detaljer" : "Visa detaljer"}
        <ChevronDown size={14} strokeWidth={2.4} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
      </button>

      {open && (
        <div style={{ marginTop: 4 }}>
          <EditionSub>Rundorna</EditionSub>
          {data.rounds.map((r) => <EditionRound key={r.id} round={r} />)}
          {data.courseNote && <EditionNote>{data.courseNote}</EditionNote>}

          <EditionSub>Dream 18</EditionSub>
          <EditionDream18 rows={data.dream18.rows} />
          {data.dream18.note && <EditionNote>{data.dream18.note}</EditionNote>}

          <EditionSub>Awards {data.year}</EditionSub>
          <EditionAwards awards={data.awards} />
          {data.awardsNote && <EditionNote>{data.awardsNote}</EditionNote>}
        </div>
      )}
    </div>
  );
}

function Masters({ onBack }) {
  /* Sidan öppnas från en scrollad Schema-vy — börja från början. */
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div style={{ padding: "16px 22px 80px", maxWidth: 640, margin: "0 auto" }}>
      <BackToSchedule onBack={onBack} />

      {/* Titelblad */}
      <div style={{ textAlign: "center", padding: "44px 0 10px" }}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Crest size={92} color={C.goldBright} />
        </div>
        <h1 style={{
          fontFamily: DISPLAY, fontSize: 34, fontWeight: 700, margin: "26px 0 0",
          textTransform: "uppercase", letterSpacing: "0.05em", lineHeight: 1.12, color: C.paper,
        }}>
          {MASTERS.title}
        </h1>
        <div style={{
          fontSize: 9.5, color: C.mutedGreen, letterSpacing: "0.26em",
          textTransform: "uppercase", marginTop: 16, lineHeight: 2,
        }}>
          {MASTERS.founded}
        </div>
      </div>

      <div style={{ margin: "34px auto 40px", width: 100, height: 1, background: C.line }} />

      <MastersProse paragraphs={MASTERS.intro} />

      <MastersHeading>{MASTERS.residence.title}</MastersHeading>
      <MastersProse paragraphs={MASTERS.residence.body} />

      <MastersHeading>{MASTERS.participants.title}</MastersHeading>
      {MASTERS.participants.people.map((x) => (
        <MastersPerson key={x.id} id={x.id} body={x.body} />
      ))}

      {/* Upplagorna ritas i tur och ordning. En upplaga med bevarade
          scorekort får sin tabell här under texten. */}
      {MASTERS.editions.map((e) => (
        <div key={e.id}>
          <MastersHeading>{e.title}</MastersHeading>
          <MastersProse paragraphs={e.body} />
          {e.data && <EditionDetails data={e.data} />}
        </div>
      ))}

      <div style={{ margin: "34px auto 26px", width: 100, height: 1, background: C.line }} />

      <div style={{ textAlign: "center" }}>
        <BackToSchedule onBack={onBack} />
      </div>
    </div>
  );
}

/* =========================================================
   SPELA — förenklad inmatning
   ========================================================= */

function Play({
  round, roundId, setRoundId, hole, setHole, scores, set, me, onPickMe,
  beers, onBeer, onUndoBeer,
}) {
  const h = round.holes[hole];

  /* Beskrivningen är hopfälld som standard — par och meter ska alltid
     synas utan att scoreinmatningen trycks ner. Valet följer med
     mellan hålen: öppnar man en gång står den öppen rundan ut. */
  const [showNote, setShowNote] = useState(false);

  const ordered = useMemo(() => {
    if (!me) return PLAYERS;
    return [...PLAYERS].sort((a, b) => (a.id === me ? -1 : b.id === me ? 1 : 0));
  }, [me]);

  /* Bara Aloha har halvvägshus — Santana spelas i ett svep. */
  const [showHalfway, closeHalfway] = useHalfwayNotice(
    roundId,
    round.short_course === "Aloha",
    me ? scores[me][7].s : null,
    hole
  );

  if (!me) {
    return (
      <div style={{ padding: "20px 16px 60px" }}>
        <Head icon={Flag} title="Spela" sub="Välj vem du är för att börja" />
        <WhoAmI me={me} onPick={onPickMe} />
      </div>
    );
  }

  return (
    <div style={{ padding: "18px 16px 60px" }}>
      <DayPills value={roundId} onChange={(id) => { setRoundId(id); setHole(0); }} />

      {/* Hole header */}
      <div style={{
        background: `linear-gradient(160deg, ${C.fairwayMid}, ${C.fairwayDark})`,
        border: `1px solid ${C.line}`, borderRadius: 16, padding: "14px 12px 16px", marginBottom: 14,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Arrow dir="left" disabled={hole === 0} onClick={() => setHole((x) => Math.max(0, x - 1))} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 9.5, color: C.mutedGreen, letterSpacing: "0.2em", textTransform: "uppercase" }}>Hål</div>
            <div style={{ fontFamily: DISPLAY, fontSize: 46, fontWeight: 700, color: C.goldBright, lineHeight: 1 }}>{hole + 1}</div>
            {h.name && (
              <div style={{
                fontFamily: DISPLAY, fontSize: 13, fontWeight: 700, color: C.gold,
                textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 6, lineHeight: 1.2,
              }}>
                {h.name}
              </div>
            )}
            <div style={{ fontSize: 12.5, color: C.mutedGreen, marginTop: 3 }}>
              Par {h.par} · {h.m} m · <span style={{ color: C.dim }}>Index {h.si}</span>
            </div>
          </div>
          <Arrow dir="right" disabled={hole === 17} onClick={() => setHole((x) => Math.min(17, x + 1))} />
        </div>

        {h.note && (
          <div style={{ marginTop: 12 }}>
            <button onClick={() => setShowNote((v) => !v)} style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
              width: "100%", padding: "7px 0", cursor: "pointer",
              background: "none", border: "none",
              color: C.mutedGreen, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}>
              Om hålet
              <ChevronDown size={13} strokeWidth={2.4} style={{
                transform: showNote ? "rotate(180deg)" : "none", transition: "transform .15s",
              }} />
            </button>
            {showNote && (
              <p style={{
                fontSize: 12.5, lineHeight: 1.75, color: C.mutedGreen,
                margin: "4px 4px 0", textAlign: "left",
              }}>
                {h.note}
              </p>
            )}
          </div>
        )}

        {/* Hole strip — shows your own progress */}
        <div style={{ display: "flex", gap: 3, marginTop: 14, justifyContent: "center", flexWrap: "wrap" }}>
          {round.holes.map((hh, i) => {
            const s = scores[me][i].s;
            const d = s == null ? null : s - hh.par;
            const b = d == null ? null : SCORE[scoreBand(d)];
            /* Rutan är för liten för ramar — formen kodas i stället
               med hörnradien: rund för birdie och bättre, mjukt
               rundad för par, skarp för bogey och sämre. */
            const radius = b == null ? 3
              : b.shape.startsWith("circle") ? "50%"
              : b.shape === "none" ? 3 : 0;
            return (
              <button key={i} onClick={() => setHole(i)} style={{
                width: 15, height: 20, borderRadius: i === hole ? 3 : radius,
                border: "none", cursor: "pointer", padding: 0,
                background: i === hole ? C.gold : b == null ? "rgba(255,255,255,0.09)" : b.c,
                fontSize: 8.5, fontWeight: 700,
                color: i === hole ? C.fairwayDark : b == null ? "rgba(10,42,33,0.75)" : b.ink,
                fontFamily: MONO,
              }}>{i + 1}</button>
            );
          })}
        </div>
      </div>

      <a href={round.guideUrl} target="_blank" rel="noopener noreferrer" style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
        marginBottom: 14, fontSize: 11.5, color: C.dim, textDecoration: "none",
      }}>
        Hålkarta hos {round.short_course} <ExternalLink size={11} />
      </a>

      {showHalfway && <HalfwayNote onClose={closeHalfway} />}

      {ordered.map((p) => (
        <Card
          key={p.id}
          player={p}
          isMe={p.id === me}
          st={scores[p.id][hole]}
          par={h.par}
          onSet={(f, v) => set(roundId, p.id, hole, f, v)}
          onDone={() => hole < 17 && setHole(hole + 1)}
          beers={beers[p.id]}
          onBeer={() => onBeer(p.id)}
          onUndoBeer={() => onUndoBeer(p.id)}
        />
      ))}
    </div>
  );
}

const clock = (ts) => {
  const d = new Date(ts);
  return Number.isNaN(d.getTime())
    ? null
    : d.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
};

/* =========================================================
   HALVVÄGSNOTIS

   Aloha har halvvägshus efter hål 9, Santana inte. Notisen dyker upp
   när den inloggade spelaren fyllt i hål 8 — hålet är avklarat och
   pausen ligger runt hörnet. Visas en gång per runda och enhet.
   ========================================================= */

const HALFWAY_KEY = "loscuatro-halfway-v1";

function useHalfwayNotice(roundId, active, hole8, hole) {
  const [showFor, setShowFor] = useState(null);

  useEffect(() => {
    if (!active || hole8 == null) return;
    /* Bara i själva ögonblicket runt hål 9 — inte när man bläddrar
       tillbaka i en färdigspelad runda. */
    if (hole < 7 || hole > 8) return;

    let seen;
    try { seen = JSON.parse(localStorage.getItem(HALFWAY_KEY) || "[]"); } catch { seen = []; }
    if (!Array.isArray(seen)) seen = [];
    if (seen.includes(roundId)) return;

    try { localStorage.setItem(HALFWAY_KEY, JSON.stringify([...seen, roundId])); } catch { /* privat läge */ }
    setShowFor(roundId);
  }, [roundId, active, hole8, hole]);

  return [showFor === roundId, () => setShowFor(null)];
}

function HalfwayNote({ onClose }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10, marginBottom: 12,
      background: "rgba(255,255,255,0.05)", border: `1px solid ${C.line}`,
      borderRadius: 12, padding: "10px 12px",
    }}>
      <Coffee size={15} color={C.goldBright} strokeWidth={2.3} style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, fontSize: 11.5, color: C.mutedGreen, lineHeight: 1.5 }}>
        Halvvägshuset ligger efter hål 9.
      </div>
      <button onClick={onClose} aria-label="Stäng" style={{
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        width: 26, height: 26, borderRadius: 8, border: "none", cursor: "pointer",
        background: "rgba(255,255,255,0.07)", color: C.mutedGreen,
      }}>
        <X size={13} strokeWidth={2.6} />
      </button>
    </div>
  );
}

function Arrow({ dir, disabled, onClick }) {
  const I = dir === "left" ? ChevronLeft : ChevronRight;
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: 42, height: 42, borderRadius: "50%", border: `1px solid ${C.line}`,
      background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center",
      justifyContent: "center", cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.25 : 1,
    }}>
      <I size={20} color={C.paper} />
    </button>
  );
}

/* Score labels relative to par */
function scoreLabel(d) {
  if (d <= -2) return "Eagle";
  if (d === -1) return "Birdie";
  if (d === 0) return "Par";
  if (d === 1) return "Bogey";
  if (d === 2) return "Dubbel";
  return `+${d}`;
}

function Card({ player, isMe, st, par, onSet, onDone, beers, onBeer, onUndoBeer }) {
  const [expanded, setExpanded] = useState(isMe);
  const [free, setFree] = useState(null);
  const quick = [par - 1, par, par + 1, par + 2];

  return (
    <div style={{
      background: C.paper, borderRadius: 14, marginBottom: 11,
      borderLeft: `4px solid ${player.color}`,
      boxShadow: isMe ? `0 0 0 1.5px ${C.gold}` : "none",
    }}>
      {/* Row header */}
      <button
        onClick={() => setExpanded((e) => !e)}
        style={{
          display: "flex", alignItems: "center", gap: 10, width: "100%",
          padding: "13px 15px", background: "none", border: "none", cursor: "pointer",
        }}
      >
        <span style={{ fontWeight: 800, fontSize: 15, color: C.ink, flex: 1, textAlign: "left" }}>
          {player.name}
          {isMe && <span style={{ fontSize: 9.5, color: C.gold, marginLeft: 7, letterSpacing: "0.08em" }}>DU</span>}
        </span>
        {st.s != null && (
          <span style={{
            fontFamily: MONO, fontSize: 11, fontWeight: 700, color: C.muted,
          }}>
            {scoreLabel(st.s - par)}
          </span>
        )}
        <span style={{
          fontFamily: MONO, fontSize: 22, fontWeight: 700, minWidth: 26, textAlign: "center",
          color: st.s == null ? "#BDB699" : SCORE[scoreBand(st.s - par)].text,
        }}>
          {st.s ?? "–"}
        </span>
        <ChevronDown size={15} color={C.muted} style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
      </button>

      {expanded && (
        <div style={{ padding: "0 15px 15px" }}>
          {/* Quick score chips */}
          <div style={{ display: "flex", gap: 6, marginBottom: 9 }}>
            {quick.map((v) => {
              const on = st.s === v;
              const d = v - par;
              const b = SCORE[scoreBand(d)];
              return (
                <button key={v} onClick={() => { onSet("s", v); setFree(null); }} style={{
                  flex: 1, padding: "11px 0", borderRadius: 10, border: "none", cursor: "pointer",
                  background: on ? b.c : C.paperDark,
                  color: on ? b.ink : C.muted, fontSize: 12, fontWeight: 800, lineHeight: 1.3,
                  /* Par-bandet är pappersfärgat och skulle försvinna mot
                     kortet — markeringen av vald knapp ligger därför i
                     konturen, lika för alla band. */
                  boxShadow: on ? `0 0 0 2px ${b.ink}` : "none",
                }}>
                  <div style={{
                    position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center",
                    minWidth: 24, height: 20, fontFamily: MONO, fontSize: 15,
                  }}>
                    {on && <ScoreMark shape={b.shape} ink={b.ink} pad={0} radius={3} />}
                    <span style={{ position: "relative" }}>{v}</span>
                  </div>
                  <div style={{ fontSize: 9, opacity: 0.85, marginTop: 1 }}>{scoreLabel(d)}</div>
                </button>
              );
            })}
            <FreeBtn
              active={free === "s" || (st.s != null && !quick.includes(st.s))}
              onClick={() => setFree(free === "s" ? null : "s")}
              value={st.s != null && !quick.includes(st.s) ? st.s : null}
            />
          </div>

          {free === "s" && (
            <FreeInput
              label="Antal slag"
              value={st.s ?? par}
              min={1}
              onSet={(v) => onSet("s", v)}
              onClose={() => setFree(null)}
            />
          )}

          {/* Putts */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 9 }}>
            <span style={{ fontSize: 10.5, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", width: 46 }}>
              Puttar
            </span>
            {[0, 1, 2, 3].map((v) => (
              <button key={v} onClick={() => { onSet("p", st.p === v ? null : v); setFree(null); }} style={{
                flex: 1, padding: "9px 0", borderRadius: 9, border: "none", cursor: "pointer",
                background: st.p === v ? C.ink : C.paperDark, color: st.p === v ? C.paper : C.muted,
                fontFamily: MONO, fontSize: 13, fontWeight: 700,
              }}>{v}</button>
            ))}
            <FreeBtn
              small
              active={free === "p" || (st.p != null && st.p > 3)}
              onClick={() => setFree(free === "p" ? null : "p")}
              value={st.p != null && st.p > 3 ? st.p : null}
            />
          </div>

          {free === "p" && (
            <FreeInput
              label="Antal puttar"
              value={st.p ?? 2}
              min={0}
              onSet={(v) => onSet("p", v)}
              onClose={() => setFree(null)}
            />
          )}

          {/* GIR / Fairway */}
          <div style={{ display: "flex", gap: 6 }}>
            <Check2 label="GIR" on={st.gir === true} onToggle={() => onSet("gir", st.gir === true ? null : true)} />
            {par !== 3
              ? <Check2 label="Fairway" on={st.fw === true} onToggle={() => onSet("fw", st.fw === true ? null : true)} />
              : <div style={{ flex: 1 }} />}
          </div>

          {/* Öl */}
          <BeerRow list={beers} onAdd={onBeer} onUndo={onUndoBeer} />

          {isMe && st.s != null && (
            <button onClick={onDone} style={{
              width: "100%", marginTop: 11, padding: "11px 0", borderRadius: 10, border: "none",
              background: C.fairway, color: C.paper, fontSize: 12.5, fontWeight: 800,
              letterSpacing: "0.04em", textTransform: "uppercase", cursor: "pointer",
            }}>
              Nästa hål →
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   ÖLRADEN

   Sitter i spelarkortet under GIR/Fairway och gäller kortets
   spelare — inte den inloggade. Öl loggas alltså åt en kompis
   på samma sätt som slag och puttar. Ett tryck loggar en öl på
   det hål man står på; flera tryck på samma hål är tillåtet.
   ========================================================= */

function BeerRow({ list, onAdd, onUndo }) {
  const [flash, setFlash] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const last = list.length ? list[list.length - 1] : null;
  const time = last?.ts ? clock(last.ts) : null;

  const add = () => {
    onAdd();
    setFlash(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setFlash(false), 1000);
  };

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 6,
      margin: "9px -5px 0", padding: "4px 5px", borderRadius: 10,
      background: flash ? "rgba(228,193,61,0.38)" : "transparent",
      transition: "background .3s ease",
    }}>
      <span style={{
        fontSize: 10.5, fontWeight: 800, color: C.muted, textTransform: "uppercase",
        letterSpacing: "0.07em", width: 46, flexShrink: 0,
      }}>
        Öl
      </span>

      <button onClick={add} style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 6, flexShrink: 0,
        background: C.goldBright, color: C.fairwayDark, border: "none", borderRadius: 9,
        padding: "9px 13px", fontFamily: MONO, fontSize: 13, fontWeight: 700, cursor: "pointer",
      }}>
        <span style={{ fontSize: 15, lineHeight: 1 }}>🍺</span> {list.length}
      </button>

      <span style={{ flex: 1, minWidth: 0, fontSize: 10.5, color: C.muted }}>
        {last ? `Senast hål ${last.hole}${time ? ` · ${time}` : ""}` : ""}
      </span>

      {list.length > 0 && (
        <button onClick={onUndo} style={{
          display: "flex", alignItems: "center", gap: 5, flexShrink: 0,
          background: C.paperDark, color: C.muted, border: "none", borderRadius: 9,
          padding: "8px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer",
        }}>
          <Undo2 size={12} strokeWidth={2.4} /> Ångra
        </button>
      )}
    </div>
  );
}

function Check2({ label, on, onToggle }) {
  return (
    <button onClick={onToggle} style={{
      flex: 1, display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
      background: on ? C.green : C.paperDark, border: "none", borderRadius: 9, padding: "9px 11px",
    }}>
      <span style={{
        width: 19, height: 19, borderRadius: 5, flexShrink: 0,
        border: on ? "none" : `1.5px solid rgba(0,0,0,0.2)`,
        background: on ? "rgba(255,255,255,0.22)" : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {on && <Check size={13} color={C.paper} strokeWidth={3.5} />}
      </span>
      <span style={{
        fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em",
        color: on ? C.paper : C.muted,
      }}>{label}</span>
    </button>
  );
}

function FreeBtn({ active, onClick, value, small }) {
  return (
    <button onClick={onClick} style={{
      width: small ? undefined : 46, flex: small ? 1 : undefined,
      padding: small ? "9px 0" : undefined,
      borderRadius: small ? 9 : 10,
      border: active ? "none" : `1px dashed rgba(0,0,0,0.18)`,
      background: active ? C.ink : "transparent",
      color: active ? C.paper : C.muted, cursor: "pointer",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: MONO, fontSize: 13, fontWeight: 700,
    }}>
      {value != null ? value : "···"}
    </button>
  );
}

function FreeInput({ label, value, min, onSet, onClose }) {
  const [v, setV] = useState(value);
  const commit = (n) => { const c = Math.max(min, n); setV(c); onSet(c); };
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10, marginBottom: 9,
      background: C.paperInput, border: `1px solid ${C.paperDark}`, borderRadius: 10, padding: "9px 11px",
    }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: C.muted, flex: 1 }}>{label}</span>
      <button onClick={() => commit(v - 1)} style={roundBtn}><Minus size={14} /></button>
      <input
        type="number"
        inputMode="numeric"
        value={v}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10);
          if (!Number.isNaN(n)) commit(n); else setV("");
        }}
        style={{
          width: 48, textAlign: "center", fontFamily: MONO, fontSize: 17, fontWeight: 700,
          color: C.ink, border: `1px solid ${C.paperDark}`, borderRadius: 7, padding: "5px 0",
          background: "#fff", outline: "none",
        }}
      />
      <button onClick={() => commit((v || min) + 1)} style={roundBtn}><Plus size={14} /></button>
      <button onClick={onClose} style={{
        border: "none", background: C.fairway, color: C.paper, borderRadius: 7,
        padding: "7px 12px", fontSize: 11, fontWeight: 800, cursor: "pointer",
      }}>Klar</button>
    </div>
  );
}

const roundBtn = {
  width: 28, height: 28, borderRadius: "50%", border: `1px solid ${C.paperDark}`,
  background: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
  cursor: "pointer", color: C.ink, flexShrink: 0,
};

/* =========================================================
   BERÄKNINGAR
   ========================================================= */

/* =========================================================
   LEADERBOARD
   ========================================================= */

/* =========================================================
   SCOREKORT

   Nås bara från Leaderboard — ingen egen flik. All data finns
   redan; här räknas den bara om per runda och spelare.

   Rutnätet är två block om nio hål i stället för ett om arton.
   Det är det som gör att kortet ryms på en telefon utan vare sig
   sidoscroll eller hopfällda rader: elva kolumner i stället för
   tjugo ger ungefär 25 px per hålruta vid 360 px skärm.
   ========================================================= */

/* Exempelsiffror till teckenförklaringen: formen ska synas, inte
   siffran i sig. */
const DIST_ROWS = SCORE_ORDER.map((k, i) => ({
  k, t: SCORE[k].t, c: SCORE[k].c, d: [-2, -1, 0, 1, 2][i],
}));

/* Ett niohålsblock. Rutnätet är en grid så att alla sju raderna
   ligger i lod — hålkolumnerna delar bredden lika.

   GIR, fairway och puttar ritas alltid, även när ingenting är
   ifyllt. Ett tomt hål får streck, och saknas hela raden i blocket
   får summan streck den med. Att dölja raden skulle se ut som att
   måttet inte finns; strecket säger att det inte är inrapporterat. */
function CardNine({ title, holes, hs }) {
  const cell = {
    display: "flex", alignItems: "center", justifyContent: "center",
    height: 24, fontFamily: MONO, fontSize: 11,
  };
  const label = {
    display: "flex", alignItems: "center", height: 24,
    fontSize: 9.5, fontWeight: 800, color: C.mutedGreen,
    textTransform: "uppercase", letterSpacing: "0.07em",
  };
  const blank = <span style={{ color: "rgba(243,238,221,0.3)" }}>–</span>;
  const sumCell = { ...cell, color: C.mutedGreen, fontWeight: 700 };

  const anyScore = hs.some((h) => h.s != null);
  const anyGir = hs.some((h) => h.gir != null);
  const anyFw = hs.some((h) => h.par !== 3 && h.fw != null);
  const anyPutt = hs.some((h) => h.p != null);

  return (
    <div style={{
      display: "grid", gridTemplateColumns: "52px repeat(9, 1fr) 30px",
      gap: 2, marginBottom: 12,
    }}>
      {/* Hål */}
      <div style={label}>Hål</div>
      {holes.map((h) => (
        <div key={h.hole} style={{ ...cell, color: C.paper, fontWeight: 700 }}>{h.hole}</div>
      ))}
      <div style={{ ...cell, color: C.gold, fontWeight: 700, fontSize: 10 }}>{title}</div>

      {/* Index */}
      <div style={label}>Index</div>
      {holes.map((h) => (
        <div key={h.hole} style={{ ...cell, color: C.dim, fontSize: 10 }}>{h.si}</div>
      ))}
      <div style={{ ...cell, color: C.dim }}>—</div>

      {/* Par */}
      <div style={label}>Par</div>
      {holes.map((h) => (
        <div key={h.hole} style={{ ...cell, color: C.mutedGreen }}>{h.par}</div>
      ))}
      <div style={{ ...cell, color: C.mutedGreen, fontWeight: 700 }}>
        {holes.reduce((s, h) => s + h.par, 0)}
      </div>

      {/* Resultat */}
      <div style={{ ...label, color: C.paper }}>Res</div>
      {hs.map((h, i) => (
        h.s == null
          ? <div key={i} style={{
              ...cell, color: "rgba(243,238,221,0.3)",
              background: "rgba(255,255,255,0.04)", borderRadius: 4,
            }}>–</div>
          : <ScoreBox key={i} d={h.s - h.par} value={h.s} height={24} fontSize={11.5} />
      ))}
      <div style={{ ...cell, color: C.paper, fontWeight: 700 }}>
        {anyScore ? hs.reduce((s, h) => s + (h.s || 0), 0) : blank}
      </div>

      {/* GIR */}
      <div style={label}>GIR</div>
      {hs.map((h, i) => (
        <div key={"g" + i} style={cell}>
          {h.gir === true ? <Check size={12} color="#6FBE8F" strokeWidth={3.4} /> : blank}
        </div>
      ))}
      <div style={sumCell}>{anyGir ? hs.filter((h) => h.gir === true).length : blank}</div>

      {/* Fairway — måttet finns inte på par 3 */}
      <div style={label}>Fway</div>
      {hs.map((h, i) => (
        <div key={"f" + i} style={cell}>
          {h.par === 3
            ? <span style={{ color: C.dim }}>—</span>
            : h.fw === true
              ? <Check size={12} color="#6FBE8F" strokeWidth={3.4} />
              : blank}
        </div>
      ))}
      <div style={sumCell}>
        {anyFw ? hs.filter((h) => h.par !== 3 && h.fw === true).length : blank}
      </div>

      {/* Puttar */}
      <div style={label}>Puttar</div>
      {hs.map((h, i) => (
        <div key={"p" + i} style={cell}>
          {h.p != null ? <span style={{ color: C.mutedGreen }}>{h.p}</span> : blank}
        </div>
      ))}
      <div style={sumCell}>
        {anyPutt ? hs.reduce((s, h) => s + (h.p || 0), 0) : blank}
      </div>
    </div>
  );
}

function StatRow({ k, v, sub }) {
  return (
    <div style={{
      display: "flex", alignItems: "baseline", gap: 10,
      padding: "9px 0", borderTop: `1px solid ${C.line}`,
    }}>
      <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: C.mutedGreen }}>{k}</span>
      <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: C.paper }}>{v}</span>
      {sub && <span style={{ fontFamily: MONO, fontSize: 11, color: C.dim, width: 60, textAlign: "right", whiteSpace: "nowrap" }}>{sub}</span>}
    </div>
  );
}

function StatHead({ children }) {
  return (
    <div style={{
      fontSize: 9.5, fontWeight: 800, color: C.gold, textTransform: "uppercase",
      letterSpacing: "0.18em", margin: "22px 0 4px",
    }}>{children}</div>
  );
}

/* Scoringfördelningen som en vågrät stapel i resultatradens färger.
   Varje segments bredd är antalet hål, och antalet står i segmentet.
   Teckenförklaringen visar formkonventionen, så stapeln går att läsa
   som samma information som resultatraden — bara sammanfattad. */
function DistBar({ dist, played }) {
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{
        display: "flex", height: 22, borderRadius: 6, overflow: "hidden", gap: 1,
        background: "rgba(255,255,255,0.04)",
      }}>
        {DIST_ROWS.filter((d) => dist[d.k] > 0).map((d) => (
          <div key={d.k} style={{
            flex: dist[d.k], minWidth: 0, background: d.c,
            display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
          }}>
            <span style={{
              fontFamily: MONO, fontSize: 10.5, fontWeight: 700,
              color: SCORE[d.k].ink,
            }}>{dist[d.k]}</span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", marginTop: 10 }}>
        {DIST_ROWS.map((d) => (
          <div key={d.k} style={{ display: "flex", alignItems: "center", gap: 6, opacity: dist[d.k] ? 1 : 0.45 }}>
            <span style={{ width: 18, flexShrink: 0 }}>
              <ScoreBox d={d.d} value="" height={16} fontSize={9} radius={3} pad={1.5} />
            </span>
            <span style={{ fontSize: 11.5, color: C.mutedGreen }}>{d.t}</span>
            <span style={{ fontFamily: MONO, fontSize: 11.5, fontWeight: 700, color: C.paper }}>
              {played ? dist[d.k] : "–"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const two = (n) => n.toFixed(2).replace(".", ",");

/* Streck, inte noll, när underlaget saknas. */
const DASH = "–";
const share = (x) => (x ? `${x.ok} av ${x.of}` : DASH);
const sharePct = (x) => (x ? `${Math.round((x.ok / x.of) * 100)} %` : DASH);

function Scorecard({ scores, playerId, roundId, onPickPlayer, onPickRound, onBack }) {
  const round = ROUNDS.find((r) => r.id === roundId);
  const player = PLAYERS.find((p) => p.id === playerId);
  const holes = scores[roundId][playerId];

  const st = useMemo(() => cardStats(round, holes), [round, holes]);
  const hs = holes.map((h, i) => ({ ...round.holes[i], ...h }));

  return (
    <div style={{ padding: "18px 16px 60px" }}>
      <button onClick={onBack} style={{
        display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer",
        background: "rgba(255,255,255,0.05)", border: `1px solid ${C.line}`, borderRadius: 20,
        color: C.mutedGreen, fontSize: 12, fontWeight: 700, padding: "9px 15px", marginBottom: 16,
      }}>
        <ChevronLeft size={14} strokeWidth={2.4} /> Leaderboard
      </button>

      {/* Spelarväxlare — man vill titta på de andras kort direkt. */}
      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        {PLAYERS.map((p) => {
          const on = p.id === playerId;
          return (
            <button key={p.id} onClick={() => onPickPlayer(p.id)} style={{
              flex: 1, minWidth: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
              padding: "9px 4px", borderRadius: 10, border: "none", cursor: "pointer",
              background: on ? C.paper : "rgba(255,255,255,0.05)",
              color: on ? C.ink : C.mutedGreen, fontSize: 11.5, fontWeight: 700,
            }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
            </button>
          );
        })}
      </div>

      <DayPills value={roundId} onChange={onPickRound} />

      <div style={{ marginBottom: 14 }}>
        <div style={{
          fontFamily: DISPLAY, fontSize: 22, fontWeight: 700, color: C.paper,
          textTransform: "uppercase", letterSpacing: "0.04em", lineHeight: 1.15,
        }}>
          {player.name}
        </div>
        <div style={{ fontSize: 11.5, color: C.mutedGreen, marginTop: 2 }}>
          {round.day} {round.date} · {round.short_course}
        </div>
      </div>

      <div style={{
        background: "rgba(255,255,255,0.04)", border: `1px solid ${C.line}`,
        borderRadius: 14, padding: "12px 10px 4px",
      }}>
        <CardNine title="Ut" holes={round.holes.slice(0, 9)} hs={hs.slice(0, 9)} />
        <CardNine title="In" holes={round.holes.slice(9)} hs={hs.slice(9)} />

        <div style={{
          display: "flex", gap: 8, padding: "11px 2px 12px", borderTop: `1px solid ${C.line}`,
        }}>
          {[
            { k: "Ut", v: st.out, par: st.parOut },
            { k: "In", v: st.in, par: st.parIn },
            { k: "Totalt", v: st.total, par: st.parOut + st.parIn },
          ].map((x) => (
            <div key={x.k} style={{ flex: 1, textAlign: "center" }}>
              <div style={{
                fontSize: 9.5, color: C.mutedGreen, textTransform: "uppercase", letterSpacing: "0.12em",
              }}>{x.k}</div>
              <div style={{
                fontFamily: MONO, fontSize: 19, fontWeight: 700, color: C.paper, marginTop: 3,
              }}>{x.v ? x.v.strokes : "–"}</div>
              <div style={{
                fontFamily: MONO, fontSize: 11, fontWeight: 700, marginTop: 1,
                color: x.v ? parColor(x.v.toPar) : C.dim,
              }}>{x.v ? fmtPar(x.v.toPar) : "–"}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Alla rader ritas alltid, med streck när underlaget saknas.
          Ingen rad försvinner för att den är tom. */}
      <StatHead>Grunddata</StatHead>
      <StatRow k="Score" v={st.total ? st.total.strokes : DASH} sub={st.total ? fmtPar(st.total.toPar) : DASH} />
      <StatRow k="Ut" v={st.out ? st.out.strokes : DASH} sub={st.out ? fmtPar(st.out.toPar) : DASH} />
      <StatRow k="In" v={st.in ? st.in.strokes : DASH} sub={st.in ? fmtPar(st.in.toPar) : DASH} />
      <StatRow k="Greens in regulation" v={share(st.gir)} sub={sharePct(st.gir)} />
      <StatRow k="Fairwayträffar" v={share(st.fw)} sub={sharePct(st.fw)} />
      <StatRow
        k="Puttar"
        v={st.putts ? st.putts.total : DASH}
        sub={st.putts ? `${two(st.putts.total / st.putts.holes)}/hål` : DASH}
      />

      <StatHead>Scoringfördelning</StatHead>
      <DistBar dist={st.dist} played={st.played} />

      <StatHead>Fördjupning</StatHead>
      <StatRow
        k="Puttar per träffad green"
        v={st.puttsPerGir ? two(st.puttsPerGir.avg) : DASH}
        sub={st.puttsPerGir ? `${st.puttsPerGir.holes} hål` : DASH}
      />
      <StatRow k="Par eller bättre vid GIR" v={share(st.girSaved)} sub={sharePct(st.girSaved)} />
      <StatRow k="Par eller bättre vid fairwayträff" v={share(st.fwSaved)} sub={sharePct(st.fwSaved)} />
      <StatRow k="Räddade par" v={share(st.scrambling)} sub={sharePct(st.scrambling)} />
    </div>
  );
}

function Leaderboard({ scores, me, onOpenCard }) {
  const [view, setView] = useState("all");

  const rows = useMemo(() => leaderboardRows(ROUNDS, scores, view), [scores, view]);

  const live = rows.some((r) => r.played > 0);
  const lead = live ? rows[0].toPar : 0;

  return (
    <div style={{ padding: "20px 16px 60px" }}>
      <Head icon={Trophy} title="Leaderboard" sub="Tryck på en spelare för scorekortet" />
      <DayPills value={view} onChange={setView} includeAll />

      {!live && <Empty text="Inga slag inrapporterade än." />}

      {live && (
        <>
          <Podium rows={rows.filter((r) => r.played > 0).slice(0, 3)} />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {rows.map((r, i) => (
              <Row
                key={r.id} r={r} pos={i + 1} lead={lead}
                isMe={r.id === me} showPer={view === "all"}
                onOpen={() => onOpenCard(r.id, view)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Podium({ rows }) {
  if (rows.length < 2) return null;
  const order = [rows[1], rows[0], rows[2]].filter(Boolean);
  const heights = { 0: 54, 1: 74, 2: 42 };
  const place = (r) => rows.indexOf(r) + 1;

  return (
    <div style={{
      display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 10,
      marginBottom: 20, padding: "16px 8px 0",
      background: "rgba(255,255,255,0.035)", border: `1px solid ${C.line}`, borderRadius: 14,
    }}>
      {order.map((r, idx) => {
        const p = place(r);
        return (
          <div key={r.id} style={{ flex: 1, maxWidth: 96, textAlign: "center" }}>
            <div style={{
              width: 34, height: 34, borderRadius: "50%", margin: "0 auto 7px",
              background: r.color, display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: DISPLAY, fontSize: 17, fontWeight: 700, color: C.fairwayDark,
              border: p === 1 ? `2.5px solid ${C.goldBright}` : "none",
            }}>
              {r.name[0]}
            </div>
            <div style={{ fontSize: 11.5, fontWeight: 700, marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {r.name}
            </div>
            <div style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: parColor(r.toPar), marginBottom: 6 }}>
              {fmtPar(r.toPar)}
            </div>
            <div style={{
              height: heights[idx], borderRadius: "8px 8px 0 0",
              background: p === 1 ? C.gold : "rgba(255,255,255,0.09)",
              display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 6,
              fontFamily: DISPLAY, fontSize: 19, fontWeight: 700,
              color: p === 1 ? C.fairwayDark : C.mutedGreen,
            }}>
              {p}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Row({ r, pos, lead, isMe, showPer, onOpen }) {
  const gap = r.played > 0 ? r.toPar - lead : null;
  return (
    <div
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(); } }}
      style={{
        background: pos === 1 && r.played > 0 ? C.gold : C.paper,
        borderRadius: 12, padding: "12px 14px", opacity: r.played ? 1 : 0.45,
        boxShadow: isMe ? `0 0 0 1.5px ${C.goldBright}` : "none",
        cursor: "pointer",
      }}>
      <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
        <div style={{
          fontFamily: DISPLAY, fontSize: 19, fontWeight: 700, width: 20,
          color: pos === 1 && r.played ? C.fairwayDark : C.muted,
        }}>{pos}</div>
        <div style={{ width: 9, height: 9, borderRadius: "50%", background: r.color, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 14.5, color: C.ink }}>{r.name}</div>
          <div style={{ fontSize: 10.5, color: C.muted, marginTop: 1 }}>
            {r.played}/{r.max} hål
            {r.birdies > 0 && ` · ${r.birdies} birdie${r.birdies > 1 ? "s" : ""}`}
            {gap != null && gap > 0 && ` · ${gap > 0 ? "+" : ""}${gap} till ledning`}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{
            fontFamily: MONO, fontSize: 15, fontWeight: 700,
            color: r.played ? parInk(r.toPar) : C.muted,
          }}>
            {r.played ? fmtPar(r.toPar) : "–"}
          </div>
          <div style={{ fontFamily: MONO, fontSize: 11, color: C.muted }}>
            {r.played ? r.strokes : ""}
          </div>
        </div>
        <ChevronRight size={15} color={pos === 1 && r.played > 0 ? "rgba(10,42,33,0.5)" : C.muted} strokeWidth={2.4} style={{ flexShrink: 0, marginLeft: 2 }} />
      </div>

      {showPer && r.played > 0 && (
        <div style={{ display: "flex", gap: 6, marginTop: 10, paddingTop: 9, borderTop: `1px solid ${C.paperDark}` }}>
          {r.per.map((x) => (
            <div key={x.id} style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: 9, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em" }}>{x.short}</div>
              <div style={{
                fontFamily: MONO, fontSize: 12, fontWeight: 700, marginTop: 1,
                color: !x.played ? "#BDB699" : parInk(x.toPar),
              }}>
                {x.played ? fmtPar(x.toPar) : "–"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   DREAM 18
   ========================================================= */

function Dream18({ scores, me }) {
  const rows = useMemo(() => dream18Rows(ROUNDS, scores), [scores]);

  const live = rows.some((r) => r.filled > 0);

  return (
    <div style={{ padding: "20px 16px 60px" }}>
      <Head icon={Star} title="Dream 18" sub="Din lägsta score per hålnummer, från valfri dag" />
      {!live && <Empty text="Spela in några hål så byggs drömrundan ihop automatiskt." />}
      {rows.map((r, i) => (
        <div key={r.id} style={{
          background: i === 0 && r.filled ? C.gold : C.paper, borderRadius: 14,
          padding: "13px 15px", marginBottom: 10, opacity: r.filled ? 1 : 0.45,
          boxShadow: r.id === me ? `0 0 0 1.5px ${C.goldBright}` : "none",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: r.filled ? 11 : 0 }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 18, fontWeight: 700, width: 18, color: i === 0 && r.filled ? C.fairwayDark : C.muted }}>{i + 1}</div>
            <div style={{ width: 9, height: 9, borderRadius: "50%", background: r.color }} />
            <div style={{ flex: 1, fontWeight: 800, fontSize: 14.5, color: C.ink }}>{r.name}</div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: MONO, fontSize: 19, fontWeight: 700, color: C.ink }}>{r.filled ? r.total : "–"}</div>
              <div style={{ fontSize: 9.5, color: C.muted }}>{r.filled}/18 hål</div>
            </div>
          </div>
          {r.filled > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
              {r.best.map((v, hi) => (
                <div key={hi} style={{
                  width: 23, height: 23, borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center",
                  background: v != null ? "rgba(0,0,0,0.07)" : "transparent",
                  border: v == null ? `1px dashed rgba(0,0,0,0.13)` : "none",
                  fontFamily: MONO, fontSize: 10.5, fontWeight: 700, color: C.ink,
                }}>{v ?? ""}</div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* =========================================================
   AWARDS
   ========================================================= */

const AWARDS = [
  { k: "comeback", t: "Comeback King", i: TrendingUp, d: "Störst förbättring hål till hål", v: (s) => `${s.comeback} slag bättre` },
  { k: "consistency", t: "Mr Consistency", i: Activity, d: "Jämnast spel", v: (s) => `±${s.consistency.toFixed(1)}` },
  { k: "clutch", t: "Ice Man", i: Zap, d: "Starkast avslutning", v: (s) => `${s.clutch.toFixed(1)} bättre sista 3` },
  { k: "gir", t: "Iron Man", i: Target, d: "Flest greens in regulation", v: (s) => `${s.gir} GIR` },
  { k: "fw", t: "Fairway Finder", i: Wind, d: "Flest fairwayträffar", v: (s) => `${s.fw} träffar` },
  { k: "putts", t: "Putting Wizard", i: Circle, d: "Minst antal puttar", v: (s) => `${s.putts} puttar` },
  { k: "scr", t: "Houdini", i: Users, d: "Flest räddade par", v: (s) => `${s.scr} av ${s.scrOpp}` },
  { k: "streak", t: "Streak Master", i: Flag, d: "Flest hål i rad utan dubbel+", v: (s) => `${s.streak} hål` },
  { k: "birdies", t: "Birdie Machine", i: Trophy, d: "Flest birdies eller bättre", v: (s) => `${s.birdies} st` },
  { k: "optimizer", t: "The Optimizer", i: Star, d: "Bäst trend per öl", v: (s) => slopeText(s.optimizer) },
];

function Awards({ scores, beers }) {
  const [view, setView] = useState("all");
  const rounds = view === "all" ? ROUNDS : ROUNDS.filter((r) => r.id === view);
  const res = useMemo(() => computeAwards(rounds, scores, beers), [rounds, scores, beers]);
  const live = rounds.some((r) => Object.values(scores[r.id]).some((hs) => hs.some((h) => h.s != null)));

  return (
    <div style={{ padding: "20px 16px 60px" }}>
      <Head icon={Award} title="Awards" sub={view === "all" ? "Hela resan" : "Vald dag"} />
      <DayPills value={view} onChange={setView} includeAll />
      {!live && <Empty text="Rapportera in några hål så dyker utmärkelserna upp." />}
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {AWARDS.map((a) => {
          const w = res[a.k], I = a.i;
          return (
            <div key={a.k} style={{
              display: "flex", alignItems: "center", gap: 13,
              background: w ? C.paper : "rgba(255,255,255,0.035)",
              border: w ? "none" : `1px dashed ${C.line}`,
              borderRadius: 13, padding: "13px 14px",
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 11, flexShrink: 0,
                background: w ? C.fairway : "rgba(255,255,255,0.05)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <I size={19} color={w ? C.goldBright : C.dim} strokeWidth={2.2} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 13.5, color: w ? C.ink : C.mutedGreen }}>{a.t}</div>
                <div style={{ fontSize: 11, color: w ? C.muted : C.dim, marginTop: 1 }}>{a.d}</div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0, maxWidth: 132 }}>
                {w ? (
                  <>
                    {(w.winners || [w.p]).map((p) => (
                      <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
                        <span style={{ fontWeight: 800, fontSize: 12.5, color: C.ink }}>{p.name}</span>
                      </div>
                    ))}
                    <div style={{ fontFamily: MONO, fontSize: 10, color: C.muted, marginTop: 3 }}>
                      {(w.winners || [w.p]).length > 1 ? `delad · ${a.v(w)}` : a.v(w)}
                    </div>
                  </>
                ) : <span style={{ fontSize: 11.5, color: C.dim }}>—</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* =========================================================
   REGLER
   ========================================================= */

const RULES = [
  {
    t: "Comeback King", i: TrendingUp, d: "Störst förbättring hål till hål",
    x: "Mäter din största uppryckning från ett hål till nästa. För varje par av hål jämförs slag över par — går du från trippelbogey till par är svängningen fyra slag. Den bästa positiva svängningen under hela resan räknas.",
  },
  {
    t: "Mr Consistency", i: Activity, d: "Jämnast spel",
    x: "Belönar den som spelar jämnast, inte den som spelar lägst. Vi räknar standardavvikelsen i slag över par över alla dina spelade hål: ju mindre spridning mellan hålen, desto bättre. Minst tre spelade hål krävs.",
  },
  {
    t: "Ice Man", i: Zap, d: "Starkast avslutning",
    x: "Handlar om att hålla ihop slutet. Snittet i slag över par på rundans tre sista spelade hål jämförs med snittet för hela rundan — är avslutningen bättre än helheten ger det plus. Rundan måste ha minst fyra spelade hål, och spelas flera dagar snittas dagarna.",
  },
  {
    t: "Iron Man", i: Target, d: "Flest greens in regulation",
    x: "Green in regulation betyder att bollen ligger på green efter par minus två slag: ett slag på par 3, två på par 4, tre på par 5. Du bockar i GIR själv på varje hål. Flest träffade greener tar utmärkelsen.",
  },
  {
    t: "Fairway Finder", i: Wind, d: "Flest fairwayträffar",
    x: "Räknar hur många gånger du hittar fairway från tee. Par 3-hål räknas inte alls, eftersom man slår mot green direkt — bara par 4 och par 5 är med. Kryssa i Fairway på hålet så räknas träffen.",
  },
  {
    t: "Putting Wizard", i: Circle, d: "Minst antal puttar",
    x: "Lägst totalt antal puttar över de hål där du rapporterat in puttar. Det är summan som räknas och inte snittet, så den som fyller i flest hål samlar också på sig flest puttar. Minst tre hål med puttar krävs för att vara med.",
  },
  {
    t: "Houdini", i: Users, d: "Flest räddade par",
    x: "Scrambling: du missar greenen men räddar ändå par eller bättre. Varje spelat hål utan ibockad GIR räknas som ett räddningsläge, och de du klarar på par eller bättre räknas som lyckade. Flest räddningar vinner.",
  },
  {
    t: "Streak Master", i: Flag, d: "Flest hål i rad utan dubbel+",
    x: "Din längsta obrutna svit av hål utan dubbelbogey eller sämre. Bogey bryter alltså inte sviten — bara dubbel och uppåt gör det. Ett hål utan inrapporterad score nollställer räkningen.",
  },
  {
    t: "Birdie Machine", i: Trophy, d: "Flest birdies eller bättre",
    x: "Flest hål på birdie eller bättre. Eagle och albatross räknas som ett hål var, inte extra — den här handlar om antal, inte om djup. Rakt och enkelt: flest hål under par tar den.",
  },
  {
    t: "The Optimizer", i: Star, d: "Bäst trend per öl",
    x: "Vem påverkas mest positivt av öl — eller minst negativt? Appen räknar ut ditt snitt över par vid varje öl-nivå och drar en trendlinje genom punkterna, viktad efter antal spelade hål per nivå. Kräver spel på minst tre öl-nivåer.",
  },
];

function Rules() {
  return (
    <div style={{ padding: "20px 16px 60px" }}>
      <Head icon={BookOpen} title="Regler" sub="Så räknas de tio utmärkelserna" />

      <div style={{
        background: "rgba(255,255,255,0.05)", border: `1px solid ${C.line}`,
        borderRadius: 12, padding: 14, marginBottom: 16,
      }}>
        <div style={{ fontSize: 12.5, color: C.paper, lineHeight: 1.6 }}>
          Alla tio utmärkelser är positiva. Det finns ingen sämst-kategori.
        </div>
        <div style={{ fontSize: 11.5, color: C.mutedGreen, lineHeight: 1.6, marginTop: 9 }}>
          Leaderboarden är rak bruttoscore, slag för slag. Awards fångar upp allt
          annat: den som puttar bäst, den som räddar par ur buskarna, den som
          aldrig kollapsar. Allt räknas automatiskt på det ni matar in under
          Spela — GIR, fairway och puttar bara om ni bockar i dem. På Awards-sidan
          växlar ni mellan hela resan och en enskild dag.
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {RULES.map((a) => {
          const I = a.i;
          return (
            <div key={a.t} style={{
              background: C.paper, borderRadius: 13, padding: "13px 14px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 11, flexShrink: 0, background: C.fairway,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <I size={19} color={C.goldBright} strokeWidth={2.2} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 13.5, color: C.ink }}>{a.t}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>{a.d}</div>
                </div>
              </div>
              <div style={{
                fontSize: 12, color: C.muted, lineHeight: 1.6, marginTop: 11,
                paddingTop: 10, borderTop: `1px solid ${C.paperDark}`,
              }}>
                {a.x}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* =========================================================
   ÖLKURVAN
   ========================================================= */

const BeerIcon = () => <span style={{ fontSize: 17, lineHeight: 1 }}>🍺</span>;

/* Färg på trenden: nedåt är bra, uppåt är dyrt, platt är platt.
   Samma blå–bärnstensaxel som scoreskalan, inte grönt mot rött. */
const slopeColor = (slope, flat = C.muted) =>
  slope == null || Math.abs(slope) < 0.005 ? flat : slope < 0 ? TOPAR_PAPER.under : TOPAR_PAPER.over;

/* Streckmönster per spelare, i PLAYERS-ordning. Linjerna går att
   följa i grafen även helt utan färg. */
export const LINE_DASH = ["", "7 4", "1.5 4", "9 3 2 3"];
const dashFor = (id) => LINE_DASH[PLAYERS.findIndex((p) => p.id === id)] || "";

/* Teckenförklaringens nyckel ritar spelarens faktiska linje —
   färg plus streckmönster — så den går att para ihop med grafen
   även utan färgseende. */
function LineKey({ id, color }) {
  return (
    <svg width="22" height="9" style={{ flexShrink: 0, overflow: "visible" }} aria-hidden="true">
      <line
        x1="0" y1="4.5" x2="22" y2="4.5"
        stroke={color} strokeWidth="2.4" strokeLinecap="round"
        strokeDasharray={dashFor(id) || undefined}
      />
    </svg>
  );
}

function BeerCurve({ scores, beers }) {
  const [view, setView] = useState("all");
  const rounds = view === "all" ? ROUNDS : ROUNDS.filter((r) => r.id === view);

  const curves = useMemo(() => beerCurves(rounds, scores, beers), [rounds, scores, beers]);
  const played = curves.filter((c) => c.holes > 0);

  /* Bäst först: mest negativ lutning vinner, spelare utan trendlinje sist. */
  const trend = [...played].sort((a, b) => {
    if (a.slope == null && b.slope == null) return 0;
    if (a.slope == null) return 1;
    if (b.slope == null) return -1;
    return a.slope - b.slope;
  });

  return (
    <div style={{ padding: "20px 16px 60px" }}>
      <Head icon={BeerIcon} title="Ölkurvan" sub="Snitt över par per antal öl" />
      <DayPills value={view} onChange={setView} includeAll />

      {!played.length && (
        <Empty text="Spela några hål och logga öl under Spela så ritas kurvan upp." />
      )}

      {played.length > 0 && (
        <>
          <BeerChart curves={played} />

          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 11, justifyContent: "center" }}>
            {played.map((c) => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <LineKey id={c.id} color={c.color} />
                <span style={{ fontSize: 11.5, color: C.paper, fontWeight: 600 }}>{c.name}</span>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 10.5, color: C.dim, lineHeight: 1.55, marginTop: 10, textAlign: "center" }}>
            Punktens storlek visar hur många hål som spelats på den nivån.
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 18 }}>
            {trend.map((c) => (
              <div key={c.id} style={{
                display: "flex", alignItems: "center", gap: 10,
                background: C.paper, borderRadius: 12, padding: "11px 13px",
              }}>
                <LineKey id={c.id} color={c.color} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 13.5, color: C.ink }}>{c.name}</div>
                  <div style={{ fontSize: 10.5, color: C.muted, marginTop: 1 }}>
                    {c.holes} hål · {c.points.length} ölnivå{c.points.length === 1 ? "" : "er"}
                  </div>
                </div>
                <div style={{
                  fontFamily: MONO, fontSize: 11, fontWeight: 700, textAlign: "right",
                  color: slopeColor(c.slope),
                }}>
                  {c.slope == null ? "—" : slopeText(c.slope)}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* Axeltext för snitt över par: +1,5 / 0,0 / -0,8. */
const axisTick = (v) => {
  if (Math.abs(v) < 0.05) return "0,0";
  return (v > 0 ? "+" : "") + v.toFixed(1).replace(".", ",");
};

function BeerChart({ curves }) {
  const W = 340, H = 210, L = 36, R = 12, T = 14, B = 32;

  const pts = curves.flatMap((c) => c.points);
  const maxLevel = Math.max(1, ...pts.map((p) => p.level));
  const maxHoles = Math.max(1, ...pts.map((p) => p.holes));

  /* Y-axeln spänner över det som faktiskt spelats, med lite luft runt —
     annars klistrar sig punkterna i kanten när alla ligger nära varandra. */
  let lo = Math.min(...pts.map((p) => p.avg));
  let hi = Math.max(...pts.map((p) => p.avg));
  if (hi - lo < 1) { const m = (lo + hi) / 2; lo = m - 0.5; hi = m + 0.5; }
  const air = (hi - lo) * 0.18;
  lo -= air; hi += air;

  const x = (lvl) => L + (lvl / maxLevel) * (W - L - R);
  const y = (v) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);

  const yTicks = [0, 1, 2, 3].map((i) => lo + ((hi - lo) * i) / 3);
  const xTicks = [];
  for (let i = 0; i <= maxLevel; i += maxLevel > 8 ? 2 : 1) xTicks.push(i);

  return (
    <div style={{
      background: "rgba(255,255,255,0.035)", border: `1px solid ${C.line}`,
      borderRadius: 14, padding: "11px 10px 7px",
    }}>
      <div style={{
        fontSize: 9.5, color: C.dim, textTransform: "uppercase",
        letterSpacing: "0.09em", fontWeight: 800, marginBottom: 3, paddingLeft: 3,
      }}>
        Snitt över par
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
        {yTicks.map((v, i) => (
          <g key={`y${i}`}>
            <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke={C.line} strokeWidth="1" />
            <text x={L - 6} y={y(v) + 3.4} textAnchor="end" fill={C.dim} fontSize="9" fontFamily={MONO}>
              {axisTick(v)}
            </text>
          </g>
        ))}

        {/* Par-linjen, när den ligger inom bild. */}
        {lo < 0 && hi > 0 && (
          <line x1={L} x2={W - R} y1={y(0)} y2={y(0)} stroke="rgba(243,238,221,0.4)" strokeWidth="1" strokeDasharray="3 3" />
        )}

        {xTicks.map((v) => (
          <text key={`x${v}`} x={x(v)} y={H - 13} textAnchor="middle" fill={C.dim} fontSize="9" fontFamily={MONO}>
            {v}
          </text>
        ))}
        <text
          x={(L + W - R) / 2} y={H - 2} textAnchor="middle" fill={C.dim}
          fontSize="8.5" fontWeight="700" letterSpacing="1.2"
        >
          ANTAL ÖL
        </text>

        {curves.map((c) => (
          c.points.length > 1 ? (
            <polyline
              key={`l${c.id}`} fill="none" stroke={c.color} strokeWidth="2"
              strokeDasharray={dashFor(c.id) || undefined}
              strokeLinejoin="round" strokeLinecap="round" opacity="0.9"
              points={c.points.map((p) => `${x(p.level)},${y(p.avg)}`).join(" ")}
            />
          ) : null
        ))}

        {/* Radien skalar med antalet hål bakom nivån — viktningen syns. */}
        {curves.map((c) => c.points.map((p) => (
          <circle
            key={`p${c.id}-${p.level}`}
            cx={x(p.level)} cy={y(p.avg)} r={3 + 5 * Math.sqrt(p.holes / maxHoles)}
            fill={c.color} fillOpacity="0.85" stroke={C.fairwayDark} strokeWidth="1"
          />
        )))}
      </svg>
    </div>
  );
}

/* =========================================================
   UPPDATERINGSNOTIS
   ========================================================= */

/* =========================================================
   SEED-PANEL — bara i utvecklingsläge

   Renderas bakom `import.meta.env.DEV`, så Vite tree-shakar bort
   den ur produktionsbygget. Den skriver genom useScores vanliga kö,
   vilket gör att synken, offlinekön och realtidslyssnarna testas
   samtidigt som vyerna fylls med data.
   ========================================================= */

function DevSeed({ onSeed }) {
  const [open, setOpen] = useState(false);

  const knapp = {
    display: "block", width: "100%", padding: "9px 0", marginTop: 7, cursor: "pointer",
    borderRadius: 9, border: "none", fontSize: 11.5, fontWeight: 700,
  };

  return (
    <div style={{ position: "fixed", left: 12, bottom: 12, zIndex: 40 }}>
      {!open && (
        <button onClick={() => setOpen(true)} title="Seed-läge (endast dev)" style={{
          width: 34, height: 34, borderRadius: "50%", cursor: "pointer",
          border: `1px solid ${C.line}`, background: "rgba(10,42,33,0.85)",
          color: C.mutedGreen, fontSize: 14, fontWeight: 800,
        }}>⚙</button>
      )}

      {open && (
        <div style={{
          width: 190, padding: "11px 12px 12px", borderRadius: 12,
          background: C.fairwayDark, border: `1px solid ${C.line}`,
          boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
        }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            fontSize: 9.5, fontWeight: 800, color: C.gold,
            textTransform: "uppercase", letterSpacing: "0.14em",
          }}>
            Seed · dev
            <button onClick={() => setOpen(false)} style={{
              background: "none", border: "none", color: C.mutedGreen, cursor: "pointer", padding: 0,
            }}><X size={13} /></button>
          </div>

          <div style={{ fontSize: 10.5, color: C.dim, lineHeight: 1.5, marginTop: 6 }}>
            Skriver till samma databas som appen. Rensa efteråt, eller
            använd Nollställ under Schema.
          </div>

          <button
            onClick={() => { const { scores, beers } = buildSeed(); onSeed(scores, beers); }}
            style={{ ...knapp, background: C.goldBright, color: C.fairwayDark }}
          >
            Fyll med testdata
          </button>
          <button
            onClick={() => { const { scores, beers } = buildEmpty(); onSeed(scores, beers); }}
            style={{ ...knapp, background: "rgba(255,255,255,0.07)", color: C.mutedGreen }}
          >
            Rensa seed
          </button>
        </div>
      )}
    </div>
  );
}

function UpdateBanner({ ready, update, dismiss }) {
  if (!ready) return null;

  return (
    <div style={{
      position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 40,
      display: "flex", alignItems: "center", gap: 10,
      background: C.fairwayDark, borderTop: `1px solid ${C.line}`,
      padding: "11px 12px calc(11px + env(safe-area-inset-bottom))",
      boxShadow: "0 -8px 22px rgba(0,0,0,0.35)",
    }}>
      <RefreshCw size={15} color={C.goldBright} strokeWidth={2.4} style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 800, color: C.paper }}>Ny version tillgänglig</div>
        <div style={{ fontSize: 10.5, color: C.mutedGreen, marginTop: 1 }}>
          Allt inmatat är sparat — ladda om när det passar.
        </div>
      </div>
      <button onClick={update} style={{
        flexShrink: 0, background: C.gold, color: C.fairwayDark, border: "none",
        borderRadius: 9, padding: "10px 13px", fontSize: 12, fontWeight: 800, cursor: "pointer",
      }}>
        Ladda om
      </button>
      <button onClick={dismiss} aria-label="Stäng" style={{
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        width: 30, height: 30, borderRadius: 8, border: `1px solid ${C.line}`,
        background: "rgba(255,255,255,0.05)", color: C.mutedGreen, cursor: "pointer",
      }}>
        <X size={14} strokeWidth={2.6} />
      </button>
    </div>
  );
}
