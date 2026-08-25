import { describe, it, expect } from "vitest";
import { PLAYERS, ROUNDS } from "../src/data";
import {
  roundStat, leaderboardRows, dream18Rows, cardStats, computeAwards, emptyScores, emptyBeers,
} from "../src/stats";
import { beerLevelAt, beerLevels, slopeText } from "../src/beer";
import { loadEdition2025, noBeers, rng, randomScores, randomBeers } from "./helpers";

/* =========================================================
   INVARIANTER

   Sanningar som måste hålla oavsett indata. Körs mot både 2025 års
   riktiga scorekort och deterministiskt slumpade rundor.
   ========================================================= */

const ed = loadEdition2025();

/* Tolv slumpuppsättningar med olika frön, blandat hel- och
   halvspelade rundor. Deterministiskt: samma frö varje körning. */
const RANDOM = Array.from({ length: 12 }, (_, i) => {
  const rand = rng(i * 7919 + 3);
  const fill = i % 3 === 0 ? 0.5 : 1;
  return {
    namn: `slump#${i} (fill ${fill})`,
    rounds: ROUNDS,
    scores: randomScores(ROUNDS, PLAYERS, rand, { fill }),
    beers: randomBeers(ROUNDS, PLAYERS, rand),
  };
});

const ALLA = [
  { namn: "2025", rounds: ed.rounds, scores: ed.scores, beers: noBeers(ed.rounds, PLAYERS) },
  ...RANDOM,
];

describe.each(ALLA)("scorekort — $namn", ({ rounds, scores }) => {
  it("Ut + In = Totalt", () => {
    for (const r of rounds) for (const p of PLAYERS) {
      const st = cardStats(r, scores[r.id][p.id]);
      const ut = st.out ? st.out.strokes : 0;
      const in_ = st.in ? st.in.strokes : 0;
      expect(ut + in_).toBe(st.total ? st.total.strokes : 0);
    }
  });

  it("par per block summerar till banans par", () => {
    for (const r of rounds) {
      const st = cardStats(r, scores[r.id][PLAYERS[0].id]);
      expect(st.parOut).toBe(r.holes.slice(0, 9).reduce((s, h) => s + h.par, 0));
      expect(st.parIn).toBe(r.holes.slice(9).reduce((s, h) => s + h.par, 0));
      expect(st.parOut + st.parIn).toBe(r.holes.reduce((s, h) => s + h.par, 0));
    }
  });

  it("över par = slag minus par, bara för spelade hål", () => {
    for (const r of rounds) for (const p of PLAYERS) {
      const hs = scores[r.id][p.id];
      const st = cardStats(r, hs);
      const spelade = hs.map((h, i) => ({ ...h, par: r.holes[i].par })).filter((h) => h.s != null);
      const vantat = spelade.reduce((s, h) => s + (h.s - h.par), 0);
      expect(st.total ? st.total.toPar : 0).toBe(vantat);
    }
  });

  it("GIR- och fairwaysummor är summan av hålens värden", () => {
    for (const r of rounds) for (const p of PLAYERS) {
      const hs = scores[r.id][p.id].map((h, i) => ({ ...h, par: r.holes[i].par }));
      const st = cardStats(r, scores[r.id][p.id]);
      if (st.gir) expect(st.gir.ok).toBe(hs.filter((h) => h.gir === true).length);
      if (st.fw) expect(st.fw.ok).toBe(hs.filter((h) => h.par !== 3 && h.fw === true).length);
      if (st.putts) {
        expect(st.putts.total).toBe(hs.filter((h) => h.p != null).reduce((s, h) => s + h.p, 0));
        expect(st.putts.holes).toBe(hs.filter((h) => h.p != null).length);
      }
    }
  });

  it("fairwayprocenten räknar bara hål som inte är par 3", () => {
    for (const r of rounds) for (const p of PLAYERS) {
      const st = cardStats(r, scores[r.id][p.id]);
      if (!st.fw) continue;
      expect(st.fw.of).toBe(r.holes.filter((h) => h.par !== 3).length);
      expect(st.fw.of).toBeLessThan(18);
    }
  });

  it("nämnarna i fördjupningen är rätt mängder", () => {
    for (const r of rounds) for (const p of PLAYERS) {
      const hs = scores[r.id][p.id].map((h, i) => ({ ...h, par: r.holes[i].par }));
      const st = cardStats(r, scores[r.id][p.id]);

      /* Puttar per träffad green räknas bara på GIR-hål. */
      if (st.puttsPerGir) {
        const pg = hs.filter((h) => h.gir === true && h.p != null);
        expect(st.puttsPerGir.holes).toBe(pg.length);
        expect(st.puttsPerGir.avg).toBeCloseTo(pg.reduce((s, h) => s + h.p, 0) / pg.length, 10);
      }
      /* Par eller bättre vid GIR: nämnaren är spelade GIR-hål. */
      if (st.girSaved) expect(st.girSaved.of).toBe(hs.filter((h) => h.gir === true && h.s != null).length);
      /* Vid fairwayträff: nämnaren är spelade fairwayträffar. */
      if (st.fwSaved) expect(st.fwSaved.of).toBe(hs.filter((h) => h.par !== 3 && h.fw === true && h.s != null).length);
      /* Räddade par: nämnaren är spelade hål utan träffad green. */
      if (st.scrambling) expect(st.scrambling.of).toBe(hs.filter((h) => h.s != null && h.gir !== true).length);
    }
  });

  it("ingen andel hamnar utanför 0–100 %", () => {
    for (const r of rounds) for (const p of PLAYERS) {
      const st = cardStats(r, scores[r.id][p.id]);
      for (const k of ["gir", "fw", "girSaved", "fwSaved", "scrambling"]) {
        const x = st[k];
        if (!x) continue;
        expect(x.ok).toBeGreaterThanOrEqual(0);
        expect(x.ok).toBeLessThanOrEqual(x.of);
      }
    }
  });

  it("scoringfördelningen summerar till antalet spelade hål", () => {
    for (const r of rounds) for (const p of PLAYERS) {
      const st = cardStats(r, scores[r.id][p.id]);
      const summa = Object.values(st.dist).reduce((a, b) => a + b, 0);
      expect(summa).toBe(st.played);
    }
  });
});

describe.each(ALLA)("leaderboard — $namn", ({ rounds, scores }) => {
  it("summan av rundorna är lika med totalvyn", () => {
    const total = leaderboardRows(rounds, scores, "all");
    for (const p of PLAYERS) {
      const summa = rounds.reduce((s, r) => {
        const row = leaderboardRows(rounds, scores, r.id).find((x) => x.id === p.id);
        return { strokes: s.strokes + row.strokes, toPar: s.toPar + row.toPar, played: s.played + row.played };
      }, { strokes: 0, toPar: 0, played: 0 });
      const row = total.find((x) => x.id === p.id);
      expect(summa.strokes).toBe(row.strokes);
      expect(summa.toPar).toBe(row.toPar);
      expect(summa.played).toBe(row.played);
    }
  });

  it("sorteringen är stigande på över par, ospelade sist", () => {
    const rows = leaderboardRows(rounds, scores, "all");
    const spelade = rows.filter((r) => r.played > 0);
    for (let i = 1; i < spelade.length; i++) {
      expect(spelade[i].toPar).toBeGreaterThanOrEqual(spelade[i - 1].toPar);
    }
    const forstaOspelad = rows.findIndex((r) => !r.played);
    if (forstaOspelad !== -1) {
      expect(rows.slice(forstaOspelad).every((r) => !r.played)).toBe(true);
    }
  });

  it("en delvis spelad runda räknas bara på ifyllda hål", () => {
    for (const r of rounds) for (const p of PLAYERS) {
      const hs = scores[r.id][p.id];
      const st = roundStat(r, hs);
      expect(st.played).toBe(hs.filter((h) => h.s != null).length);
      /* Par-summan bygger på spelade hål: toPar kan aldrig anta att
         ospelade hål gav noll slag. */
      const parSpelade = hs.reduce((s, h, i) => s + (h.s != null ? r.holes[i].par : 0), 0);
      expect(st.toPar).toBe(st.strokes - parSpelade);
    }
  });
});

describe.each(ALLA)("dream 18 — $namn", ({ rounds, scores }) => {
  it("varje hål är minimum av samma hålnummer över alla rundor", () => {
    const rows = dream18Rows(rounds, scores);
    for (const row of rows) {
      for (let i = 0; i < 18; i++) {
        const alla = rounds.map((r) => scores[r.id][row.id][i]?.s).filter((s) => s != null);
        expect(row.best[i]).toBe(alla.length ? Math.min(...alla) : null);
      }
    }
  });

  it("summan är aldrig högre än spelarens bästa enskilda runda", () => {
    const rows = dream18Rows(rounds, scores);
    for (const row of rows) {
      if (!row.filled) continue;
      /* Jämförelsen gäller bara rundor som täcker samma hål — en
         fullständig runda är alltid en giltig övre gräns. */
      const hela = rounds
        .map((r) => roundStat(r, scores[r.id][row.id]))
        .filter((st) => st.played === 18);
      for (const st of hela) expect(row.total).toBeLessThanOrEqual(st.strokes);
    }
  });

  it("ospelade hålnummer räknas inte", () => {
    const rows = dream18Rows(rounds, scores);
    for (const row of rows) {
      expect(row.filled).toBe(row.best.filter((v) => v != null).length);
      expect(row.total).toBe(row.best.filter((v) => v != null).reduce((a, b) => a + b, 0));
    }
  });
});

describe("dream 18 — med bara en runda ifylld", () => {
  it("är lika med den rundan", () => {
    const rand = rng(99);
    const scores = emptyScores();
    scores[ROUNDS[1].id][PLAYERS[0].id] = randomScores([ROUNDS[1]], [PLAYERS[0]], rand)[ROUNDS[1].id][PLAYERS[0].id];
    const row = dream18Rows(ROUNDS, scores).find((r) => r.id === PLAYERS[0].id);
    const st = roundStat(ROUNDS[1], scores[ROUNDS[1].id][PLAYERS[0].id]);
    expect(row.total).toBe(st.strokes);
    expect(row.filled).toBe(st.played);
  });
});

describe.each(ALLA)("ölkurvan — $namn", ({ rounds, scores, beers }) => {
  it("ett hål tillhör nivån = antal öl loggade före eller på hålet", () => {
    for (const r of rounds) for (const p of PLAYERS) {
      const bs = beers[r.id][p.id];
      for (let hole = 1; hole <= 18; hole++) {
        expect(beerLevelAt(bs, hole)).toBe(bs.filter((b) => b.hole <= hole).length);
      }
    }
  });

  it("summan av hålen över alla nivåer = antalet spelade hål", () => {
    for (const p of PLAYERS) {
      const levels = beerLevels(rounds, scores, beers, p.id);
      const iNivaer = levels.reduce((s, l) => s + l.holes, 0);
      const spelade = rounds.reduce(
        (s, r) => s + scores[r.id][p.id].filter((h) => h.s != null).length, 0);
      expect(iNivaer).toBe(spelade);
    }
  });

  it("ölräkningen nollställs mellan rundor", () => {
    for (const p of PLAYERS) {
      /* Nivån för hål 1 i varje runda utgår bara från den rundans öl. */
      for (const r of rounds) {
        const egna = beers[r.id][p.id].filter((b) => b.hole <= 1).length;
        expect(beerLevelAt(beers[r.id][p.id], 1)).toBe(egna);
      }
    }
  });
});

describe.each(ALLA)("the optimizer — $namn", ({ rounds, scores, beers }) => {
  it("kräver minst tre nivåer, annars null", () => {
    const res = computeAwards(rounds, scores, beers);
    if (res.optimizer) expect(res.optimizer.beerLevels).toBeGreaterThanOrEqual(3);
  });

  it("lutningen redovisas alltid utan minustecken", () => {
    const res = computeAwards(rounds, scores, beers);
    const text = slopeText(res.optimizer ? res.optimizer.optimizer : null);
    expect(text).not.toMatch(/-/);
    if (res.optimizer && Math.abs(res.optimizer.optimizer) >= 0.005) {
      expect(text).toMatch(/(bättre|sämre) \/ öl$/);
    }
  });
});

describe("slopeText", () => {
  it("skriver riktningen i klartext", () => {
    expect(slopeText(-0.3)).toBe("0,30 slag bättre / öl");
    expect(slopeText(0.45)).toBe("0,45 slag sämre / öl");
    expect(slopeText(0)).toBe("Ingen skillnad / öl");
    expect(slopeText(null)).toBe("—");
  });
});
