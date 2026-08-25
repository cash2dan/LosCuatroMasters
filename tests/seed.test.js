import { describe, it, expect } from "vitest";
import { PLAYERS, ROUNDS } from "../src/data";
import { buildSeed, buildEmpty } from "../src/seed";
import { cardStats, leaderboardRows, computeAwards } from "../src/stats";
import { beerLevels } from "../src/beer";

/* =========================================================
   SEED-DATAN

   Seed-läget finns för visuell kontroll, men den datan är värdelös
   om den inte faktiskt fyller vyerna. Här kontrolleras att den ger
   det underlag som utlovas.
   ========================================================= */

const { scores, beers } = buildSeed();

const MAL = {
  lars: [80, 92],
  per: [80, 96],
  jonsson: [89, 102],
  johansson: [117, 133],
};

describe("seed: kompletta rundor", () => {
  it("alla fyra spelare har 18 ifyllda hål på alla tre dagar", () => {
    for (const r of ROUNDS) for (const p of PLAYERS) {
      const hs = scores[r.id][p.id];
      expect(hs).toHaveLength(18);
      expect(hs.every((h) => typeof h.s === "number" && h.s > 0)).toBe(true);
    }
  });

  it("scoren ligger i spelarens nivå", () => {
    for (const p of PLAYERS) {
      const [min, max] = MAL[p.id];
      for (const r of ROUNDS) {
        const st = cardStats(r, scores[r.id][p.id]);
        expect(st.total.strokes).toBeGreaterThanOrEqual(min);
        expect(st.total.strokes).toBeLessThanOrEqual(max);
      }
    }
  });

  it("leaderboarden hamnar i rätt ordning", () => {
    const rows = leaderboardRows(ROUNDS, scores, "all");
    expect(rows.map((r) => r.id)).toEqual(["lars", "per", "jonsson", "johansson"]);
  });
});

describe("seed: färgskalan går att kontrollera", () => {
  it("minst en birdie och en dubbelbogey per spelare och runda", () => {
    for (const r of ROUNDS) for (const p of PLAYERS) {
      const { dist } = cardStats(r, scores[r.id][p.id]);
      expect(dist.eagle + dist.birdie).toBeGreaterThanOrEqual(1);
      expect(dist.double).toBeGreaterThanOrEqual(1);
    }
  });
});

describe("seed: statistiken blir meningsfull", () => {
  it("GIR, fairway och puttar är ifyllda", () => {
    for (const r of ROUNDS) for (const p of PLAYERS) {
      const st = cardStats(r, scores[r.id][p.id]);
      expect(st.gir).not.toBe(null);
      expect(st.fw).not.toBe(null);
      expect(st.putts).not.toBe(null);
      expect(st.puttsPerGir).not.toBe(null);
      expect(st.girSaved).not.toBe(null);
      expect(st.scrambling).not.toBe(null);
    }
  });

  it("GIR-andelen är rimlig, inte 0 eller 100 %", () => {
    for (const r of ROUNDS) for (const p of PLAYERS) {
      const { gir } = cardStats(r, scores[r.id][p.id]);
      expect(gir.ok).toBeGreaterThan(0);
      expect(gir.ok).toBeLessThan(18);
    }
  });
});

describe("seed: The Optimizer får underlag", () => {
  it("varje spelare har minst tre ölnivåer", () => {
    for (const p of PLAYERS) {
      expect(beerLevels(ROUNDS, scores, beers, p.id).length).toBeGreaterThanOrEqual(3);
    }
  });

  it("The Optimizer delas ut", () => {
    const res = computeAwards(ROUNDS, scores, beers);
    expect(res.optimizer).not.toBe(null);
    expect(res.optimizer.beerLevels).toBeGreaterThanOrEqual(3);
  });

  it("alla tio awards får en vinnare", () => {
    const res = computeAwards(ROUNDS, scores, beers);
    for (const [k, v] of Object.entries(res)) {
      expect(v, `award ${k} saknar vinnare`).not.toBe(null);
    }
  });
});

describe("seed: determinism och rensning", () => {
  it("samma frö ger samma data", () => {
    expect(buildSeed(4242)).toEqual(buildSeed(4242));
  });

  it("olika frön ger olika data", () => {
    expect(buildSeed(1)).not.toEqual(buildSeed(2));
  });

  it("buildEmpty nollar både score och öl", () => {
    const tom = buildEmpty();
    for (const r of ROUNDS) for (const p of PLAYERS) {
      expect(tom.scores[r.id][p.id].every((h) => h.s === null && h.gir === null && h.fw === null && h.p === null)).toBe(true);
      expect(tom.beers[r.id][p.id]).toEqual([]);
    }
  });
});
