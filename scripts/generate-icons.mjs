/* Genererar PWA-ikoner och iOS-splashskärmar i appens färgskala.
   Körs med `npm run icons`. Resultatet checkas in under public/. */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { SPLASH } from "./splash-sizes.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pub = join(root, "public");

const FAIRWAY = "#0F3B2E";
const FAIRWAY_MID = "#124635";
const FAIRWAY_DARK = "#0A2A21";
const GOLD = "#C9A227";
const GOLD_BRIGHT = "#E4C13D";

/* Flaggan ritad i en 512-ruta — samma märke i ikon som i splash. */
function mark(scale = 1) {
  const s = `translate(256 256) scale(${scale}) translate(-256 -256)`;
  return `
    <g transform="${s}">
      <circle cx="256" cy="256" r="220" fill="none" stroke="${GOLD}" stroke-opacity="0.22" stroke-width="6"/>
      <ellipse cx="256" cy="378" rx="132" ry="26" fill="${FAIRWAY_MID}"/>
      <ellipse cx="256" cy="371" rx="132" ry="26" fill="${FAIRWAY_DARK}" opacity="0.55"/>
      <path d="M196 150 L346 192 L196 234 Z" fill="${GOLD}"/>
      <path d="M196 150 L346 192 L196 192 Z" fill="${GOLD_BRIGHT}"/>
      <rect x="189" y="138" width="14" height="238" rx="7" fill="${GOLD_BRIGHT}"/>
      <ellipse cx="196" cy="374" rx="20" ry="8" fill="${FAIRWAY_DARK}"/>
      <circle cx="330" cy="356" r="15" fill="#F3EEDD"/>
      <circle cx="325" cy="351" r="4" fill="${FAIRWAY_MID}" opacity="0.35"/>
    </g>`;
}

const iconSvg = (scale) => `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${FAIRWAY_MID}"/>
      <stop offset="1" stop-color="${FAIRWAY_DARK}"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  ${mark(scale)}
</svg>`;

const splashSvg = (w, h) => {
  const markSize = Math.round(Math.min(w, h) * 0.42);
  const x = Math.round((w - markSize) / 2);
  const y = Math.round((h - markSize) / 2);
  const rule = Math.round(markSize * 0.5);
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="${FAIRWAY}"/>
  <svg x="${x}" y="${y}" width="${markSize}" height="${markSize}" viewBox="0 0 512 512">
    ${mark(0.88)}
  </svg>
  <rect x="${Math.round((w - rule) / 2)}" y="${y + markSize + Math.round(markSize * 0.14)}"
        width="${rule}" height="2" rx="1" fill="${GOLD}" fill-opacity="0.4"/>
</svg>`;
};

const png = (svg, size) =>
  sharp(Buffer.from(svg))
    .resize(size.w ?? size, size.h ?? size, { fit: "fill" })
    .png({ compressionLevel: 9 })
    .toBuffer();

async function main() {
  await mkdir(join(pub, "icons"), { recursive: true });
  await mkdir(join(pub, "splash"), { recursive: true });

  const full = iconSvg(1);
  const safe = iconSvg(0.68); // maskable: innehållet inom säkra zonen

  await writeFile(join(pub, "icons", "icon.svg"), full);

  for (const s of [64, 192, 512]) {
    await writeFile(join(pub, "icons", `icon-${s}.png`), await png(full, s));
  }
  for (const s of [192, 512]) {
    await writeFile(join(pub, "icons", `maskable-${s}.png`), await png(safe, s));
  }
  /* iOS klipper inte apple-touch-icon, men lägger den på hemskärmen med
     egna hörnradier — full utfyllnad är rätt här. */
  await writeFile(join(pub, "apple-touch-icon.png"), await png(full, 180));
  await writeFile(join(pub, "favicon.svg"), full);

  for (const s of SPLASH) {
    await writeFile(
      join(pub, "splash", `splash-${s.w}x${s.h}.png`),
      await png(splashSvg(s.w, s.h), { w: s.w, h: s.h })
    );
  }

  console.log(`Klart: 5 ikoner, apple-touch-icon och ${SPLASH.length} splashskärmar i public/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
