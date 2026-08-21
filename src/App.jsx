import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Trophy, Flag, Target, Circle, TrendingUp, Activity, Zap, Wind, Award,
  Plus, Minus, ChevronLeft, ChevronRight, Users, Calendar, MapPin, Star,
  Check, User, ExternalLink, ChevronDown, BookOpen, AlertTriangle,
  Undo2, X, RefreshCw, Coffee,
} from "lucide-react";

import {
  C, FONT, DISPLAY, MONO, PLAYERS, ROUNDS,
} from "./data";
import { useScores, useMe } from "./useScores";
import { usePwaUpdate } from "./usePwaUpdate";
import { beerCurves, weightedSlope, beerLevels, slopeText } from "./beer";

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
  const [hole, setHole] = useState(0);
  const { scores, beers, set, addBeer, undoBeer, sync, reset } = useScores();
  const [me, chooseMe] = useMe();
  const pwa = usePwaUpdate();

  const round = ROUNDS.find((r) => r.id === roundId);

  return (
    <div style={{ minHeight: "100vh", background: C.fairway, fontFamily: FONT, color: C.paper }}>
      <style>{`
        *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
        button{font-family:inherit}
        ::-webkit-scrollbar{display:none}
      `}</style>

      <Masthead sync={sync} />
      <Tabs tab={tab} setTab={setTab} />

      {tab === "schema" && (
        <Schedule
          me={me}
          onPickMe={chooseMe}
          onReset={reset}
          onOpen={(id) => { setRoundId(id); setHole(0); setTab("bana"); }}
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
      {tab === "board" && <Leaderboard scores={scores} me={me} />}
      {tab === "dream" && <Dream18 scores={scores} me={me} />}
      {tab === "ol" && <BeerCurve scores={scores} beers={beers} />}
      {tab === "awards" && <Awards scores={scores} beers={beers} />}
      {tab === "regler" && <Rules />}

      <UpdateBanner {...pwa} />
    </div>
  );
}

/* =========================================================
   CHROME
   ========================================================= */

function Masthead({ sync }) {
  const label = sync === "loading" ? "Laddar…" : sync === "saving" ? "Sparar…" : sync === "error" ? "Ej synkad" : "Synkad";
  const dot = sync === "error" ? C.clay : sync === "ok" ? "#6FBE8F" : C.mutedGreen;
  return (
    <div style={{ padding: "20px 16px 4px", textAlign: "center" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9 }}>
        <div style={{ width: 30, height: 1, background: C.line }} />
        <Flag size={15} color={C.gold} strokeWidth={2.6} />
        <div style={{ width: 30, height: 1, background: C.line }} />
      </div>
      <h1 style={{
        fontFamily: DISPLAY, fontSize: 26, fontWeight: 700, margin: "8px 0 0",
        textTransform: "uppercase", letterSpacing: "0.04em", lineHeight: 1.1,
      }}>
        Los Cuatro <span style={{ color: C.goldBright }}>Masters</span>
      </h1>
      <div style={{ fontSize: 10.5, color: C.mutedGreen, letterSpacing: "0.18em", textTransform: "uppercase", marginTop: 5 }}>
        Costa del Sol · 11–13 sep
      </div>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 8, fontSize: 10.5, color: C.dim }}>
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
const parColor = (n) => (n < 0 ? "#6FBE8F" : n === 0 ? C.paper : C.clay);

/* =========================================================
   SCHEMA
   ========================================================= */

function Schedule({ me, onPickMe, onOpen, onReset }) {
  return (
    <div style={{ padding: "20px 16px 60px" }}>
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

function CourseGuide({ roundId, setRoundId, onPlay }) {
  const r = ROUNDS.find((x) => x.id === roundId);
  const sum = (a, k) => a.reduce((s, h) => s + h[k], 0);
  const front = r.holes.slice(0, 9), back = r.holes.slice(9);

  return (
    <div style={{ padding: "20px 16px 60px" }}>
      <Head icon={MapPin} title="Banguide" sub={`${r.course} · ${r.location}`} />
      <DayPills value={roundId} onChange={setRoundId} />

      <div style={{ background: C.paper, borderRadius: 14, overflow: "hidden" }}>
        <Nine title="Ut" holes={front} />
        <div style={{ height: 1, background: C.paperDark, margin: "0 14px" }} />
        <Nine title="In" holes={back} />
        <div style={{
          display: "flex", padding: "11px 14px", fontFamily: MONO, fontSize: 13, fontWeight: 700,
          color: C.ink, background: C.paperDark,
        }}>
          <span style={{ flex: 1 }}>Totalt</span>
          <span style={{ width: 38, textAlign: "center" }}>{sum(r.holes, "par")}</span>
          <span style={{ width: 62, textAlign: "right" }}>{sum(r.holes, "m").toLocaleString("sv-SE")}</span>
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

function Nine({ title, holes }) {
  return (
    <div>
      <div style={{
        display: "flex", padding: "11px 14px 7px", fontSize: 10,
        color: C.muted, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.09em",
      }}>
        <span style={{ flex: 1 }}>{title}</span>
        <span style={{ width: 38, textAlign: "center" }}>Par</span>
        <span style={{ width: 62, textAlign: "right" }}>Meter</span>
      </div>
      {holes.map((h) => (
        <div key={h.hole} style={{
          display: "flex", padding: "7px 14px", fontFamily: MONO, fontSize: 13, color: C.ink,
          background: h.hole % 2 === 0 ? "rgba(0,0,0,0.02)" : "transparent",
        }}>
          <span style={{ flex: 1, fontWeight: 700 }}>{h.hole}</span>
          <span style={{ width: 38, textAlign: "center", color: h.par === 3 ? C.clay : h.par === 5 ? C.green : C.ink }}>{h.par}</span>
          <span style={{ width: 62, textAlign: "right" }}>{h.m}</span>
        </div>
      ))}
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
            <div style={{ fontSize: 12.5, color: C.mutedGreen, marginTop: 3 }}>
              Par {h.par} · {h.m} m
            </div>
          </div>
          <Arrow dir="right" disabled={hole === 17} onClick={() => setHole((x) => Math.min(17, x + 1))} />
        </div>

        {/* Hole strip — shows your own progress */}
        <div style={{ display: "flex", gap: 3, marginTop: 14, justifyContent: "center", flexWrap: "wrap" }}>
          {round.holes.map((hh, i) => {
            const s = scores[me][i].s;
            const d = s == null ? null : s - hh.par;
            return (
              <button key={i} onClick={() => setHole(i)} style={{
                width: 15, height: 20, borderRadius: 3, border: "none", cursor: "pointer", padding: 0,
                background: i === hole ? C.gold
                  : d == null ? "rgba(255,255,255,0.09)"
                  : d < 0 ? "#6FBE8F" : d === 0 ? "rgba(243,238,221,0.55)" : d === 1 ? "rgba(181,83,60,0.65)" : "rgba(138,46,31,0.8)",
                fontSize: 8.5, fontWeight: 700, color: i === hole ? C.fairwayDark : "rgba(10,42,33,0.75)",
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
          color: st.s == null ? "#BDB699" : st.s - par < 0 ? C.green : st.s - par === 0 ? C.ink : st.s - par === 1 ? C.clay : "#8A2E1F",
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
              return (
                <button key={v} onClick={() => { onSet("s", v); setFree(null); }} style={{
                  flex: 1, padding: "11px 0", borderRadius: 10, border: "none", cursor: "pointer",
                  background: on ? (d < 0 ? C.green : d === 0 ? C.ink : d === 1 ? C.clay : "#8A2E1F") : C.paperDark,
                  color: on ? C.paper : C.muted, fontSize: 12, fontWeight: 800, lineHeight: 1.3,
                }}>
                  <div style={{ fontFamily: MONO, fontSize: 15 }}>{v}</div>
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

function roundStat(round, holesArr) {
  let strokes = 0, parSum = 0, played = 0, putts = 0, birdies = 0;
  holesArr.forEach((h, i) => {
    if (h.s == null) return;
    played++;
    strokes += h.s;
    parSum += round.holes[i].par;
    if (h.s - round.holes[i].par <= -1) birdies++;
    if (h.p != null) putts += h.p;
  });
  return { played, strokes, toPar: strokes - parSum, putts, birdies };
}

/* =========================================================
   LEADERBOARD
   ========================================================= */

function Leaderboard({ scores, me }) {
  const [view, setView] = useState("all");

  const rows = useMemo(() => {
    const rs = view === "all" ? ROUNDS : ROUNDS.filter((r) => r.id === view);
    return PLAYERS.map((p) => {
      let strokes = 0, toPar = 0, played = 0, birdies = 0;
      const per = ROUNDS.map((r) => {
        const st = roundStat(r, scores[r.id][p.id]);
        return { id: r.id, short: r.short, ...st };
      });
      rs.forEach((r) => {
        const st = per.find((x) => x.id === r.id);
        strokes += st.strokes; toPar += st.toPar; played += st.played; birdies += st.birdies;
      });
      return { ...p, strokes, toPar, played, birdies, per, max: rs.length * 18 };
    }).sort((a, b) => {
      if (!a.played && !b.played) return 0;
      if (!a.played) return 1;
      if (!b.played) return -1;
      return a.toPar - b.toPar || b.played - a.played;
    });
  }, [scores, view]);

  const live = rows.some((r) => r.played > 0);
  const lead = live ? rows[0].toPar : 0;

  return (
    <div style={{ padding: "20px 16px 60px" }}>
      <Head icon={Trophy} title="Leaderboard" sub="Bruttoscore · rakt av" />
      <DayPills value={view} onChange={setView} includeAll />

      {!live && <Empty text="Inga slag inrapporterade än." />}

      {live && (
        <>
          <Podium rows={rows.filter((r) => r.played > 0).slice(0, 3)} />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {rows.map((r, i) => (
              <Row key={r.id} r={r} pos={i + 1} lead={lead} isMe={r.id === me} showPer={view === "all"} />
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

function Row({ r, pos, lead, isMe, showPer }) {
  const gap = r.played > 0 ? r.toPar - lead : null;
  return (
    <div style={{
      background: pos === 1 && r.played > 0 ? C.gold : C.paper,
      borderRadius: 12, padding: "12px 14px", opacity: r.played ? 1 : 0.45,
      boxShadow: isMe ? `0 0 0 1.5px ${C.goldBright}` : "none",
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
            color: r.played ? (r.toPar < 0 ? C.green : r.toPar === 0 ? C.ink : C.clay) : C.muted,
          }}>
            {r.played ? fmtPar(r.toPar) : "–"}
          </div>
          <div style={{ fontFamily: MONO, fontSize: 11, color: C.muted }}>
            {r.played ? r.strokes : ""}
          </div>
        </div>
      </div>

      {showPer && r.played > 0 && (
        <div style={{ display: "flex", gap: 6, marginTop: 10, paddingTop: 9, borderTop: `1px solid ${C.paperDark}` }}>
          {r.per.map((x) => (
            <div key={x.id} style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: 9, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em" }}>{x.short}</div>
              <div style={{
                fontFamily: MONO, fontSize: 12, fontWeight: 700, marginTop: 1,
                color: !x.played ? "#BDB699" : x.toPar < 0 ? C.green : x.toPar === 0 ? C.ink : C.clay,
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
  const rows = useMemo(() => PLAYERS.map((p) => {
    const best = [];
    let total = 0, filled = 0;
    for (let i = 0; i < 18; i++) {
      let low = null;
      for (const r of ROUNDS) {
        const s = scores[r.id][p.id][i]?.s;
        if (s != null && (low == null || s < low)) low = s;
      }
      best.push(low);
      if (low != null) { total += low; filled++; }
    }
    return { ...p, best, total, filled };
  }).sort((a, b) => {
    if (!a.filled && !b.filled) return 0;
    if (!a.filled) return 1;
    if (!b.filled) return -1;
    return a.total - b.total;
  }), [scores]);

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

function computeAwards(rounds, scores, beers) {
  const stats = PLAYERS.map((p) => {
    let comeback = -Infinity, diffs = [], clutchSum = 0, clutchN = 0;
    let gir = 0, fw = 0, putts = 0, puttHoles = 0;
    let scr = 0, scrOpp = 0, streak = 0, birdies = 0;

    rounds.forEach((r) => {
      const hs = scores[r.id][p.id].map((h, i) => ({ ...h, par: r.holes[i].par }));
      const played = hs.filter((h) => h.s != null);

      for (let i = 1; i < hs.length; i++) {
        const a = hs[i - 1], b = hs[i];
        if (a.s == null || b.s == null) continue;
        const sw = (a.s - a.par) - (b.s - b.par);
        if (sw > comeback) comeback = sw;
      }

      played.forEach((h) => diffs.push(h.s - h.par));

      if (played.length >= 4) {
        const last3 = played.slice(-3);
        const avg = played.reduce((s, h) => s + (h.s - h.par), 0) / played.length;
        const l3 = last3.reduce((s, h) => s + (h.s - h.par), 0) / 3;
        clutchSum += avg - l3; clutchN++;
      }

      gir += hs.filter((h) => h.gir === true).length;
      fw += hs.filter((h) => h.par !== 3 && h.fw === true).length;
      const ph = hs.filter((h) => h.p != null);
      putts += ph.reduce((s, h) => s + h.p, 0);
      puttHoles += ph.length;

      const opp = hs.filter((h) => h.s != null && h.gir !== true);
      scrOpp += opp.length;
      scr += opp.filter((h) => h.s - h.par <= 0).length;

      let run = 0;
      for (const h of hs) {
        if (h.s == null) { run = 0; continue; }
        if (h.s - h.par <= 1) { run++; streak = Math.max(streak, run); } else run = 0;
      }

      birdies += played.filter((h) => h.s - h.par <= -1).length;
    });

    /* The Optimizer: trendlinjen genom (ölnivå, snitt över par), viktad
       med antal hål per nivå. Kräver spel på minst tre olika nivåer. */
    const levels = beerLevels(rounds, scores, beers, p.id);
    const slope = weightedSlope(levels);

    let consistency = null;
    if (diffs.length >= 3) {
      const m = diffs.reduce((a, b) => a + b, 0) / diffs.length;
      consistency = Math.sqrt(diffs.reduce((a, b) => a + (b - m) ** 2, 0) / diffs.length);
    }

    return {
      p, comeback: comeback === -Infinity ? null : comeback, consistency,
      clutch: clutchN ? clutchSum / clutchN : null,
      gir, fw, putts: puttHoles ? putts : null, puttHoles,
      scr, scrOpp, streak, birdies,
      optimizer: levels.length >= 3 ? slope : null,
      beerLevels: levels.length,
    };
  });

  const pick = (k, dir = "max", ok = () => true) => {
    const c = stats.filter((s) => s[k] != null && ok(s));
    if (!c.length) return null;
    return c.reduce((b, s) => (!b ? s : dir === "max" ? (s[k] > b[k] ? s : b) : (s[k] < b[k] ? s : b)), null);
  };

  return {
    comeback: pick("comeback", "max", (s) => s.comeback > 0),
    consistency: pick("consistency", "min"),
    clutch: pick("clutch", "max", (s) => s.clutch > 0),
    gir: pick("gir", "max", (s) => s.gir > 0),
    fw: pick("fw", "max", (s) => s.fw > 0),
    putts: pick("putts", "min", (s) => s.puttHoles >= 3),
    scr: pick("scr", "max", (s) => s.scr > 0),
    streak: pick("streak", "max", (s) => s.streak > 0),
    birdies: pick("birdies", "max", (s) => s.birdies > 0),
    optimizer: pick("optimizer", "min"),
  };
}

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
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                {w ? (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: w.p.color }} />
                      <span style={{ fontWeight: 800, fontSize: 12.5, color: C.ink }}>{w.p.name}</span>
                    </div>
                    <div style={{ fontFamily: MONO, fontSize: 10, color: C.muted, marginTop: 2 }}>{a.v(w)}</div>
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

/* Färg på trenden: nedåt är bra, uppåt är dyrt, platt är platt. */
const slopeColor = (slope, flat = C.muted) =>
  slope == null || Math.abs(slope) < 0.005 ? flat : slope < 0 ? C.green : C.clay;

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
                <span style={{ width: 9, height: 9, borderRadius: "50%", background: c.color }} />
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
                <span style={{ width: 9, height: 9, borderRadius: "50%", background: c.color, flexShrink: 0 }} />
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
