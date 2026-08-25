import fs from "node:fs";
import path from "node:path";

/* =========================================================
   TESTHJÄLP

   Läser 2025 års scorekort från data/*.csv och bygger rundor och
   score i samma form som appen använder. Ingen Firestore, inga
   sidoeffekter — filerna läses bara.
   ========================================================= */

const NAME2ID = {
  "Per Welin": "per",
  "Lars Munther": "lars",
  "Daniel Jonsson": "jonsson",
  "Daniel Johansson": "johansson",
};

const FILES = [
  { id: "naranjos", file: "2025-los-naranjos.csv", short: "Nar" },
  { id: "santana", file: "2025-santana.csv", short: "San" },
  { id: "lagos", file: "2025-los-lagos.csv", short: "Lag" },
];

function parseCsv(file) {
  const raw = fs.readFileSync(path.join(process.cwd(), "data", file), "utf8");
  const lines = raw.trim().split(/\r?\n/);
  const head = lines[0].split(";");
  return lines.slice(1).map((line) => {
    const cells = line.split(";");
    return Object.fromEntries(head.map((k, i) => [k.replace(/^﻿/, ""), cells[i]]));
  });
}

/* → { rounds, scores } i appens format. CSV:erna saknar GIR, fairway
   och puttar, så de fälten blir null — precis som historiken säger. */
export function loadEdition2025() {
  const rounds = [];
  const scores = {};

  for (const f of FILES) {
    const rows = parseCsv(f.file);
    const pars = new Map();
    const byPlayer = {};

    for (const row of rows) {
      const hole = Number(row["Hål"]);
      pars.set(hole, Number(row.Par));
      const pid = NAME2ID[row.Spelare];
      if (!pid) throw new Error(`Okänd spelare: ${row.Spelare}`);
      byPlayer[pid] ||= Array.from({ length: 18 }, () => ({ s: null, gir: null, fw: null, p: null }));
      byPlayer[pid][hole - 1] = { s: Number(row.Slag), gir: null, fw: null, p: null };
    }

    rounds.push({
      id: f.id,
      short: f.short,
      holes: Array.from({ length: 18 }, (_, i) => ({ hole: i + 1, par: pars.get(i + 1) })),
    });
    scores[f.id] = byPlayer;
  }

  return { rounds, scores };
}

/* Tomma öl för godtyckliga rundor. */
export function noBeers(rounds, players) {
  const o = {};
  for (const r of rounds) {
    o[r.id] = {};
    for (const p of players) o[r.id][p.id] = [];
  }
  return o;
}

/* ---------- Slumpdata ----------

   Deterministisk generator: samma frö ger samma data varje körning,
   så ett fel går att återskapa. */
export function rng(seed = 1) {
  let x = seed >>> 0 || 1;
  return () => {
    x ^= x << 13; x >>>= 0;
    x ^= x >> 17;
    x ^= x << 5; x >>>= 0;
    return x / 0xffffffff;
  };
}

/* Slumpad men rimlig runda. `fill` är sannolikheten att ett hål alls
   är inrapporterat, så halvspelade rundor kommer med i urvalet. */
export function randomRound(round, rand, { fill = 1, extras = true } = {}) {
  return round.holes.map((h) => {
    if (rand() > fill) return { s: null, gir: null, fw: null, p: null };
    const roll = rand();
    const d = roll < 0.03 ? -2 : roll < 0.12 ? -1 : roll < 0.42 ? 0 : roll < 0.72 ? 1 : roll < 0.92 ? 2 : 5;
    const gir = extras && rand() < 0.7 ? (rand() < 0.5 ? true : null) : null;
    const fw = extras && h.par !== 3 && rand() < 0.7 ? (rand() < 0.5 ? true : null) : null;
    const p = extras && rand() < 0.8 ? Math.floor(rand() * 4) : null;
    return { s: Math.max(1, h.par + d), gir, fw, p };
  });
}

export function randomScores(rounds, players, rand, opts) {
  const o = {};
  for (const r of rounds) {
    o[r.id] = {};
    for (const p of players) o[r.id][p.id] = randomRound(r, rand, opts);
  }
  return o;
}

export function randomBeers(rounds, players, rand, max = 6) {
  const o = {};
  for (const r of rounds) {
    o[r.id] = {};
    for (const p of players) {
      const n = Math.floor(rand() * (max + 1));
      const holes = Array.from({ length: n }, () => 1 + Math.floor(rand() * 18)).sort((a, b) => a - b);
      o[r.id][p.id] = holes.map((hole) => ({ hole, ts: new Date(2025, 8, 19, 12, hole).toISOString() }));
    }
  }
  return o;
}
