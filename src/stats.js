import { PLAYERS, ROUNDS } from "./data";
import { beerLevels, weightedSlope } from "./beer";

/* =========================================================
   BERÄKNINGAR

   Rena funktioner, utan React och utan Firestore. Allt som räknas
   ut i appen bor här så att det går att importera i tester och köra
   om hur många gånger som helst utan sidoeffekter.

   Genomgående regel: **hål utan inrapporterat slag räknas inte alls**
   — varken i par-summan, i snitten eller som noll. Och allt som kan
   sakna underlag returneras som `null`, aldrig som 0.
   ========================================================= */

/* ---------- Leaderboard ---------- */

/* Summering av en spelares runda. Bara ifyllda hål räknas, så en
   halvspelad runda ger halva par-summan och inte +36. */
export function roundStat(round, holesArr) {
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

/* `view` är "all" eller ett runda-id. `per` innehåller alltid alla
   rundor så dagkolumnerna kan ritas även i totalvyn. */
export function leaderboardRows(allRounds, scores, view, players = PLAYERS) {
  const rs = view === "all" ? allRounds : allRounds.filter((r) => r.id === view);
  return players.map((p) => {
    let strokes = 0, toPar = 0, played = 0, birdies = 0;
    const per = allRounds.map((r) => {
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
}

/* ---------- Dream 18 ---------- */

/* Lägsta score per hålnummer över alla rundor. Ett hålnummer som
   ingen runda har ifyllt räknas inte alls. */
export function dream18Rows(allRounds, scores, players = PLAYERS) {
  return players.map((p) => {
    const best = [];
    let total = 0, filled = 0;
    for (let i = 0; i < 18; i++) {
      let low = null;
      for (const r of allRounds) {
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
  });
}

/* ---------- Scorekortet ---------- */

/* Brutto, alltid. Hoppar man över ett hål räknas det inte alls —
   varken i par-summan eller i snitten.

   Allt som kan sakna underlag returneras som `null`, aldrig som 0.
   Sammanställningen ritar `null` som streck: noll greenträffar och
   "ingen har fyllt i green" är inte samma sak. */
export function cardStats(round, holes) {
  const hs = holes.map((h, i) => ({ ...round.holes[i], ...h }));
  const played = hs.filter((h) => h.s != null);

  const half = (arr) => {
    const pl = arr.filter((h) => h.s != null);
    if (!pl.length) return null;
    const strokes = pl.reduce((s, h) => s + h.s, 0);
    return { strokes, toPar: strokes - pl.reduce((s, h) => s + h.par, 0) };
  };

  const girHoles = hs.filter((h) => h.gir === true);
  const fwApplicable = hs.filter((h) => h.par !== 3);
  const fwHoles = fwApplicable.filter((h) => h.fw === true);
  const puttHoles = hs.filter((h) => h.p != null);

  /* Andel: null när det inte finns några tillfällen alls. */
  const share = (ok, of) => (of ? { ok, of } : null);

  const puttsOnGir = hs.filter((h) => h.gir === true && h.p != null);
  const girPlayed = girHoles.filter((h) => h.s != null);
  const fwPlayed = fwHoles.filter((h) => h.s != null);
  const missed = played.filter((h) => h.gir !== true);

  const dist = { eagle: 0, birdie: 0, par: 0, bogey: 0, double: 0 };
  played.forEach((h) => {
    const d = h.s - h.par;
    if (d <= -2) dist.eagle++;
    else if (d === -1) dist.birdie++;
    else if (d === 0) dist.par++;
    else if (d === 1) dist.bogey++;
    else dist.double++;
  });

  return {
    played: played.length,
    total: played.length ? {
      strokes: played.reduce((s, h) => s + h.s, 0),
      toPar: played.reduce((s, h) => s + (h.s - h.par), 0),
    } : null,
    out: half(hs.slice(0, 9)),
    in: half(hs.slice(9)),
    parOut: hs.slice(0, 9).reduce((s, h) => s + h.par, 0),
    parIn: hs.slice(9).reduce((s, h) => s + h.par, 0),

    gir: hs.some((h) => h.gir != null) ? share(girHoles.length, 18) : null,
    fw: fwApplicable.some((h) => h.fw != null) ? share(fwHoles.length, fwApplicable.length) : null,
    putts: puttHoles.length
      ? { total: puttHoles.reduce((s, h) => s + h.p, 0), holes: puttHoles.length }
      : null,

    /* Fördjupningens fyra mått. */
    puttsPerGir: puttsOnGir.length
      ? { avg: puttsOnGir.reduce((s, h) => s + h.p, 0) / puttsOnGir.length, holes: puttsOnGir.length }
      : null,
    girSaved: share(girPlayed.filter((h) => h.s - h.par <= 0).length, girPlayed.length),
    fwSaved: share(fwPlayed.filter((h) => h.s - h.par <= 0).length, fwPlayed.length),
    scrambling: hs.some((h) => h.gir != null)
      ? share(missed.filter((h) => h.s - h.par <= 0).length, missed.length)
      : null,

    dist,
  };
}

/* ---------- Awards ---------- */

/* Rådata per spelare. Bruten ut ur computeAwards så att den går att
   granska ett mått i taget i testerna. */
export function awardStats(rounds, scores, beers, players = PLAYERS) {
  return players.map((p) => {
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

      /* Räddade par kräver att greenen faktiskt är inrapporterad.
         Utan GIR-data är `gir !== true` sant på varje hål, och då
         skulle varje par räknas som en räddning — samma skydd som
         cardStats redan har. */
      if (hs.some((h) => h.gir != null)) {
        const opp = hs.filter((h) => h.s != null && h.gir !== true);
        scrOpp += opp.length;
        scr += opp.filter((h) => h.s - h.par <= 0).length;
      }

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
      scr: scrOpp ? scr : null, scrOpp, streak, birdies,
      optimizer: levels.length >= 3 ? slope : null,
      beerLevels: levels.length,
    };
  });
}

/* Vinnare per award.

   `winners` är alltid en lista: ligger flera spelare exakt lika ska
   alla visas, inte bara den första i PLAYERS-ordning. `p` finns kvar
   och pekar på den första av dem, för kod som bara vill ha en
   representant. */
export function computeAwards(rounds, scores, beers, players = PLAYERS) {
  const stats = awardStats(rounds, scores, beers, players);

  const pick = (k, dir = "max", ok = () => true) => {
    const c = stats.filter((s) => s[k] != null && ok(s));
    if (!c.length) return null;
    const best = c.reduce((b, s) => (!b ? s : dir === "max" ? (s[k] > b[k] ? s : b) : (s[k] < b[k] ? s : b)), null);
    return { ...best, winners: c.filter((s) => s[k] === best[k]).map((s) => s.p) };
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

/* ---------- Hjälp för tester och seed ---------- */

export const blankRoundScores = () =>
  Array.from({ length: 18 }, () => ({ s: null, gir: null, fw: null, p: null }));

/* Tomt scoreobjekt för godtyckliga rundor och spelare. */
export function emptyScores(rounds = ROUNDS, players = PLAYERS) {
  const o = {};
  for (const r of rounds) {
    o[r.id] = {};
    for (const p of players) o[r.id][p.id] = blankRoundScores();
  }
  return o;
}

export function emptyBeers(rounds = ROUNDS, players = PLAYERS) {
  const o = {};
  for (const r of rounds) {
    o[r.id] = {};
    for (const p of players) o[r.id][p.id] = [];
  }
  return o;
}
