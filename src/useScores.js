import { useCallback, useEffect, useRef, useState } from "react";
import { doc, onSnapshot, setDoc, writeBatch } from "firebase/firestore";
import { db, firebaseEnabled } from "./firebase";
import {
  PLAYERS, ROUNDS, MAX_BEERS,
  blankScores, normalizeHoles, normalizeScores,
  blankBeers, normalizeBeerList, normalizeBeers,
} from "./data";

/* =========================================================
   SYNK

   Datamodell i Firestore: tre dokument, ett per runda.

     /rounds/fre  { jonsson: [18 × {s,gir,fw,p}], johansson: [...], ...,
                    beers: { jonsson: [{hole,ts}, ...], ... } }
     /rounds/lor  { ... }
     /rounds/son  { ... }

   Ölmätaren ligger alltså i samma dokument som scoren och följer samma
   väg: optimistisk uppdatering, samma debounce och samma offlinekö.
   Kön är per (runda, spelare) — en skrivning tar med både hålen och
   ölen för de spelare som ändrats.

   Tre onSnapshot-lyssnare ger live-uppdatering för hela sällskapet.
   Skrivningar samlas ihop och skickas ~1 s efter sista knapptryck,
   som en merge per runda — snabb inmatning blir alltså en skrivning,
   inte en per klick.

   Offline: allt visas optimistiskt direkt, den lokala kopian ligger i
   localStorage tillsammans med en kö över osynkade spelare/rundor.
   När nätet är tillbaka töms kön automatiskt.
   ========================================================= */

const CACHE_KEY = "loscuatro-scores-cache-v1";
const BEER_KEY = "loscuatro-beers-cache-v1";
const QUEUE_KEY = "loscuatro-queue-v1";
const ME_KEY = "loscuatro-me-v1";

const DEBOUNCE_MS = 1000;
const RETRY_MS = 15000;
const SLOW_WRITE_MS = 8000;

const read = (key) => {
  try { return JSON.parse(localStorage.getItem(key) || "null"); } catch { return null; }
};
const write = (key, val) => {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* full disk / privat läge */ }
};

export function useScores() {
  const [scores, setScores] = useState(() => {
    const cached = read(CACHE_KEY);
    return cached ? normalizeScores(cached) : blankScores();
  });
  const [beers, setBeers] = useState(() => {
    const cached = read(BEER_KEY);
    return cached ? normalizeBeers(cached) : blankBeers();
  });
  const [sync, setSync] = useState(firebaseEnabled ? "loading" : "ok");

  /* Alltid färskaste värdena, utan att binda om callbacks. */
  const scoresRef = useRef(scores);
  scoresRef.current = scores;
  const beersRef = useRef(beers);
  beersRef.current = beers;

  /* Kön av osynkade ändringar: { [roundId]: { [playerId]: seq } }.
     Sekvensnumret gör att en skrivning bara plockar bort det den
     faktiskt hann skicka — nyare ändringar ligger kvar i kön. */
  const queueRef = useRef(read(QUEUE_KEY) || {});
  const seqRef = useRef(0);
  const timerRef = useRef(null);
  const inFlightRef = useRef(false);
  const slowRef = useRef(null);
  const resettingRef = useRef(false);

  const persistQueue = useCallback(() => write(QUEUE_KEY, queueRef.current), []);

  const queueSize = useCallback(() => {
    let n = 0;
    for (const rid of Object.keys(queueRef.current)) n += Object.keys(queueRef.current[rid] || {}).length;
    return n;
  }, []);

  const isQueued = useCallback((rid, pid) => queueRef.current[rid]?.[pid] !== undefined, []);

  /* ---------- skrivning ---------- */

  const flush = useCallback(async () => {
    if (!firebaseEnabled || inFlightRef.current || resettingRef.current) return;

    const rids = Object.keys(queueRef.current).filter(
      (rid) => Object.keys(queueRef.current[rid] || {}).length > 0
    );
    if (!rids.length) {
      setSync("ok");
      return;
    }

    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      setSync("error");
      return;
    }

    inFlightRef.current = true;
    setSync("saving");

    /* Hänger skrivningen (typiskt tappad uppkoppling mitt i swingen)
       flaggar vi det i gränssnittet men behåller kön. */
    clearTimeout(slowRef.current);
    slowRef.current = setTimeout(() => setSync("error"), SLOW_WRITE_MS);

    let failed = false;

    await Promise.all(
      rids.map(async (rid) => {
        const sent = { ...queueRef.current[rid] };
        const payload = { beers: {} };
        for (const pid of Object.keys(sent)) {
          payload[pid] = scoresRef.current[rid][pid];
          payload.beers[pid] = beersRef.current[rid][pid];
        }

        try {
          await setDoc(doc(db, "rounds", rid), payload, { merge: true });
          const cur = queueRef.current[rid] || {};
          for (const [pid, seq] of Object.entries(sent)) {
            if (cur[pid] === seq) delete cur[pid];
          }
        } catch (err) {
          failed = true;
          if (import.meta.env.DEV) console.warn("[sync] skrivning misslyckades", rid, err);
        }
      })
    );

    clearTimeout(slowRef.current);
    persistQueue();
    inFlightRef.current = false;

    const left = queueSize();
    setSync(failed || left > 0 ? (failed ? "error" : "saving") : "ok");

    /* Ändringar som kom in medan skrivningen pågick skickas direkt. */
    if (!failed && left > 0) {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(flush, DEBOUNCE_MS);
    }
  }, [persistQueue, queueSize]);

  const schedule = useCallback(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(flush, DEBOUNCE_MS);
  }, [flush]);

  /* ---------- optimistisk uppdatering ---------- */

  /* Markerar (runda, spelare) som osynkad och startar debouncen.
     Både score och öl går genom samma kö — en skrivning tar med båda. */
  const touch = useCallback((rid, pid) => {
    queueRef.current[rid] = queueRef.current[rid] || {};
    queueRef.current[rid][pid] = ++seqRef.current;
    persistQueue();

    if (firebaseEnabled) {
      setSync("saving");
      schedule();
    }
  }, [persistQueue, schedule]);

  const set = useCallback((rid, pid, hi, field, val) => {
    setScores((prev) => {
      const next = {
        ...prev,
        [rid]: {
          ...prev[rid],
          [pid]: prev[rid][pid].map((h, i) => (i === hi ? { ...h, [field]: val } : h)),
        },
      };
      scoresRef.current = next;
      write(CACHE_KEY, next);
      return next;
    });

    touch(rid, pid);
  }, [touch]);

  /* ---------- ölmätare ---------- */

  const writeBeers = useCallback((rid, pid, next) => {
    setBeers((prev) => {
      const all = { ...prev, [rid]: { ...prev[rid], [pid]: next } };
      beersRef.current = all;
      write(BEER_KEY, all);
      return all;
    });
    touch(rid, pid);
  }, [touch]);

  const addBeer = useCallback((rid, pid, holeNo) => {
    const cur = beersRef.current[rid][pid];
    if (cur.length >= MAX_BEERS) return;
    writeBeers(rid, pid, [...cur, { hole: holeNo, ts: new Date().toISOString() }]);
  }, [writeBeers]);

  /* Ångra tar bort den senast loggade ölen, inte den på det hål man
     råkar stå på — listan är kronologisk. */
  const undoBeer = useCallback((rid, pid) => {
    const cur = beersRef.current[rid][pid];
    if (!cur.length) return;
    writeBeers(rid, pid, cur.slice(0, -1));
  }, [writeBeers]);

  /* ---------- nollställning ---------- */

  /* Skriver tomma hål för alla fyra spelare i alla tre rundor som en enda
     batch — antingen går allt igenom eller ingenting. Lokalt läge rörs
     inte förrän servern bekräftat; kastar felet vidare till anroparen. */
  const reset = useCallback(async () => {
    const cleared = blankScores();
    const clearedBeers = blankBeers();

    resettingRef.current = true;
    clearTimeout(timerRef.current);
    clearTimeout(slowRef.current);

    try {
      if (firebaseEnabled) {
        setSync("saving");
        const batch = writeBatch(db);
        for (const r of ROUNDS) {
          batch.set(doc(db, "rounds", r.id), { ...cleared[r.id], beers: clearedBeers[r.id] });
        }
        await batch.commit();
      }
    } catch (err) {
      /* Servern sa nej: behåll både lokal data och osynkad kö orörda. */
      setSync("error");
      throw err;
    } finally {
      resettingRef.current = false;
    }

    queueRef.current = {};
    persistQueue();
    scoresRef.current = cleared;
    setScores(cleared);
    write(CACHE_KEY, cleared);
    beersRef.current = clearedBeers;
    setBeers(clearedBeers);
    write(BEER_KEY, clearedBeers);
    setSync("ok");
  }, [persistQueue]);

  /* ---------- lyssnare ---------- */

  useEffect(() => {
    if (!firebaseEnabled) return undefined;

    /* Sekvensräknaren måste börja över allt som redan ligger i kön,
       annars kan en gammal skrivning nolla en nyare ändring. */
    let max = 0;
    for (const rid of Object.keys(queueRef.current)) {
      for (const seq of Object.values(queueRef.current[rid] || {})) {
        if (typeof seq === "number" && seq > max) max = seq;
      }
    }
    seqRef.current = max;

    let first = ROUNDS.length;

    const unsubs = ROUNDS.map((r) =>
      onSnapshot(
        doc(db, "rounds", r.id),
        (snap) => {
          const remote = snap.exists() ? snap.data() : {};
          setScores((prev) => {
            const nextRound = { ...prev[r.id] };
            let changed = false;
            for (const p of PLAYERS) {
              /* Egna osynkade ändringar vinner tills de gått iväg. */
              if (isQueued(r.id, p.id)) continue;
              const incoming = normalizeHoles(remote[p.id]);
              if (JSON.stringify(incoming) !== JSON.stringify(prev[r.id][p.id])) {
                nextRound[p.id] = incoming;
                changed = true;
              }
            }
            if (!changed) return prev;
            const next = { ...prev, [r.id]: nextRound };
            scoresRef.current = next;
            write(CACHE_KEY, next);
            return next;
          });

          setBeers((prev) => {
            const nextRound = { ...prev[r.id] };
            let changed = false;
            for (const p of PLAYERS) {
              if (isQueued(r.id, p.id)) continue;
              const incoming = normalizeBeerList(remote.beers?.[p.id]);
              if (JSON.stringify(incoming) !== JSON.stringify(prev[r.id][p.id])) {
                nextRound[p.id] = incoming;
                changed = true;
              }
            }
            if (!changed) return prev;
            const next = { ...prev, [r.id]: nextRound };
            beersRef.current = next;
            write(BEER_KEY, next);
            return next;
          });

          if (first > 0 && --first === 0) {
            setSync(queueSize() > 0 ? "saving" : "ok");
            if (queueSize() > 0) schedule();
          }
        },
        (err) => {
          if (import.meta.env.DEV) console.warn("[sync] lyssnare avbröts", r.id, err);
          setSync("error");
        }
      )
    );

    return () => unsubs.forEach((u) => u());
  }, [isQueued, queueSize, schedule]);

  /* ---------- återförsök när nätet kommer tillbaka ---------- */

  useEffect(() => {
    if (!firebaseEnabled) return undefined;

    const retry = () => { if (queueSize() > 0) flush(); };
    const onOffline = () => { if (queueSize() > 0) setSync("error"); };
    const onVisible = () => { if (document.visibilityState === "visible") retry(); };

    window.addEventListener("online", retry);
    window.addEventListener("offline", onOffline);
    document.addEventListener("visibilitychange", onVisible);
    const iv = setInterval(retry, RETRY_MS);

    return () => {
      window.removeEventListener("online", retry);
      window.removeEventListener("offline", onOffline);
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(iv);
      clearTimeout(timerRef.current);
      clearTimeout(slowRef.current);
    };
  }, [flush, queueSize]);

  return { scores, beers, set, addBeer, undoBeer, sync, reset };
}

/* =========================================================
   VEM ÄR DU — per enhet, delas inte
   ========================================================= */

export function useMe() {
  const [me, setMe] = useState(() => {
    try {
      const v = localStorage.getItem(ME_KEY);
      return PLAYERS.some((p) => p.id === v) ? v : null;
    } catch { return null; }
  });

  const chooseMe = useCallback((id) => {
    setMe(id);
    try { localStorage.setItem(ME_KEY, id); } catch { /* ignore */ }
  }, []);

  return [me, chooseMe];
}
