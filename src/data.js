/* =========================================================
   LOS CUATRO MASTERS — resedata, tema och scoremodell
   Spanien 11–13 september
   ========================================================= */

export const C = {
  fairway: "#0F3B2E",
  fairwayDark: "#0A2A21",
  fairwayMid: "#124635",
  line: "rgba(228,193,61,0.15)",
  paper: "#F3EEDD",
  paperDark: "#E8E0C8",
  paperInput: "#FBF8EE",
  gold: "#C9A227",
  goldBright: "#E4C13D",
  clay: "#B5533C",
  green: "#2E7D4F",
  ink: "#16281F",
  muted: "#6B6448",
  mutedGreen: "#8AA893",
  dim: "#5C7268",
};

export const FONT = "'Inter', system-ui, -apple-system, sans-serif";
export const DISPLAY = "'Oswald', 'Arial Narrow', sans-serif";
export const MONO = "'Space Mono', ui-monospace, monospace";

/* ---------- Trip data ---------- */

export const PLAYERS = [
  { id: "jonsson", name: "Jonsson", color: "#E4C13D" },
  { id: "johansson", name: "Johansson", color: "#7FA88C" },
  { id: "per", name: "Per", color: "#C97B5A" },
  { id: "lars", name: "Lars", color: "#8AA9C9" },
];

const mkHoles = (rows) => rows.map(([par, m], i) => ({ hole: i + 1, par, m }));

export const ALOHA = mkHoles([
  [5, 545], [4, 331], [4, 315], [3, 207], [5, 467], [4, 375], [4, 319], [3, 178], [4, 314],
  [5, 513], [4, 353], [4, 377], [3, 196], [4, 337], [4, 365], [5, 481], [3, 210], [4, 410],
]);

export const SANTANA = mkHoles([
  [4, 321], [3, 160], [4, 385], [5, 556], [4, 321], [4, 335], [3, 192], [5, 602], [4, 355],
  [5, 468], [4, 291], [3, 174], [4, 355], [4, 295], [5, 520], [3, 150], [4, 335], [4, 392],
]);

export const ROUNDS = [
  {
    id: "fre", day: "Fredag", short: "Fre", date: "11 sep",
    course: "Santana Golf & Country Club", short_course: "Santana",
    location: "Mijas, Málaga",
    guideUrl: "https://santanagolf.com/hole-by-hole/",
    holes: SANTANA,
  },
  {
    id: "lor", day: "Lördag", short: "Lör", date: "12 sep",
    course: "Aloha Golf Club", short_course: "Aloha",
    location: "Marbella",
    guideUrl: "https://www.clubdegolfaloha.com/scorecard/",
    holes: ALOHA,
  },
  {
    id: "son", day: "Söndag", short: "Sön", date: "13 sep",
    course: "Aloha Golf Club", short_course: "Aloha",
    location: "Marbella",
    guideUrl: "https://www.clubdegolfaloha.com/scorecard/",
    holes: ALOHA,
  },
];

/* ---------- Scoremodell ---------- */

export const blank = () => ({ s: null, gir: null, fw: null, p: null });

export const blankScores = () => {
  const o = {};
  for (const r of ROUNDS) {
    o[r.id] = {};
    for (const p of PLAYERS) o[r.id][p.id] = Array.from({ length: 18 }, blank);
  }
  return o;
};

/* Firestore tål inte undefined och kan i teorin leverera kortare/skeva
   arrayer. Allt som kommer utifrån tvättas genom den här. */
const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);
const bool = (v) => (v === true ? true : null);

export const normalizeHoles = (arr) =>
  Array.from({ length: 18 }, (_, i) => {
    const h = Array.isArray(arr) ? arr[i] : null;
    if (!h || typeof h !== "object") return blank();
    return { s: num(h.s), gir: bool(h.gir), fw: bool(h.fw), p: num(h.p) };
  });

export const normalizeRound = (data) => {
  const o = {};
  for (const p of PLAYERS) o[p.id] = normalizeHoles(data?.[p.id]);
  return o;
};

export const normalizeScores = (data) => {
  const o = {};
  for (const r of ROUNDS) o[r.id] = normalizeRound(data?.[r.id]);
  return o;
};

/* ---------- Ölmätare ---------- */

/* Ett tak per spelare och runda: skyddar både dokumentstorleken och
   grafen mot orimliga värden. Samma tak finns i firestore.rules. */
export const MAX_BEERS = 40;

export const blankBeers = () => {
  const o = {};
  for (const r of ROUNDS) {
    o[r.id] = {};
    for (const p of PLAYERS) o[r.id][p.id] = [];
  }
  return o;
};

/* En öl är { hole: 1–18, ts: ISO-sträng }. Listan är kronologisk i den
   ordning ölen loggats — det är den ordningen ångra-knappen backar i. */
export const normalizeBeerList = (arr) => {
  if (!Array.isArray(arr)) return [];
  const out = [];
  for (const b of arr) {
    if (!b || typeof b !== "object") continue;
    const hole = num(b.hole);
    if (hole == null || hole < 1 || hole > 18) continue;
    out.push({ hole: Math.round(hole), ts: typeof b.ts === "string" ? b.ts : null });
    if (out.length >= MAX_BEERS) break;
  }
  return out;
};

export const normalizeRoundBeers = (data) => {
  const o = {};
  for (const p of PLAYERS) o[p.id] = normalizeBeerList(data?.[p.id]);
  return o;
};

export const normalizeBeers = (data) => {
  const o = {};
  for (const r of ROUNDS) o[r.id] = normalizeRoundBeers(data?.[r.id]);
  return o;
};
