import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { SPLASH, splashLink } from "./scripts/splash-sizes.mjs";

/* GitHub Pages serverar projektet under /<reponamn>/. */
const BASE = "/LosCuatroMasters/";

/* Ikon- och splashtaggarna skrivs in efter Vites egen HTML-behandling
   (order: "post"), så att URL:erna får rätt base en gång och inte
   skrivs om igen. Filerna ligger statiskt i public/. */
function appIconLinks(base) {
  const tags = [
    `<link rel="apple-touch-icon" href="${base}apple-touch-icon.png">`,
    `<link rel="icon" type="image/svg+xml" href="${base}favicon.svg">`,
    `<link rel="icon" type="image/png" sizes="64x64" href="${base}icons/icon-64.png">`,
    ...SPLASH.map((s) => splashLink(base, s)),
  ].join("\n    ");

  return {
    name: "app-icon-links",
    transformIndexHtml: {
      order: "post",
      handler: (html) => html.replace("<!--app-icons-->", tags),
    },
  };
}

export default defineConfig({
  base: BASE,
  plugins: [
    react(),
    appIconLinks(BASE),
    VitePWA({
      registerType: "autoUpdate",
      /* Ikoner, splashskärmar och typsnitt ligger redan i dist och plockas
         upp av globPatterns nedan — includeAssets skulle bara dubblera dem. */
      manifest: {
        id: BASE,
        name: "Los Cuatro Masters",
        short_name: "Los Cuatro",
        description: "Golfresa Costa del Sol 11–13 september — scoring, leaderboard och awards.",
        lang: "sv-SE",
        start_url: BASE,
        scope: BASE,
        display: "standalone",
        orientation: "portrait",
        background_color: "#0F3B2E",
        theme_color: "#0F3B2E",
        categories: ["sports"],
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
          { src: "icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        /* Hela appskalet — kod, typsnitt, ikoner — cachas vid installation
           så att den fungerar utan täckning ute på banan. */
        globPatterns: ["**/*.{js,css,html,svg,png,jpg,jpeg,ico,woff,woff2}"],
        navigateFallback: `${BASE}index.html`,
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        /* Firestore-trafiken ska aldrig gå via service workern — den har
           egen offlinehantering och långlivade strömmande anslutningar. */
        navigateFallbackDenylist: [/^\/__/, /firestore\.googleapis\.com/],
        runtimeCaching: [],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  build: {
    /* Firebase-SDK:n är stor nog att förtjäna en egen chunk — då slipper
       service workern ladda om allt när appkoden ändras. */
    rollupOptions: {
      output: {
        manualChunks: {
          firebase: ["firebase/app", "firebase/firestore"],
          icons: ["lucide-react"],
        },
      },
    },
  },
});
