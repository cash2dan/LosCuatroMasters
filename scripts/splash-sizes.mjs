/* iOS-splashskärmar: pixelstorlek (w×h) plus de CSS-mått och den
   pixeldensitet enheten rapporterar, som media-frågorna matchar på.
   Delas av ikongeneratorn och Vite-pluginet som skriver taggarna. */

export const SPLASH = [
  { w: 1290, h: 2796, dw: 430, dh: 932, r: 3 },   // iPhone 15/16 Pro Max
  { w: 1179, h: 2556, dw: 393, dh: 852, r: 3 },   // iPhone 14/15/16 Pro
  { w: 1284, h: 2778, dw: 428, dh: 926, r: 3 },   // iPhone 12/13 Pro Max
  { w: 1170, h: 2532, dw: 390, dh: 844, r: 3 },   // iPhone 12/13/14
  { w: 1242, h: 2688, dw: 414, dh: 896, r: 3 },   // iPhone XS Max / 11 Pro Max
  { w: 1125, h: 2436, dw: 375, dh: 812, r: 3 },   // iPhone X / XS / 11 Pro
  { w: 1242, h: 2208, dw: 414, dh: 736, r: 3 },   // iPhone 8 Plus
  { w: 828, h: 1792, dw: 414, dh: 896, r: 2 },    // iPhone XR / 11
  { w: 750, h: 1334, dw: 375, dh: 667, r: 2 },    // iPhone 8 / SE 2–3
  { w: 1536, h: 2048, dw: 768, dh: 1024, r: 2 },  // iPad 9.7"
  { w: 1668, h: 2388, dw: 834, dh: 1194, r: 2 },  // iPad Pro 11"
  { w: 2048, h: 2732, dw: 1024, dh: 1366, r: 2 }, // iPad Pro 12.9"
];

export const splashLink = (base, s) =>
  `<link rel="apple-touch-startup-image" href="${base}splash/splash-${s.w}x${s.h}.png" ` +
  `media="(device-width: ${s.dw}px) and (device-height: ${s.dh}px) and ` +
  `(-webkit-device-pixel-ratio: ${s.r}) and (orientation: portrait)">`;
