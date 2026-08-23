# CLAUDE.md — Los Cuatro Masters

Kontext för nästa session. Kompletterar [README.md](./README.md), som
täcker Firebase-setup, deploy och installation på mobil.

## Vad appen är

PWA för en golfresa: fyra spelare, tre rundor på Costa del Sol
11–13 september. Vite + React 18, delad live-scoring via Firestore,
deploy till GitHub Pages. Allt ryms i Firebase Spark (gratisnivån) —
**inga Cloud Functions**, ingen Storage, ingen Scheduler.

Gränssnittet är på svenska, inline-stilat direkt i JSX (ingen CSS-in-JS,
inget Tailwind). Färger, typsnitt och bandata bor i `src/data.js`.

## Filer

```
src/data.js         Bandata, spelare, färger, typsnitt, score- och ölmodell
                    samt MASTERS och EDITION_2025 — Om mästerskapet
src/assets/         Porträtt (600×600 jpeg), importeras från data.js
data/               Scorekort 2025 i csv. Källmaterial, inte kod
src/App.jsx         Hela gränssnittet + award-beräkningarna
src/Crest.jsx       LCM-vapnet som SVG-komponent
src/beer.js         Ölkurvans matematik (nivåer, viktad regression)
src/useScores.js    Firestore-synk, debounce, offlinekö, "vem är du"
src/usePwaUpdate.js Service worker-registrering + uppdateringsnotis
src/firebase.js     Firebase-init från .env (utan .env körs allt lokalt)
firestore.rules     Säkerhetsregler — klistras in i Firebase-konsolen
vite.config.js      base-path för GitHub Pages, PWA-konfig, ikon-taggar
```

## Flikar

Schema · Banguide · Spela · Leaderboard · Dream 18 · **Ölkurvan** ·
Awards · Regler.

Åtta flikar får inte plats på en mobilskärm: raden scrollar i sidled och
`Tabs` drar in den valda fliken i bild med `scrollIntoView`. Läggs fler
flikar till är det den mekaniken som håller navigationen hel.

**Mästerskapet är ingen flik.** Sidan når man via kortet "Om
mästerskapet" längst ner i Schema, och den tar över hela vyn — App
döljer både masthead och flikrad medan `tab === "masters"`. Tillbaka
går man med Schema-knappen högst upp eller längst ner på sidan. Håll
den utanför `TABS`: flikraden är redan full.

## LCM-vapnet

`src/Crest.jsx` — sköld med green, flagga och band, i en viewBox på
48 × 62. Props: `size` (höjd i px, bredden räknas ut), `color` och
`ribbonTextColor`.

Bandet **fylls** med `color`, så texten på det behöver en egen färg.
`ribbonTextColor` ligger default på mörk fairwaygrön, vilket stämmer
när märket är guld på mörk botten. Är `color` mörk — som på det ljusa
Om mästerskapet-kortet — måste den sättas till `C.paper`, annars blir
LCM osynligt.

LCM sätts i Oswald. Typsnittet laddas globalt i `main.jsx` och gäller
även text inuti inline-SVG. Används vapnet någon gång i ett samman-
hang utan Oswald faller det tillbaka på Arial Narrow och ser fel ut.

Tre platser i dag:

| Plats | Storlek | Färg |
|---|---|---|
| Headern, före titeln | 40 | `C.goldBright` |
| Om mästerskapet-kortet | 46 | `C.fairway`, band i `C.paper` |
| Mästerskapet-sidan, överst | 92 | `C.goldBright` |

Headern har inte längre flaggikonen med linjer över titeln — vapnet
ligger i stället till vänster om de två textraderna, hela gruppen
centrerad. Titeln behöver 255 px på en rad, så under ca 340 px vik
lockupen ner sig till två rader bredvid vapnet. Det är avsiktligt och
ser bra ut; att krympa vapnet räddar det inte, eftersom det är titeln
som tar plats.

## Datamodell i Firestore

Tre dokument, ett per runda:

```
/rounds/fre  { jonsson:   [18 × {s, gir, fw, p}],
               johansson: [...], per: [...], lars: [...],
               beers: { jonsson: [{hole, ts}, ...], johansson: [...], ... } }
/rounds/lor  { ... }
/rounds/son  { ... }
```

- `s` slag, `p` puttar, `gir`/`fw` träffad green/fairway. `null` = ej
  inrapporterat.
- `beers` är en map per spelare med en **kronologisk** lista över loggade
  öl. `hole` är hålnumret (1–18), `ts` en ISO-sträng. Ångra tar bort
  sista elementet. Tak: `MAX_BEERS = 40` per spelare och runda, samma tak
  finns i `firestore.rules`.
- Ölräkningen är per runda och nollställs mellan rundor, precis som scoren.
  Nollställningen i Schema-fliken rensar båda.

> **Reglerna måste uppdateras i Firebase-konsolen** när `beers` börjar
> användas — annars nekas skrivningar och statusprickan slår om till
> "Ej synkad". Klistra in `firestore.rules` på nytt.

### Synk

`useScores()` äger allt. Kön är per `(runda, spelare)` och en skrivning
tar med både hålen och ölen för de spelare som ändrats — score och öl
delar alltså debounce (1 s), optimistisk uppdatering, offlinekö i
localStorage och konfliktregel (egna osynkade ändringar vinner över
inkommande snapshots).

localStorage-nycklar: `loscuatro-scores-cache-v1`,
`loscuatro-beers-cache-v1`, `loscuatro-queue-v1`, `loscuatro-me-v1`,
`loscuatro-halfway-v1`.

## Ölloggning

Ölen loggas **inne i spelarkortet på Spela-fliken**, på en egen rad under
GIR/Fairway (`BeerRow` i `App.jsx`). Det finns alltså ingen gemensam
ölmätare ovanför korten längre — raden hör till kortets spelare, inte
till den inloggade, så man kan logga åt en kompis vars telefon ligger i
bilen precis som med slag, GIR, fairway och puttar.

Raden består av etiketten ÖL (samma stil som PUTTAR), en gulbrun knapp
`🍺 N` som visar spelarens antal öl för rundan och loggar en till på det
hål man står på, texten "Senast hål X · HH:MM" när minst en öl finns, och
en Ångra-knapp som bara syns då. Flera tryck på samma hål är tillåtet —
man kan dricka flera öl på ett hål. Tryck ger en kort ölgul blink i
raden (1 s).

## Ölkurvan

`src/beer.js`:

- **Ölnivå för ett hål** = antal öl loggade före eller på det hålet
  (`beerLevelAt`). Varje spelat hål hamnar i exakt en nivå.
- `beerLevels(rounds, scores, beers, playerId)` grupperar spelade hål per
  nivå → `[{ level, holes, avg }]` där `avg` är snitt över par.
- `weightedSlope(points)` gör viktad linjär regression genom punkterna,
  viktad med `holes`. Lutningen är **slag per öl**; negativt = bättre.
  Null om underlaget är för tunt.
- `slopeText(slope)` skriver ut trenden utan minustecken:
  `"0,30 slag bättre / öl"` eller `"0,45 slag sämre / öl"`.

Fliken visar en SVG-graf (X = antal öl, Y = snitt över par, en linje per
spelare i spelarens färg, punktradien skalar med antal hål bakom nivån),
teckenförklaring, och en trendlista sorterad bäst först. Växlaren
Totalt/Fre/Lör/Sön är samma `DayPills` som Leaderboard och Awards.
Totalt är standard och slår ihop hål från alla rundor per öl-nivå.

## Mästerskapet

Presentationssidan: turneringens historia, residenset i Calahonda och
de fyra deltagarna. Tonen är medvetet högtidlig, och typografin är
luftigare än övriga vyer — bredare marginaler, radavstånd 1,95 i
brödtexten och gott om luft mellan avsnitten. Oswald i rubrikerna,
Inter i brödtexten som i resten av appen.

All text ligger i `MASTERS` i `src/data.js`, inte i JSX, så den går att
redigera utan att röra gränssnittet. `Masters` i `App.jsx` innehåller
bara typografin (`MastersHeading`, `MastersProse`, `MastersPerson`).

Porträtten importeras i `data.js` och exponeras via `PORTRAITS`, en map
per spelar-id. De visas 56×56 med `object-fit: cover`. Filerna är
600×600 och buntas som egna filer i `dist/assets` — de ligger alltså
inte i JS-bundeln, men **precachas av service workern** (≈355 kB, en
knapp fjärdedel av precachen). Byts porträtten ut är det den siffran
att hålla ögonen på.

`MASTERS.participants.people` har sin egen ordning (Lars, Per, Jonsson,
Johansson) — namn och accentfärg hämtas från `PLAYERS` via `id`.

### Upplagorna

`MASTERS.editions` ritas i den ordning den står, kronologiskt: I (2024),
II (2025), III (2026). Varje post är `{ id, title, body: [...] }`, och
en upplaga med bevarad statistik får dessutom `data` som pekar på sin
datakonstant. Har posten `data` ritar `Masters` en `EditionDetails`
under texten; saknas den blir det bara löptext, som för I och III.

`EditionDetails` visar slutställningen direkt och lägger rundorna,
Dream 18 och awards bakom "Visa detaljer". Delkomponenterna
(`EditionStandings`, `EditionRound`, `EditionDream18`, `EditionAwards`)
lånar Leaderboardens och Awards-flikens formspråk med flit — guldkort
på segraren, färgprick per spelare, monospace i siffrorna.

`EditionAwards` går igenom **samma `AWARDS`-array** som Awards-fliken,
så ikoner, rubriker och ordning följer med automatiskt. Upplagans
`awards` är en map på samma nycklar; saknas en nyckel ritas kortet som
"—". `ids` är en lista, eftersom Comeback King 2025 delades av tre.

### EDITION_2025

Komplett hål-för-hål-data för 2025, omstrukturerad från scorekorten i
`data/2025-*.csv` (semikolonseparerade, 72 rader per runda). HCP,
hål-HCP och netto är utelämnade — appen räknar brutto. Spelarnamnen i
csv-filerna (Per Welin, Lars Munther, Daniel Jonsson, Daniel Johansson)
är mappade till appens spelar-id.

**Datan är statisk och ska aldrig till Firestore.** Den är färdigspelad
historik: inget att synka, inget att ändra, inget som ska dela kod med
`useScores`.

Summorna — rundtotaler, slutställning och Dream 18 — ligger
**förräknade** i konstanten och räknas inte om i appen. De är avstämda
mot scorekorten. Ändras hål-för-hål-datan måste summorna uppdateras för
hand, annars glider de isär.

## Awards

Tio stycken, alla positiva — ingen sämst-kategori. Definitionerna ligger i
`AWARDS`-arrayen och beräknas i `computeAwards(rounds, scores, beers)` i
`App.jsx`. Saknas underlag visas `—`.

Tionde awarden är **The Optimizer** (Star-ikonen): lägst (mest negativ)
lutning från `weightedSlope` vinner. Kräver hål på **minst tre olika
öl-nivåer**. Presenteras alltid utan minustecken via `slopeText`.

Regler-fliken (`RULES` i `App.jsx`) förklarar samma tio i klartext och ska
hållas i synk med `AWARDS`.

## Halvvägsnotis

Aloha (lördag och söndag) har halvvägshus efter hål 9; Santana har inget.
Notisen triggas när den inloggade spelaren matat in score för hål 8 och
står på hål 8 eller 9. Låg intensitet: en rad som går att avfärda, aldrig
en modal. Visas en gång per runda och enhet — `loscuatro-halfway-v1`
håller en lista över rundor som redan visat den.

## Uppdateringsnotis (PWA)

`vite-plugin-pwa` körs i `registerType: "prompt"` med
`workbox.skipWaiting: false` och `injectRegister: false` — registreringen
sker för hand i `src/usePwaUpdate.js` via `virtual:pwa-register`.

En ny version laddas hem, lägger sig som `waiting` och tar **inte** över
mitt i en scoreinmatning. `UpdateBanner` längst ner erbjuder "Ladda om"
(skickar `SKIP_WAITING` och laddar om) eller att avfärda. Bannern kommer
tillbaka nästa gång appen startas.

Obs: `updateSW(true)` laddar bara om sidan själv när fliken redan var
kontrollerad av den gamla service workern. `usePwaUpdate` laddar därför om
för hand på `controllerchange`, med en timeout-fallback. Ta inte bort det
— första besöket är annars kvar på gammal kod efter tryck på knappen.

## Utveckling

```bash
npm run dev       # service worker avstängd
npm run build     # produktionsbygge till dist/
npm run preview   # servera dist/ inklusive service worker
```

Utan ifylld `.env` startar appen i lokalt läge mot localStorage. Kör
gärna dev-servern så när du testar, så att testdata inte hamnar i den
delade databasen:

```bash
VITE_FIREBASE_API_KEY= VITE_FIREBASE_PROJECT_ID= VITE_FIREBASE_APP_ID= npm run dev
```

Uppdateringsnotisen går bara att testa mot `npm run preview`: ladda sidan,
bygg om med en ändring som verkligen ändrar utdatan (kommentarer
minifieras bort), och kör `navigator.serviceWorker.getRegistration()
.then(r => r.update())` i konsolen.

## Att hålla i minnet

- Ändra inte design, beräkningslogik eller bandata utan att det är
  efterfrågat — appen är genomdesignad och texterna är medvetet skrivna.
- Allt ska fungera offline ute på banan. Nya beroenden som kräver nät hör
  inte hemma här.
- Ingen inloggning: fyra kompisar delar tre dokument. Skyddet ligger i
  att reglerna låser ner ytan, inte användaren.
