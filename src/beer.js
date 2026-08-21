import { PLAYERS } from "./data";

/* =========================================================
   ÖLKURVAN — beräkningar

   Ölnivån för ett hål är antalet öl spelaren hunnit logga före eller
   på det hålet. Varje spelat hål hamnar därmed i exakt en nivå, och
   snittet över par per nivå är det som ritas ut i grafen.
   ========================================================= */

export const beerLevelAt = (beers, holeNo) =>
  beers.reduce((n, b) => (b.hole <= holeNo ? n + 1 : n), 0);

/* Alla spelade hål för en spelare, grupperade per ölnivå.
   → [{ level, holes, avg }] sorterad på stigande nivå. */
export function beerLevels(rounds, scores, beers, playerId) {
  const buckets = new Map();

  for (const r of rounds) {
    const hs = scores[r.id]?.[playerId] || [];
    const bs = beers[r.id]?.[playerId] || [];
    hs.forEach((h, i) => {
      if (h.s == null) return;
      const level = beerLevelAt(bs, i + 1);
      const b = buckets.get(level) || { level, holes: 0, sum: 0 };
      b.holes++;
      b.sum += h.s - r.holes[i].par;
      buckets.set(level, b);
    });
  }

  return [...buckets.values()]
    .map((b) => ({ level: b.level, holes: b.holes, avg: b.sum / b.holes }))
    .sort((a, b) => a.level - b.level);
}

/* Viktad linjär regression genom punkterna (ölnivå, snitt över par).
   Varje punkt väger lika mycket som antalet hål bakom den, så en nivå
   med ett enda hål drar inte lika hårt som en med sex.
   Lutningen är slag per öl. Null när underlaget inte räcker. */
export function weightedSlope(points) {
  if (!points || points.length < 2) return null;

  let sw = 0, swx = 0, swy = 0, swxx = 0, swxy = 0;
  for (const p of points) {
    const w = p.holes;
    sw += w;
    swx += w * p.level;
    swy += w * p.avg;
    swxx += w * p.level * p.level;
    swxy += w * p.level * p.avg;
  }

  const den = sw * swxx - swx * swx;
  if (!sw || Math.abs(den) < 1e-9) return null;
  return (sw * swxy - swx * swy) / den;
}

/* Kurvan för alla fyra spelare i ett svep. */
export function beerCurves(rounds, scores, beers) {
  return PLAYERS.map((p) => {
    const points = beerLevels(rounds, scores, beers, p.id);
    return {
      ...p,
      points,
      holes: points.reduce((s, x) => s + x.holes, 0),
      slope: weightedSlope(points),
    };
  });
}

/* "0,30 slag bättre / öl". Aldrig med minustecken — riktningen står
   i klartext i stället, så det inte går att missförstå åt vilket håll. */
export function slopeText(slope) {
  if (slope == null) return "—";
  if (Math.abs(slope) < 0.005) return "Ingen skillnad / öl";
  const v = Math.abs(slope).toFixed(2).replace(".", ",");
  return `${v} slag ${slope < 0 ? "bättre" : "sämre"} / öl`;
}
