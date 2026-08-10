# Los Cuatro Masters

Golfresa-app för fyra spelare, tre rundor på Costa del Sol 11–13 september.
PWA byggd med Vite + React, delad live-scoring via Firebase Firestore,
deploy till GitHub Pages.

- **Schema** — de tre rundorna med par, längd och bana
- **Banguide** — hål för hål, par och meter för Santana och Aloha
- **Spela** — snabbinmatning av slag, puttar, GIR och fairway
- **Leaderboard** — bruttoscore totalt eller per dag
- **Dream 18** — lägsta score per hålnummer från valfri dag
- **Awards** — nio utmärkelser räknade på hela resan eller en dag

Alla fyra ser samma scoring live. Appen fungerar utan täckning ute på
banan och synkar när nätet är tillbaka.

---

## Kom igång lokalt

```bash
npm install
cp .env.example .env      # fyll i Firebase-nycklarna, se nedan
npm run dev
```

Utan ifylld `.env` startar appen ändå — då körs den helt lokalt mot
localStorage, utan delning mellan enheter. Praktiskt för att titta på
gränssnittet innan Firebase är på plats.

```bash
npm run build     # produktionsbygge till dist/
npm run preview   # servera dist/ lokalt, inklusive service worker
npm run icons     # generera om ikoner och splashskärmar
```

Service workern är avstängd i `npm run dev`. För att testa offline-läget:
`npm run build && npm run preview`, ladda sidan en gång, stäng av servern
och ladda om — appen ska komma upp ändå.

---

## Firebase-setup från noll

Allt nedan ryms i Spark (gratisnivån). Appen använder **bara Firestore** —
inga Cloud Functions, ingen Cloud Storage, ingen Scheduler. Med fyra
spelare och tre rundor landar användningen på några hundra läsningar och
skrivningar per dag, mot gratisgränsen på 50 000 läsningar och 20 000
skrivningar per dag.

### 1. Skapa projektet

1. Gå till [console.firebase.google.com](https://console.firebase.google.com/)
   och välj **Add project**.
2. Döp det till t.ex. `los-cuatro-masters`.
3. Stäng av Google Analytics — behövs inte och drar in fler tjänster.

### 2. Skapa databasen i EU

1. Vänstermenyn → **Build → Firestore Database → Create database**.
2. Välj **Production mode** (reglerna sätts i nästa steg).
3. Location: välj en **europe-west**-region, t.ex. `europe-west1 (Belgium)`
   eller `europe-west3 (Frankfurt)`.

   > Regionen går **inte** att ändra efteråt — databasen måste raderas och
   > skapas om. Kontrollera valet innan du klickar Enable.

### 3. Lägg in säkerhetsreglerna

Öppna fliken **Rules** i Firestore och klistra in innehållet i
[`firestore.rules`](./firestore.rules). Klicka **Publish**.

Reglerna tillåter läsning och skrivning på `/rounds/fre`, `/rounds/lor`
och `/rounds/son` — men bara med fälten `jonsson`, `johansson`, `per` och
`lars`, och bara som listor med högst 18 hål. Allt annat i databasen är
stängt, och radering är inte tillåten alls.

Appen har ingen inloggning: vem som helst med adressen kan läsa och skriva
scoren. Det är ett medvetet val för fyra kompisar på en golfresa — det
enda som ligger i databasen är slagantal. Vill du strama åt är nästa steg
Firebase Anonymous Auth och `allow read, write: if request.auth != null;`.

### 4. Registrera webbappen och hämta nycklarna

1. **Project settings** (kugghjulet) → **General** → längst ner,
   **Your apps** → ikonen `</>` (Web).
2. Ge appen ett smeknamn, t.ex. `pwa`. Hoppa över Firebase Hosting.
3. Kopiera värdena ur `firebaseConfig` till din `.env`:

   ```
   VITE_FIREBASE_API_KEY=AIza...
   VITE_FIREBASE_AUTH_DOMAIN=los-cuatro-masters.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=los-cuatro-masters
   VITE_FIREBASE_STORAGE_BUCKET=los-cuatro-masters.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
   VITE_FIREBASE_APP_ID=1:123456789012:web:abc123...
   ```

`.env` är gitignorerad. Nycklarna är för övrigt inte hemligheter — de
identifierar projektet och ligger ändå i den byggda appen. Skyddet ligger
i Firestore-reglerna.

### 5. Håll dig på gratisnivån

Inget i appen kan kosta pengar på Spark — men om du vill vara helt säker:
gå till **Usage and billing** och bekräfta att planen står som **Spark**.
Uppgradera aldrig till Blaze, då försvinner det hårda taket.

---

## Deploy till GitHub Pages

1. Skapa repot på GitHub med namnet **`LosCuatroMasters`** och pusha koden
   till grenen `main`.

   > Heter repot något annat måste `BASE` i [`vite.config.js`](./vite.config.js)
   > ändras till `/<reponamn>/`. Det är den enda platsen värdet finns.

2. **Settings → Pages → Build and deployment → Source: GitHub Actions**.

3. **Settings → Secrets and variables → Actions → New repository secret**,
   lägg in sex stycken med exakt samma namn och värden som i `.env`:

   ```
   VITE_FIREBASE_API_KEY
   VITE_FIREBASE_AUTH_DOMAIN
   VITE_FIREBASE_PROJECT_ID
   VITE_FIREBASE_STORAGE_BUCKET
   VITE_FIREBASE_MESSAGING_SENDER_ID
   VITE_FIREBASE_APP_ID
   ```

   Saknas de går bygget igenom ändå, men appen hamnar i lokalt läge utan
   delning — så kolla att alla sex finns.

4. Varje push till `main` bygger och deployar via
   [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml). Appen
   hamnar på `https://<ditt-användarnamn>.github.io/LosCuatroMasters/`.

---

## Installera på mobilen

**iOS (Safari):** öppna adressen → dela-knappen → *Lägg till på hemskärmen*.
Måste göras i Safari, inte Chrome.

**Android (Chrome):** öppna adressen → menyn → *Installera app*.

Appen startar i standalone-läge, låst i porträtt, med egen splashskärm.
Varje spelare väljer **Vem är du?** en gång på sin egen telefon — det valet
sparas per enhet och delas inte.

---

## Så fungerar synkningen

Tre dokument i Firestore, ett per runda:

```
/rounds/fre   { jonsson: [18 × {s, gir, fw, p}], johansson: [...], per: [...], lars: [...] }
/rounds/lor   { ... }
/rounds/son   { ... }
```

`s` = antal slag, `p` = puttar, `gir`/`fw` = träffad green respektive
fairway. `null` betyder ej inrapporterat.

- **Läsning:** en `onSnapshot`-lyssnare per dokument, tre totalt. Alla
  enheter ser varandras slag direkt.
- **Skrivning:** ändringar samlas ihop och skickas ~1 sekund efter sista
  knapptryck, som en `setDoc(..., { merge: true })` per runda. Fyra snabba
  tryck blir alltså en skrivning, inte fyra.
- **Optimistiskt:** ditt slag syns direkt i gränssnittet, synken sker i
  bakgrunden.
- **Offline:** hela scoren speglas i `localStorage` tillsammans med en kö
  över osynkade ändringar. Tappar du täckningen mitt på banan fortsätter
  inmatningen fungera, prickan i toppen slår om till **Ej synkad**, och kön
  töms automatiskt när nätet är tillbaka — vid `online`-event, när appen
  kommer i förgrunden, och som fallback var 15:e sekund.
- **Konfliktregel:** inkommande data från Firestore skriver aldrig över
  egna ändringar som ännu ligger i kön.

Statusprickan under rubriken: grön *Synkad*, grå *Sparar…*, röd *Ej synkad*.

---

## Filer

```
src/data.js         Bandata, spelare, färger, typsnitt, scoremodell
src/App.jsx         Hela gränssnittet och beräkningarna
src/useScores.js    Firestore-synk, debounce, offlinekö, "vem är du"
src/firebase.js     Firebase-init från .env
firestore.rules     Säkerhetsregler att klistra in i konsolen
scripts/            Generering av ikoner och splashskärmar
public/             Genererade ikoner och splashskärmar
```

### Byta ut gruppbilden

Sätt `COVER_IMAGE_URL` i [`src/data.js`](src/data.js) till en bild-URL
(eller en base64-sträng). Lämnas den tom visas platshållaren.

### Ändra ikonerna

Formen ligger i `mark()` i
[`scripts/generate-icons.mjs`](scripts/generate-icons.mjs). Kör
`npm run icons` efter ändring — alla storlekar och splashskärmar
genereras om.
