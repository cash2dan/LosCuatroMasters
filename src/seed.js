import { PLAYERS, ROUNDS } from "./data";
import { blankRoundScores } from "./stats";

/* =========================================================
   SEED — realistisk testdata för visuell kontroll

   Ren funktion utan sidoeffekter: den bygger bara objekten.
   Skrivningen sker genom useScores egen kö, så synken, offline-kön
   och realtidslyssnarna testas på köpet.

   Modulen importeras bara av dev-panelen, som i sin tur bara
   renderas när import.meta.env.DEV är sant. Den följer alltså aldrig
   med i produktionsbygget.
   ========================================================= */

/* Målscore per spelare och runda. Speglar spelarnas nivå så att
   leaderboarden ser ut som den brukar. */
const NIVA = {
  lars: [83, 86, 89],
  per: [83, 88, 93],
  jonsson: [92, 95, 99],
  johansson: [120, 125, 130],
};

/* Deterministisk generator — samma frö ger samma data, så en bugg
   som syns i seed-läget går att återskapa. */
function rng(seed) {
  let x = seed >>> 0 || 1;
  return () => {
    x ^= x << 13; x >>>= 0;
    x ^= x >> 17;
    x ^= x << 5; x >>>= 0;
    return x / 0xffffffff;
  };
}

/* Fördelar `over` slag över par på 18 hål. Garanterar minst en
   birdie och minst en dubbelbogey, så hela färgskalan och alla
   formmarkeringar går att kontrollera visuellt. */
function fordela(over, rand) {
  const d = Array(18).fill(0);

  /* De två garanterade hålen låses, annars kan utjämningen nedan
     råka skriva över dem och färgskalan blir omöjlig att granska. */
  const birdie = Math.floor(rand() * 18);
  let dubbel = Math.floor(rand() * 18);
  while (dubbel === birdie) dubbel = (dubbel + 1) % 18;

  d[birdie] = -1;
  d[dubbel] = 2;
  const last = new Set([birdie, dubbel]);

  let kvar = over - 1;                             // -1 + 2 är redan utlagt
  const fritt = [...Array(18).keys()].filter((i) => !last.has(i));

  let varv = 0;
  while (kvar > 0 && varv < 2000) {
    const i = fritt[Math.floor(rand() * fritt.length)];
    const tak = kvar > 20 ? 6 : 3;
    if (d[i] < tak) { d[i]++; kvar--; }
    varv++;
  }
  while (kvar < 0 && varv < 4000) {
    const i = fritt[Math.floor(rand() * fritt.length)];
    if (d[i] > -1) { d[i]--; kvar++; }
    varv++;
  }
  return d;
}

function seedRound(round, pid, mal, rand) {
  const par = round.holes.reduce((s, h) => s + h.par, 0);
  const d = fordela(mal - par, rand);

  return round.holes.map((h, i) => {
    const s = Math.max(1, h.par + d[i]);
    /* GIR hänger ihop med resultatet: träffad green ger oftare par
       eller bättre, vilket gör scrambling och "par vid GIR"
       meningsfulla i stället för slumpbrus. */
    const gir = d[i] <= 0 ? rand() < 0.8 : rand() < 0.2;
    const fw = h.par === 3 ? null : (d[i] <= 1 ? rand() < 0.7 : rand() < 0.35) || null;
    const putts = gir
      ? (rand() < 0.7 ? 2 : rand() < 0.5 ? 1 : 3)
      : (rand() < 0.55 ? 2 : rand() < 0.7 ? 1 : 3);
    return { s, gir: gir || null, fw: fw || null, p: putts };
  });
}

/* Ölen sprids över rundan så The Optimizer får minst tre nivåer:
   fyra till sex öl, utlagda med jämna mellanrum från tidigt i rundan. */
function seedBeers(pid, rIndex, rand) {
  const antal = 4 + Math.floor(rand() * 3);
  const steg = 18 / (antal + 1);
  return Array.from({ length: antal }, (_, i) => {
    const hole = Math.min(18, Math.max(1, Math.round((i + 1) * steg + (rand() * 2 - 1))));
    return { hole, ts: new Date(2026, 8, 11 + rIndex, 11 + i, 15).toISOString() };
  }).sort((a, b) => a.hole - b.hole);
}

/* → { scores, beers } i exakt samma form som useScores håller dem. */
export function buildSeed(seed = 20260911) {
  const rand = rng(seed);
  const scores = {};
  const beers = {};

  ROUNDS.forEach((r, ri) => {
    scores[r.id] = {};
    beers[r.id] = {};
    for (const p of PLAYERS) {
      const mal = (NIVA[p.id] || [90, 90, 90])[ri];
      scores[r.id][p.id] = seedRound(r, p.id, mal, rand);
      beers[r.id][p.id] = seedBeers(p.id, ri, rand);
    }
  });

  return { scores, beers };
}

/* Tomt i samma form — används av "Rensa seed". */
export function buildEmpty() {
  const scores = {};
  const beers = {};
  for (const r of ROUNDS) {
    scores[r.id] = {};
    beers[r.id] = {};
    for (const p of PLAYERS) {
      scores[r.id][p.id] = blankRoundScores();
      beers[r.id][p.id] = [];
    }
  }
  return { scores, beers };
}
