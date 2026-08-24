/* =========================================================
   LOS CUATRO MASTERS — resedata, tema och scoremodell
   Spanien 11–13 september
   ========================================================= */

/* Porträtten ligger i src/assets och buntas av Vite: små filer blir
   base64 i JS-bundeln, större hamnar som egna filer i dist/assets.
   600×600 räcker gott — de visas som 56 px miniatyrer. */
import larsImg from "./assets/lars.jpeg";
import perImg from "./assets/per.jpeg";
import jonssonImg from "./assets/jonsson.jpeg";
import johanssonImg from "./assets/johansson.jpeg";

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

/* ---------- Scoreskalan mot par ----------

   Dubbelkodad, för att fungera vid rödgrön färgblindhet:

   1. Färgen ligger på blå–bärnstensaxeln i stället för grön–röd.
      Ingen grön ton får användas för att signalera score — appens
      fairwaygröna bakgrund är en annan sak.
   2. `shape` är golfens egen formkonvention på resultatsiffran:
      ring = birdie, dubbel ring = eagle, ruta = bogey, dubbel ruta =
      dubbel eller sämre, par omarkerat.

   Båda bär samma information, så inget går förlorat om färgen inte
   uppfattas. Läggs ny scorekodning till någonstans ska den hämtas
   härifrån — inte hårdkodas.

   `ink` är siffrans färg på den fyllda rutan, `text` samma sak när
   siffran står som ren text på pappersbotten. */
export const SCORE = {
  eagle:  { t: "Eagle eller bättre", c: "#E4C13D", ink: "#0A2A21", text: "#8F7310", shape: "circle2" },
  birdie: { t: "Birdie",             c: "#6FA8DC", ink: "#0A2A21", text: "#2F6FAF", shape: "circle" },
  par:    { t: "Par",                c: "#F3EEDD", ink: "#16281F", text: "#16281F", shape: "none" },
  bogey:  { t: "Bogey",              c: "#D98A3D", ink: "#0A2A21", text: "#A05C15", shape: "square" },
  double: { t: "Dubbel eller sämre", c: "#7A3520", ink: "#F3EEDD", text: "#7A3520", shape: "square2" },
};

export const SCORE_ORDER = ["eagle", "birdie", "par", "bogey", "double"];

export const scoreBand = (d) =>
  d <= -2 ? "eagle" : d === -1 ? "birdie" : d === 0 ? "par" : d === 1 ? "bogey" : "double";

/* Summor mot par är inte hål och får ingen form — bara skalans
   ytterfärger. En uppsättning för mörk botten, en för papper. */
export const TOPAR_DARK = { under: "#6FA8DC", even: "#F3EEDD", over: "#D98A3D" };
export const TOPAR_PAPER = { under: "#2F6FAF", even: "#16281F", over: "#A05C15" };

export const FONT = "'Inter', system-ui, -apple-system, sans-serif";
export const DISPLAY = "'Oswald', 'Arial Narrow', sans-serif";
export const MONO = "'Space Mono', ui-monospace, monospace";

/* ---------- Trip data ---------- */

/* Årets upplaga. Ligger samlat här så årtalet bara står på ett ställe
   — headern visar det på varje flik. */
export const EVENT = {
  year: "2026",
  place: "Costa del Sol",
  dates: "11–13 sep",
};

/* Ljushetstrappa: två varma och två kalla toner, parvis åtskilda i
   ljushet. Vid rödgrön färgblindhet läses de som ljus gul, mörk
   gulbrun, ljusblå och mörkblå — fyra tydliga steg. Salviagrön och
   terrakotta låg tidigare båda på en dov gulgrå ton och gick inte
   att skilja åt i en 9 px prick.

   Alla fyra måste synas både mot fairwaygrönt och mot pappersfärgade
   kort, vilket utesluter såväl mycket ljusa som mycket mörka toner.
   I Ölkurvan kompletteras färgen med streckmönster, se LINE_DASH. */
export const PLAYERS = [
  { id: "jonsson", name: "Jonsson", color: "#E4C13D" },
  { id: "johansson", name: "Johansson", color: "#7FB8E3" },
  { id: "per", name: "Per", color: "#B4652A" },
  { id: "lars", name: "Lars", color: "#3C6FB0" },
];

/* ---------- Baninledningar ---------- */

/* Visas högst upp i Banguiden, ovanför håltabellen. Två banor, tre
   rundor — lördagen och söndagen delar Alohas inledning. */
export const SANTANA_INTRO = {
  title: "Santana Golf & Country Club",
  sub: "Cabell B. Robinson, 2003 · Mijas Costa",
  body: [
    "Där det idag ligger en av Costa del Sols mest välskötta banor växte en gång en av Europas största avokadoplantager. Cabell B. Robinson lät terrängen vara som den var, och resultatet blev en bana som är platt nog att gå men listig nog att straffa den som slarvar. Fairways är breda och ärliga. Greenerna är det inte.",
    "Santana talar om exakt vad som krävs på varje hål. Problemet är att lyssna. Här ligger också det längsta hålet på hela kusten — 602 meter på åttan — och ett artonde hål som få avslutar utan att svettas.",
  ],
};

export const ALOHA_INTRO = {
  title: "Aloha Golf Club",
  sub: "Javier Arana, 1975 · Nueva Andalucía, Marbella",
  body: [
    "Aloha var Javier Aranas sista verk, och många menar att det också var hans bästa. Banan öppnade 1975 i Marbellas Golf Valley och har sedan dess hunnit vara värd för både Europatouren och Spanish Open.",
    "Arana fick inte plats med de långa par fyra han helst byggde, så han gjorde något annat: fyra korta hål på runt 300 meter som ser ofarliga ut och inte är det, och fyra par tre som är allt annat än en paus. Tre av dem är över 200 meter.",
    "Varje hål på Aloha har ett eget namn. Det tionde heter Javier Arana. Det säger det mesta om vad klubben tycker om sin arkitekt.",
  ],
};

/* ---------- Hål för hål ----------

   Index = hålnummer − 1. Texterna utgår från de bakre teerna, samma
   som meteruppgifterna i tabellerna. Santana har inga hålnamn. */

const SANTANA_NOTES = [
  "Mjuk öppning och dogleg höger. Ingen driver behövs — lägg dig vid hörnet och gå in med wedge. Greenen lutar bakifrån och fram, så missa hellre kort än långt.",
  "En sjö med stenmur vaktar greenens vänstersida. Sitter flaggan till vänster: sikta höger, ta dina två puttar och gå vidare nöjd.",
  "Svag dogleg höger, nedför från tee och sedan uppför till en upphöjd green. Vänster om greenen är död — behöver du en utväg, ta höger.",
  "Upphöjd tee med bunkrar till höger på cirka 250 meter. En stenklädd ravin ligger 60 meter framför greenen där fairway smalnar till 15 meter. Lägg upp och var nöjd med det.",
  "Bunkrar till höger som de långa kan bära över. Upphöjd green med kraftig lutning framåt — håll approachen under hålet.",
  "Kort hål som försvarar sig med greenen i stället för längden. Höger om greenen blir besvärligt, bunkrarna framme till vänster är otäcka, och putten lutar åt alla håll samtidigt.",
  "Eukalyptusträden bildar en smal pelargång 40 meter framför greenen. Slaget måste vara spikrakt — det går inte att starta vänster och fada tillbaka.",
  "Kustens längsta hål. Långt, smalt och böjer åt höger med OB på högersidan. Greenens ingång är obevakad, så låga rullande slag fungerar.",
  "Skålformad fairway som styr tillbaka snedslag. Sikta på den bortersta palmen. Öppen greeningång med bunkrar bara på sidorna — ett vänligt hål efter de två föregående.",
  "Nedförsfairway som gör hålet nåbart på två. Haken är sjön framför greenens vänstra del: attackerar du flaggan måste du flyga hela vägen fram.",
  "Kort dogleg höger, uppför in mot green. Träden i hörnet blockerar den direkta linjen. Spela som Robinson tänkt — järn till hörnet, wedge in.",
  "Nedförs, så det spelar kortare än siffran säger. Liten green som lutar åt alla håll. Missa den inte: det finns inga enkla chippar och inga enkla puttar.",
  "Fairway i en skål mellan två svackor som samlar tillbaka snedslag. Framför och höger om greenen finns avrinning — sikta bak vänster.",
  "Driveable. Inget ligger direkt framför greenen, men flaskhalsen och bunkrarna till höger väntar. Missar du får du en knepig wedge på 30–40 meter.",
  "Sikta på vattentornet i fjärran. Greenen ligger tuckad till vänster med sjö på högersidan. Belönar den som går för det på två, utan att straffa den som lägger upp.",
  "Delar sjön med femtonde men den kommer sällan i spel. Stor bunker till vänster, liten potbunker till höger — och gå framför allt inte långt.",
  "Greenen ligger gömd bakom en dunge avokadoträd till höger. Tre långa bunkrar längs vänstersidan, och OB tätt inpå både höger om och bakom greenen.",
  "Ett av kustens tuffaste avslutningshål. Sjön följer hela högersidan och vaktar greenen, avokadoträden lurar till vänster. Greenen lutar kraftigt — håll dig under hålet.",
];

const ALOHA_NAMES = [
  "Miguel Ángel Jiménez", "Uresandi", "Los Olivos", "Cortavitarte", "La Fuente",
  "Prunus-Pisardi", "El Ruedo", "Peñablanca", "El Jorobado",
  "Javier Arana", "Las Aguilas", "Cuidiao", "El Algarrobo", "Curluchu",
  "Camino Ronda", "Cancionero", "Obelix", "Vistoso",
];

const ALOHA_NOTES = [
  "Lång par 5 med vatten hela vägen längs vänstersidan. Den djärva linjen skär förbi träden till vänster, men att bära över dem kräver ett exceptionellt slag. Se upp för fairwaybunkern till vänster på andraslaget. En stor bunker vaktar greenen.",
  "Vatten kort till vänster, mer vatten längre fram till höger. Sikta vänster i fairway och välj klubba med omsorg. Golf Magazine har rankat hålet bland världens 500 bästa.",
  "Kort par 4. Vänster sida av fairway öppnar upp greenen, men bunkern till höger fångar in välträffade drives som går aningen åt fel håll. Greenen är däremot vänlig.",
  "Långt par 3 där även goda spelare behöver ett långt järn för att nå greenens bakre del. Dricksfontän vid tee.",
  "Positionsspel från tee. Träden till höger stör andraslaget, och greenen ligger i tre nivåer där flaggplaceringen avgör allt. Namnet kommer från källan vid sjön nära greenen.",
  "Ett långt hål där huvudproblemet är att få utslaget mellan de två bunkrarna som markerar doglegen. Uppkallat efter träden med de lila bladen.",
  "Kort hål med ett val: lägg upp vänster om bunkern, eller ta driver över krönet. Når du inte över får du ett blindslag ner till en gömd green.",
  "Banans enda hål helt utan bunkrar. Svårigheten ligger i greenen, som lutar kraftigt från vänster till höger. La Concha reser sig i bakgrunden — samma berg som finns i klubbens logotyp.",
  "Sikta vänster för att undvika fairwaybunkern på högersidan. En bunker vaktar greenens framkant. Sedan väntar halvvägshuset, och det är ingen dum idé att stanna till.",
  "Uppkallat efter banans arkitekt, och byggt därefter. Dubbel fairway, sjöar och fontäner. Håll dig till höger — allting lutar åt vänster. Greenen är kuperad och flaggplaceringen avgör din par.",
  "Undvik vänstersidan, där sluttningen samlar in bollen till svåra lägen kort om pilträdet. Andraslaget går uppför, så ta en klubba eller två mer. Greenen lutar kraftigt bakifrån och fram.",
  "Strategiskt och svårt. Tjock ruff, vattenhinder till vänster och ett vildoliveträd mitt i fairway som stör det nedförslutande andraslaget. Greenen i sig är en av banans enklaste, men den vaktas av både vatten och bunkrar. Dricksfontän vid tee.",
  "Långt och uppför, till en stor green i två nivåer. Johannesbrödträdet till vänster om greenen utsågs 2006 till Costa del Sols finaste botaniska exemplar.",
  "Dogleg höger med OB längs hela högersidan. Upphöjd green med bunker till vänster, men fri ingång framifrån.",
  "Svag dogleg höger. Spela höger om mitten — fairway lutar mot bunkern till vänster. Andraslaget måste pitcha på greenen, allt kort samlas upp i svackan framför.",
  "Dogleg vänster. Nåbart på två, men andraslaget måste bära bunkrarna som omger greenen. Green i två nivåer och mycket svår.",
  "Långt par 3 där rådet är att spela vänster. Greenen bjuder inte på några större problem. Klippan framför bunkern gav hålet dess namn.",
  "Kanske kustens bästa avslutningshål. Välj mellan driver med risk för vattnet till vänster, eller ett kortare järn utan risk — andraslaget blir därefter. Green i två nivåer med en dold bunker bakom.",
];

/* Hålindex (stroke index) 1–18, ett per hål. Verifierade mot klubbens
   spelarguide respektive bandata — räkna inte om dem. */
const SANTANA_SI = [13, 9, 7, 3, 11, 17, 5, 1, 15, 4, 8, 10, 14, 18, 6, 16, 12, 2];
const ALOHA_SI = [6, 14, 18, 4, 10, 2, 8, 16, 12, 7, 3, 11, 1, 15, 9, 13, 17, 5];

/* `name` finns bara där banan namngett sina hål — Nine och Play ritar
   bara ut det när det är satt. */
const mkHoles = (rows, notes, si, names) => rows.map(([par, m], i) => ({
  hole: i + 1, par, m, si: si[i],
  note: notes[i],
  ...(names ? { name: names[i] } : {}),
}));

export const ALOHA = mkHoles([
  [5, 545], [4, 331], [4, 315], [3, 207], [5, 467], [4, 375], [4, 319], [3, 178], [4, 314],
  [5, 513], [4, 353], [4, 377], [3, 196], [4, 337], [4, 365], [5, 481], [3, 210], [4, 410],
], ALOHA_NOTES, ALOHA_SI, ALOHA_NAMES);

export const SANTANA = mkHoles([
  [4, 321], [3, 160], [4, 385], [5, 556], [4, 321], [4, 335], [3, 192], [5, 602], [4, 355],
  [5, 468], [4, 291], [3, 174], [4, 355], [4, 295], [5, 520], [3, 150], [4, 335], [4, 392],
], SANTANA_NOTES, SANTANA_SI);

export const ROUNDS = [
  {
    id: "fre", day: "Fredag", short: "Fre", date: "11 sep",
    course: "Santana Golf & Country Club", short_course: "Santana",
    location: "Mijas, Málaga",
    guideUrl: "https://santanagolf.com/hole-by-hole/",
    holes: SANTANA,
    intro: SANTANA_INTRO,
  },
  {
    id: "lor", day: "Lördag", short: "Lör", date: "12 sep",
    course: "Aloha Golf Club", short_course: "Aloha",
    location: "Marbella",
    guideUrl: "https://www.clubdegolfaloha.com/scorecard/",
    holes: ALOHA,
    intro: ALOHA_INTRO,
  },
  {
    id: "son", day: "Söndag", short: "Sön", date: "13 sep",
    course: "Aloha Golf Club", short_course: "Aloha",
    location: "Marbella",
    guideUrl: "https://www.clubdegolfaloha.com/scorecard/",
    holes: ALOHA,
    intro: ALOHA_INTRO,
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

/* =========================================================
   UPPLAGA II — 2025

   Statisk historik. Ligger med flit utanför Firestore: den är
   färdigspelad och ska varken synkas, cachas eller kunna ändras.

   Hål-för-hål-datan är omstrukturerad från scorekorten i data/
   (2025-*.csv, semikolonseparerade). HCP, hål-HCP och netto är
   utelämnade — appen räknar brutto.

   Summorna nedan är förräknade och stämmer mot scorekorten. Räkna
   inte om dem i appen; ligger de förräknade kan de inte glida isär
   från det som faktiskt spelades.
   ========================================================= */

export const EDITION_2025 = {
  year: 2025,
  rounds: [
    {
      id: "naranjos", date: "19 september", iso: "2025-09-19",
      course: "Los Naranjos Golf Club", parTotal: 72,
      par: [ 4,  5,  4,  3,  5,  4,  4,  3,  4,  4,  4,  3,  4,  5,  4,  4,  3,  5],
      scores: {
        jonsson:   [ 5, 10,  5,  5,  6,  5,  5,  5,  5,  5,  5,  5,  6,  7,  4,  5,  5,  6],
        johansson: [ 5,  9,  7,  5, 10,  9,  6,  5,  9,  6,  6,  5,  7,  9,  9,  7,  5,  9],
        per:       [ 4,  5,  7,  4,  6,  8,  4,  3,  5,  5,  5,  3,  6,  6,  3,  6,  4,  7],
        lars:      [ 5,  5,  4,  4,  5,  7,  5,  5,  5,  4,  5,  5,  6,  6,  4,  4,  5,  5],
      },
      totals: {
        jonsson:   { strokes:  99, over: 27 },
        johansson: { strokes: 128, over: 56 },
        per:       { strokes:  91, over: 19 },
        lars:      { strokes:  89, over: 17 },
      },
    },
    {
      id: "santana", date: "20 september", iso: "2025-09-20",
      course: "Santana Golf", parTotal: 72,
      par: [ 4,  3,  4,  5,  4,  4,  3,  5,  4,  5,  4,  3,  4,  4,  5,  3,  4,  4],
      scores: {
        jonsson:   [ 5,  4,  5,  6,  5,  4,  5,  6,  6,  5,  5,  4,  5,  4,  7,  3,  7,  6],
        johansson: [ 9,  4,  7,  9,  8,  7,  6,  8,  7,  9,  6,  4,  8,  6,  8,  5,  9,  9],
        per:       [ 5,  5,  4,  6,  5,  4,  3,  6,  5,  6,  4,  3,  5,  4,  6,  3,  4,  5],
        lars:      [ 5,  4,  4,  7,  4,  4,  4,  6,  4,  6,  5,  2,  5,  5,  4,  4,  5,  5],
      },
      totals: {
        jonsson:   { strokes:  92, over: 20 },
        johansson: { strokes: 129, over: 57 },
        per:       { strokes:  83, over: 11 },
        lars:      { strokes:  83, over: 11 },
      },
    },
    {
      id: "lagos", date: "21 september", iso: "2025-09-21",
      course: "Mijas Golf, Los Lagos", parTotal: 72,
      par: [ 5,  3,  4,  4,  5,  4,  4,  3,  4,  4,  3,  4,  5,  4,  5,  3,  4,  4],
      scores: {
        jonsson:   [ 7,  4,  6,  7,  6,  5,  6,  4,  6,  6,  3,  6,  7,  5,  5,  3,  5,  6],
        johansson: [ 7,  3,  5,  6,  9,  9,  9,  8,  6,  7,  6,  9,  8,  6,  7,  4,  5,  7],
        per:       [ 7,  3,  5,  6,  8,  6,  5,  4,  5,  3,  3,  5,  7,  5,  8,  4,  5,  4],
        lars:      [ 6,  4,  6,  4,  4,  4,  3,  5,  6,  4,  3,  5,  5,  4,  6,  4,  5,  5],
      },
      totals: {
        jonsson:   { strokes:  97, over: 25 },
        johansson: { strokes: 121, over: 49 },
        per:       { strokes:  93, over: 21 },
        lars:      { strokes:  83, over: 11 },
      },
    },
  ],

  /* Slutställning: totala bruttoslag över de tre rundorna, par 216. */
  parTotal: 216,
  standings: [
    { id: "lars", strokes: 255, over: 39 },
    { id: "per", strokes: 267, over: 51 },
    { id: "jonsson", strokes: 288, over: 72 },
    { id: "johansson", strokes: 378, over: 162 },
  ],

  /* Dream 18: lägsta score per hålnummer över de tre rundorna. */
  dream18: {
    rows: [
      { id: "per", strokes: 67 },
      { id: "lars", strokes: 73 },
      { id: "jonsson", strokes: 81 },
      { id: "johansson", strokes: 102 },
    ],
    note: "Per vann Dream 18 med sex slag trots att han förlorade mästerskapet med tolv. Hans bästa hål var bättre — Lars var jämnare.",
  },

  /* Nycklarna är desamma som i AWARDS i App.jsx, så sidan kan gå
     igenom samma lista med samma ikoner och rubriker. De som saknas
     ritas som "—". `ids` är en lista eftersom Comeback King delades. */
  awards: {
    comeback:    { ids: ["per", "jonsson", "johansson"], v: "4 slag bättre" },
    consistency: { ids: ["lars"], v: "±0,87" },
    clutch:      { ids: ["lars"], v: "0,17 bättre sista 3" },
    streak:      { ids: ["per"], v: "16 hål" },
    birdies:     { ids: ["lars"], v: "4 st" },
  },
  awardsNote: "Statistik för GIR, puttar och öl saknas för 2025.",

  courseNote: "Santana spelades även 2025, vilket gör årets fredagsrunda direkt jämförbar.",
};

/* =========================================================
   MÄSTERSKAPET — texterna till "Om mästerskapet"

   All text bor här, inte i JSX, så den går att redigera utan att
   röra gränssnittet. Sidan renderas av `Masters` i App.jsx.

   `MASTERS.editions` är listan över upplagor och ritas i den
   ordning den står, kronologiskt. En upplaga med bevarade scorekort
   får ett `data`-fält som pekar på sin datakonstant — `Masters`
   ritar `body` som text och slutställning plus utfällbara detaljer
   under. Upplaga II är den första med bevarade kort.
   ========================================================= */

export const PORTRAITS = {
  lars: larsImg,
  per: perImg,
  jonsson: jonssonImg,
  johansson: johanssonImg,
};

export const MASTERS = {
  title: "Los Cuatro Masters",
  founded: "Grundat MMXXIV · Costa del Sol · Andalusien",

  intro: [
    "I en tid då golfens själ alltför ofta offras på kommersialismens altare står Los Cuatro Masters kvar som en påminnelse om spelets ursprungliga ideal: vänskap, heder, och obeveklig statistisk redovisning.",
    "Sällskapet utgörs av fyra herrar från Kristinehamn, förenade sedan barndomen och numera stadda i den ålder då ryggen värker men självförtroendet är intakt. Sedan dess har de skingrats över Norden, men samlas varje år på nytt för att under tre rundor göra upp om den titel som ingen utomstående känner till men som för de invigda överskuggar allt annat.",
  ],

  residence: {
    title: "Residenset",
    body: [
      "Turneringens högkvarter är sedan grundandet beläget i Calahonda, i en villa upplåten av Per — vars initiativ till mästerskapet får anses vara hans främsta gärning, hans övriga meriter till trots. Boendet är kostnadsfritt. Denna omständighet har genom åren vuxit från praktisk detalj till helig institution, och må aldrig ifrågasättas av vare sig deltagare eller eftervärld.",
    ],
  },

  /* Ordningen här styr korten på sidan och är medvetet en annan än
     PLAYERS — namn och färg hämtas därifrån via id. */
  participants: {
    title: "Deltagarna",
    people: [
      {
        id: "lars",
        body: "Sällskapets otvivelaktigt främste spelare, en bedömning som han själv aldrig gjort anspråk på men som eftervärlden får anses ha fastställt. Hans spel präglas av en teknisk säkerhet de övriga endast kan betrakta med vördnad — ända till det ögonblick då en quick hook eller en välplacerad socket påminner samtliga närvarande om att även mästare är dödliga.",
      },
      {
        id: "per",
        body: "Mästerskapets grundare och dess jämnaste utövare. Där andra svänger mellan storhet och katastrof håller Per en linje av beundransvärd stadga. Denna yttre lugn har dock sitt pris, och vid enstaka tillfällen har temperamentet gjort sig påmint på ett sätt som fått medspelare att söka skydd bakom närmaste bunkerkant.",
      },
      {
        id: "jonsson",
        body: "En spelare med kapacitet att hålla samman nio hål av hög klass, varefter formen med matematisk pålitlighet lämnar honom. Bollflykten alternerar mellan hook och slice utan förvarning eller mönster, vilket gjort begreppet fairwayträff till något av en teoretisk konstruktion. Därtill bär han på en väldokumenterad skräck inför putten, ett förhållande som mästerskapets statistik numera obarmhärtigt kommer att belägga.",
      },
      {
        id: "johansson",
        body: "Sällskapets mest oförutsägbara element, som växlar mellan briljans och förfall inom loppet av ett och samma hål. Detta får dock ses i sitt rätta ljus: före 2024 hade han inte hållit i en klubba på trettio år. De framsteg han sedan dess uppvisat är av ett slag som normalt endast förekommer i uppbyggliga berättelser, och tvingar de övriga att med viss oro betrakta kommande upplagor.",
      },
    ],
  },

  editions: [
    {
      id: "i",
      title: "Upplaga I — 2024",
      body: [
        "Den första upplagan avgjordes över två dagar: La Cala Resort, Campo Asia den 6 september, och Atalaya Golf, Old Course den 7 september.",
        "Inga scorekort finns bevarade. Vad som då utspelade sig tillhör därmed den muntliga traditionen, där segrarens identitet växlar beroende på vem som berättar och hur sent på kvällen det sker.",
      ],
    },
    {
      id: "ii",
      title: "Upplaga II — 2025",
      body: [
        "Mästerskapets andra upplaga spelades över tre rundor i Andalusien. Lars Munther tog titeln med tolv slags marginal.",
      ],
      data: EDITION_2025,
    },
    {
      id: "iii",
      title: "Upplaga III — 2026",
      body: [
        "Med upplaga III inträder mästerskapet i sin dokumenterade era. Varje slag registreras. Varje putt räknas. Varje öl loggas. Eftervärlden kommer att veta.",
      ],
    },
  ],
};
