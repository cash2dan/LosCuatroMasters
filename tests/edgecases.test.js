import { describe, it, expect } from "vitest";
import { PLAYERS, ROUNDS, scoreBand, SCORE } from "../src/data";
import {
  roundStat, leaderboardRows, dream18Rows, cardStats, computeAwards, emptyScores, emptyBeers,
} from "../src/stats";
import { beerLevels, weightedSlope, slopeText } from "../src/beer";

/* =========================================================
   GRÄNSFALL

   Motorn ska varken krascha eller hitta på siffror när underlaget
   är tunt. Genomgående krav: saknat värde ska bli `null`, aldrig 0,
   så gränssnittet kan rita streck i stället för att ljuga.
   ========================================================= */

const R = ROUNDS[0];
const P = PLAYERS[0].id;

const tomma = () => emptyScores();
const inga = () => emptyBeers();

describe("helt tom data", () => {
  const scores = tomma(), beers = inga();

  it("scorekortet räknar noll spelade hål utan att krascha", () => {
    const st = cardStats(R, scores[R.id][P]);
    expect(st.played).toBe(0);
    expect(st.total).toBe(null);
    expect(st.out).toBe(null);
    expect(st.in).toBe(null);
  });

  it("alla mått som saknar underlag är null, inte 0", () => {
    const st = cardStats(R, scores[R.id][P]);
    for (const k of ["gir", "fw", "putts", "puttsPerGir", "girSaved", "fwSaved", "scrambling"]) {
      expect(st[k]).toBe(null);
    }
  });

  it("par-summorna finns ändå — banan har par oavsett vad som spelats", () => {
    const st = cardStats(R, scores[R.id][P]);
    expect(st.parOut + st.parIn).toBe(R.holes.reduce((s, h) => s + h.par, 0));
  });

  it("leaderboard och dream 18 ger nollrader utan att kasta", () => {
    const lb = leaderboardRows(ROUNDS, scores, "all");
    expect(lb).toHaveLength(4);
    expect(lb.every((r) => r.played === 0 && r.strokes === 0)).toBe(true);
    const d = dream18Rows(ROUNDS, scores);
    expect(d.every((r) => r.filled === 0 && r.total === 0)).toBe(true);
  });

  it("inga awards delas ut", () => {
    const res = computeAwards(ROUNDS, scores, beers);
    for (const v of Object.values(res)) expect(v).toBe(null);
  });
});

describe("en enda spelare med ett enda hål", () => {
  const scores = tomma();
  scores[R.id][P][0] = { s: R.holes[0].par + 1, gir: null, fw: null, p: null };

  it("räknas som ett spelat hål, inte arton", () => {
    const st = cardStats(R, scores[R.id][P]);
    expect(st.played).toBe(1);
    expect(st.total.strokes).toBe(R.holes[0].par + 1);
    expect(st.total.toPar).toBe(1);
    expect(st.in).toBe(null);
  });

  it("leder leaderboarden, övriga hamnar sist", () => {
    const rows = leaderboardRows(ROUNDS, scores, "all");
    expect(rows[0].id).toBe(P);
    expect(rows.slice(1).every((r) => r.played === 0)).toBe(true);
  });

  it("dream 18 blir samma hål", () => {
    const row = dream18Rows(ROUNDS, scores).find((r) => r.id === P);
    expect(row.filled).toBe(1);
    expect(row.total).toBe(R.holes[0].par + 1);
  });
});

describe("halv runda: hål 1–9 ifyllda", () => {
  const scores = tomma();
  for (let i = 0; i < 9; i++) scores[R.id][P][i] = { s: R.holes[i].par, gir: null, fw: null, p: null };
  const st = cardStats(R, scores[R.id][P]);

  it("Ut räknas, In är null", () => {
    expect(st.out.strokes).toBe(R.holes.slice(0, 9).reduce((s, h) => s + h.par, 0));
    expect(st.out.toPar).toBe(0);
    expect(st.in).toBe(null);
  });

  it("totalen är lika med Ut", () => {
    expect(st.total.strokes).toBe(st.out.strokes);
    expect(st.total.toPar).toBe(0);
  });

  it("par-summan bygger bara på de spelade hålen", () => {
    const rs = roundStat(R, scores[R.id][P]);
    expect(rs.played).toBe(9);
    expect(rs.toPar).toBe(0);
  });
});

describe("noll puttar på ett hål (inchippat)", () => {
  const scores = tomma();
  scores[R.id][P][0] = { s: R.holes[0].par, gir: null, fw: null, p: 0 };
  scores[R.id][P][1] = { s: R.holes[1].par, gir: null, fw: null, p: 2 };

  it("noll är ett värde, inte saknat", () => {
    const st = cardStats(R, scores[R.id][P]);
    expect(st.putts.total).toBe(2);
    expect(st.putts.holes).toBe(2);
    expect(st.putts.total / st.putts.holes).toBe(1);
  });

  it("hålet med noll puttar räknas med i snittet per GIR-hål", () => {
    const s2 = tomma();
    s2[R.id][P][0] = { s: R.holes[0].par, gir: true, fw: null, p: 0 };
    const st = cardStats(R, s2[R.id][P]);
    expect(st.puttsPerGir.holes).toBe(1);
    expect(st.puttsPerGir.avg).toBe(0);
  });
});

describe("score utanför snabbknapparnas intervall", () => {
  it("3 på par 5 blir eagle och hamnar i rätt band", () => {
    const par5 = R.holes.findIndex((h) => h.par === 5);
    const scores = tomma();
    scores[R.id][P][par5] = { s: 3, gir: null, fw: null, p: null };
    const st = cardStats(R, scores[R.id][P]);
    expect(st.total.toPar).toBe(-2);
    expect(st.dist.eagle).toBe(1);
    expect(scoreBand(-2)).toBe("eagle");
    expect(SCORE.eagle.shape).toBe("circle2");
  });

  it("12 på ett hål hamnar i dubbel eller sämre", () => {
    const scores = tomma();
    scores[R.id][P][0] = { s: 12, gir: null, fw: null, p: null };
    const st = cardStats(R, scores[R.id][P]);
    expect(st.dist.double).toBe(1);
    expect(st.total.toPar).toBe(12 - R.holes[0].par);
    expect(scoreBand(12 - R.holes[0].par)).toBe("double");
  });

  it("hela skalan mappar rätt", () => {
    expect(scoreBand(-3)).toBe("eagle");
    expect(scoreBand(-1)).toBe("birdie");
    expect(scoreBand(0)).toBe("par");
    expect(scoreBand(1)).toBe("bogey");
    expect(scoreBand(2)).toBe("double");
    expect(scoreBand(9)).toBe("double");
  });
});

describe("delad award", () => {
  /* Två spelare med exakt samma antal birdies. */
  const scores = tomma(), beers = inga();
  const [a, b] = PLAYERS;
  for (const pid of [a.id, b.id]) {
    for (let i = 0; i < 4; i++) {
      scores[R.id][pid][i] = { s: R.holes[i].par - 1, gir: null, fw: null, p: null };
    }
  }

  it("motorn hittar rätt antal birdies", () => {
    const res = computeAwards(ROUNDS, scores, beers);
    expect(res.birdies.birdies).toBe(4);
  });

  it("båda spelarna redovisas som vinnare", () => {
    const res = computeAwards(ROUNDS, scores, beers);
    expect(res.birdies.winners?.map((w) => w.id).sort()).toEqual([a.id, b.id].sort());
  });
});

describe("alla fyra på exakt samma totalscore", () => {
  const scores = tomma();
  for (const p of PLAYERS) {
    for (let i = 0; i < 18; i++) {
      scores[R.id][p.id][i] = { s: R.holes[i].par, gir: null, fw: null, p: null };
    }
  }

  it("alla får samma toPar och ingen försvinner", () => {
    const rows = leaderboardRows(ROUNDS, scores, "all");
    expect(rows).toHaveLength(4);
    expect(rows.every((r) => r.toPar === 0 && r.played === 18)).toBe(true);
    expect(new Set(rows.map((r) => r.id)).size).toBe(4);
  });

  it("dream 18 ger samma summa åt alla", () => {
    const rows = dream18Rows(ROUNDS, scores);
    const summor = new Set(rows.map((r) => r.total));
    expect(summor.size).toBe(1);
  });
});

describe("spelare utan en enda loggad öl", () => {
  const scores = tomma(), beers = inga();
  for (let i = 0; i < 18; i++) {
    scores[R.id][P][i] = { s: R.holes[i].par, gir: null, fw: null, p: null };
  }

  it("alla hål hamnar på nivå 0", () => {
    const levels = beerLevels(ROUNDS, scores, beers, P);
    expect(levels).toHaveLength(1);
    expect(levels[0].level).toBe(0);
    expect(levels[0].holes).toBe(18);
  });

  it("ingen lutning går att räkna ut", () => {
    const levels = beerLevels(ROUNDS, scores, beers, P);
    expect(weightedSlope(levels)).toBe(null);
    expect(slopeText(null)).toBe("—");
  });

  it("The Optimizer delas inte ut", () => {
    expect(computeAwards(ROUNDS, scores, beers).optimizer).toBe(null);
  });
});

describe("GIR ifyllt men puttar tomt, och tvärtom", () => {
  it("GIR utan puttar: puttmåtten är null, GIR räknas", () => {
    const scores = tomma();
    for (let i = 0; i < 9; i++) {
      scores[R.id][P][i] = { s: R.holes[i].par, gir: true, fw: null, p: null };
    }
    const st = cardStats(R, scores[R.id][P]);
    expect(st.gir.ok).toBe(9);
    expect(st.putts).toBe(null);
    expect(st.puttsPerGir).toBe(null);
    expect(st.girSaved).toEqual({ ok: 9, of: 9 });
  });

  it("puttar utan GIR: GIR-måtten är null, puttar räknas", () => {
    const scores = tomma();
    for (let i = 0; i < 9; i++) {
      scores[R.id][P][i] = { s: R.holes[i].par, gir: null, fw: null, p: 2 };
    }
    const st = cardStats(R, scores[R.id][P]);
    expect(st.gir).toBe(null);
    expect(st.girSaved).toBe(null);
    expect(st.scrambling).toBe(null);
    expect(st.putts).toEqual({ total: 18, holes: 9 });
  });
});

describe("hål med score men utan GIR, fairway och puttar", () => {
  const scores = tomma();
  scores[R.id][P][0] = { s: R.holes[0].par, gir: null, fw: null, p: null };

  it("scoren räknas, resten är null", () => {
    const st = cardStats(R, scores[R.id][P]);
    expect(st.played).toBe(1);
    expect(st.total.strokes).toBe(R.holes[0].par);
    expect(st.gir).toBe(null);
    expect(st.fw).toBe(null);
    expect(st.putts).toBe(null);
    expect(st.scrambling).toBe(null);
  });
});

describe("fairway på par 3", () => {
  it("par 3 ingår aldrig i nämnaren", () => {
    const scores = tomma();
    const par3 = R.holes.findIndex((h) => h.par === 3);
    /* Även om fw felaktigt skulle vara satt på ett par 3 ska det
       varken höja täljaren eller nämnaren. */
    scores[R.id][P][par3] = { s: 3, gir: null, fw: true, p: null };
    const st = cardStats(R, scores[R.id][P]);
    expect(st.fw).toBe(null);
  });

  it("nämnaren är antalet hål som inte är par 3", () => {
    const scores = tomma();
    const par4 = R.holes.findIndex((h) => h.par !== 3);
    scores[R.id][P][par4] = { s: 4, gir: null, fw: true, p: null };
    const st = cardStats(R, scores[R.id][P]);
    expect(st.fw.of).toBe(R.holes.filter((h) => h.par !== 3).length);
    expect(st.fw.ok).toBe(1);
  });
});
