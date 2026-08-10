import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

/* Konfigen kommer från .env (se .env.example). Web-API-nyckeln är inte
   hemlig — det är Firestore-reglerna som skyddar datan. */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

/* Utan konfig kör appen vidare helt lokalt (localStorage) i stället för
   att krascha — praktiskt vid första uppstart och i utvecklingsläge. */
export const firebaseEnabled = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId
);

let db = null;

if (firebaseEnabled) {
  const app = initializeApp(firebaseConfig);
  /* Standardcachen räcker: vi håller vår egen offlinekö i localStorage,
     vilket ger förutsägbar synkstatus ute på banan. */
  db = getFirestore(app);
} else if (import.meta.env.DEV) {
  console.warn(
    "[Los Cuatro Masters] Ingen Firebase-konfig hittad i .env — kör i lokalt läge utan delning."
  );
}

export { db };
