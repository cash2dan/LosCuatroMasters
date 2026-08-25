import { describe, it, expect } from "vitest";
import { PLAYERS, EDITION_2025 } from "../src/data";
import { roundStat, leaderboardRows, dream18Rows, computeAwards, awardStats } from "../src/stats";
import { slopeText } from "../src/beer";
import { loadEdition2025, noBeers } from "./helpers";

/* =========================================================
   REFERENSTEST — 2025 ÅRS SCOREKORT

   Sviten viktigaste test. Scorekorten läses från data/*.csv och
   körs genom appens EGEN beräkningsmotor. Facit är de oberoende
   uträknade siffror som ligger hårdkodade i historiken på
   Mästerskapet-sidan.

   Stämmer det inte är antingen motorn eller historiken fel.
   ========================================================= */

const { rounds, scores } = loadEdition2025();
const beers = noBeers(rounds, PLAYERS);

const RUNDOR = {
  naranjos: { lars: 89, per: 91, jonsson: 99, johansson: 128 },
  santana: { lars: 83, per: 83, jonsson: 92, johansson: 129 },
  lagos: { lars: 83, per: 93, jonsson: 97, johansson: 121 },
};
const TOTALT = { lars: 255, per: 267, jonsson: 288, johansson: 378 };
const OVER_PAR = { lars: 39, per: 51, jonsson: 72, johansson: 162 };
const DREAM = { per: 67, lars: 73, jonsson: 81, johansson: 102 };

describe("2025: scorekorten läses rätt", () => {
  it("tre rundor med 18 hål och par 72 var", () => {
    expect(rounds).toHaveLength(3);
    for (const r of rounds) {
      expect(r.holes).toHaveLength(18);
      expect(r.holes.reduce((s, h) => s + h.par, 0)).toBe(72);
    }
  });

  it("alla fyra spelare har alla 18 hål ifyllda i varje runda", () => {
    for (const r of rounds) {
      for (const p of PLAYERS) {
        const hs = scores[r.id][p.id];
        expect(hs).toHaveLength(18);
        expect(hs.every((h) => typeof h.s === "number")).toBe(true);
      }
    }
  });
});

describe("2025: rundtotaler", () => {
  for (const [rid, facit] of Object.entries(RUNDOR)) {
    for (const [pid, strokes] of Object.entries(facit)) {
      it(`${rid} · ${pid} = ${strokes}`, () => {
        const round = rounds.find((r) => r.id === rid);
        const st = roundStat(round, scores[rid][pid]);
        expect(st.strokes).toBe(strokes);
        expect(st.played).toBe(18);
        expect(st.toPar).toBe(strokes - 72);
      });
    }
  }
});

describe("2025: slutställning", () => {
  const rows = leaderboardRows(rounds, scores, "all");

  for (const [pid, total] of Object.entries(TOTALT)) {
    it(`${pid} = ${total} (${OVER_PAR[pid] >= 0 ? "+" : ""}${OVER_PAR[pid]})`, () => {
      const row = rows.find((r) => r.id === pid);
      expect(row.strokes).toBe(total);
      expect(row.toPar).toBe(OVER_PAR[pid]);
    });
  }

  it("ordningen är Lars, Per, Jonsson, Johansson", () => {
    expect(rows.map((r) => r.id)).toEqual(["lars", "per", "jonsson", "johansson"]);
  });

  it("Lars vinner med tolv slag", () => {
    expect(rows[1].strokes - rows[0].strokes).toBe(12);
  });
});

describe("2025: Dream 18", () => {
  const rows = dream18Rows(rounds, scores);

  for (const [pid, total] of Object.entries(DREAM)) {
    it(`${pid} = ${total}`, () => {
      expect(rows.find((r) => r.id === pid).total).toBe(total);
    });
  }

  it("ordningen är Per, Lars, Jonsson, Johansson", () => {
    expect(rows.map((r) => r.id)).toEqual(["per", "lars", "jonsson", "johansson"]);
  });

  it("Per vinner Dream 18 med sex slag trots att han förlorade med tolv", () => {
    expect(rows[1].total - rows[0].total).toBe(6);
  });
});

describe("2025: awards", () => {
  const res = computeAwards(rounds, scores, beers);

  it("Comeback King: +4, delat av Per, Jonsson och Johansson", () => {
    expect(res.comeback.comeback).toBe(4);
    /* Facit i historiken säger tre delade vinnare. Motorn ska kunna
       redovisa alla, inte bara den första. */
    const delade = ["per", "jonsson", "johansson"];
    expect(res.comeback.winners?.map((w) => w.id).sort()).toEqual([...delade].sort());
  });

  it("Mr Consistency: Lars, ±0,87", () => {
    expect(res.consistency.p.id).toBe("lars");
    expect(res.consistency.consistency).toBeCloseTo(0.87, 2);
  });

  /* Historiken sa ursprungligen "Lars, 0,17 bättre på sista tre".
     Magnituden stämmer, men tecknet var omvänt: Lars sista tre var
     0,17 slag SÄMRE än hans rundsnitt. Ice Man går till den starkaste
     avslutningen, alltså Johansson. Historiken är rättad därefter. */
  it("Ice Man: Johansson, 0,11 bättre på sista tre", () => {
    expect(res.clutch.p.id).toBe("johansson");
    expect(res.clutch.clutch).toBeCloseTo(0.11, 2);
  });

  it("Lars avslutning var 0,17 sämre, inte bättre", () => {
    const lars = awardStats(rounds, scores, beers).find((s) => s.p.id === "lars");
    expect(lars.clutch).toBeCloseTo(-0.17, 2);
    expect(lars.clutch).toBeLessThan(0);
  });

  it("historikens Ice Man pekar på samma spelare som motorn", () => {
    expect(EDITION_2025.awards.clutch.ids).toEqual([res.clutch.p.id]);
  });

  it("Streak Master: Per, 16 hål i rad", () => {
    expect(res.streak.p.id).toBe("per");
    expect(res.streak.streak).toBe(16);
  });

  it("Birdie Machine: Lars, 4 birdies", () => {
    expect(res.birdies.p.id).toBe("lars");
    expect(res.birdies.birdies).toBe(4);
  });

  it("The Optimizer saknar underlag utan öl", () => {
    expect(res.optimizer).toBe(null);
    expect(slopeText(null)).toBe("—");
  });

  it("GIR, fairway och puttar saknar underlag för 2025", () => {
    expect(res.gir).toBe(null);
    expect(res.fw).toBe(null);
    expect(res.putts).toBe(null);
    expect(res.scr).toBe(null);
  });
});

describe("2025: EDITION_2025 i data.js stämmer mot csv-filerna", () => {
  const byId = Object.fromEntries(EDITION_2025.rounds.map((r) => [r.id, r]));

  for (const r of rounds) {
    it(`${r.id}: par och slag identiska`, () => {
      const e = byId[r.id];
      expect(e.par).toEqual(r.holes.map((h) => h.par));
      for (const p of PLAYERS) {
        expect(e.scores[p.id]).toEqual(scores[r.id][p.id].map((h) => h.s));
      }
    });

    it(`${r.id}: förräknade rundtotaler stämmer`, () => {
      const e = byId[r.id];
      for (const p of PLAYERS) {
        const st = roundStat(r, scores[r.id][p.id]);
        expect(e.totals[p.id].strokes).toBe(st.strokes);
        expect(e.totals[p.id].over).toBe(st.toPar);
      }
    });
  }

  it("förräknad slutställning stämmer mot motorn", () => {
    const rows = leaderboardRows(rounds, scores, "all");
    expect(EDITION_2025.standings.map((x) => x.id)).toEqual(rows.map((r) => r.id));
    for (const x of EDITION_2025.standings) {
      const row = rows.find((r) => r.id === x.id);
      expect(x.strokes).toBe(row.strokes);
      expect(x.over).toBe(row.toPar);
    }
  });

  it("förräknad Dream 18 stämmer mot motorn", () => {
    const rows = dream18Rows(rounds, scores);
    expect(EDITION_2025.dream18.rows.map((x) => x.id)).toEqual(rows.map((r) => r.id));
    for (const x of EDITION_2025.dream18.rows) {
      expect(x.strokes).toBe(rows.find((r) => r.id === x.id).total);
    }
  });
});
