import React from "react";

/* =========================================================
   LCM-VAPNET

   Sköld med green, flagga och band. viewBox är 48 × 62 — högre än
   bred — så bredden räknas ut från höjden och proportionerna hålls.

   `color` färgar hela märket. Bandet FYLLS med `color`, så texten
   på bandet måste ha en egen färg som kontrasterar: `ribbonTextColor`
   ligger som default på mörk fairwaygrön, vilket stämmer när märket
   är guld på mörk botten. På ljus botten, där `color` är mörk, ska
   den sättas till pappersfärgen i stället.

   LCM sätts i Oswald. Typsnittet laddas globalt i main.jsx och
   gäller även text inuti inline-SVG — men läggs märket någon gång i
   ett sammanhang utan Oswald faller det tillbaka på Arial Narrow och
   ser fel ut.
   ========================================================= */

export default function Crest({ size = 44, color, ribbonTextColor = "#0A2A21" }) {
  return (
    <svg
      viewBox="0 0 48 62"
      width={size * (48 / 62)}
      height={size}
      aria-hidden="true"
      style={{ display: "block", flexShrink: 0 }}
    >
      {/* Sköld */}
      <path
        d="M24 4 L41 10.5 V25 C41 34.5 33.5 40.8 24 45 C14.5 40.8 7 34.5 7 25 V10.5 Z"
        fill="none" stroke={color} strokeWidth="2.8" strokeLinejoin="round" />

      {/* Green */}
      <ellipse cx="24" cy="35" rx="9.5" ry="3"
        fill="none" stroke={color} strokeWidth="2.2" />

      {/* Hål */}
      <ellipse cx="21.5" cy="34.4" rx="1.5" ry="0.7" fill={color} />

      {/* Flaggstång */}
      <line x1="21.5" y1="14" x2="21.5" y2="34.4"
        stroke={color} strokeWidth="2.4" strokeLinecap="round" />

      {/* Flaggduk */}
      <path d="M21.5 14.5 L33 18 L21.5 21.6 Z" fill={color} />

      {/* Band */}
      <path d="M4 48 H44 L40.5 54.5 L44 61 H4 L7.5 54.5 Z"
        fill={color} stroke={color} strokeWidth="1.6" strokeLinejoin="round" />

      {/* LCM på bandet */}
      <text x="24" y="58.4" textAnchor="middle"
        fontFamily="'Oswald', 'Arial Narrow', sans-serif"
        fontSize="10.5" fontWeight="700"
        fill={ribbonTextColor} letterSpacing="1.4">LCM</text>
    </svg>
  );
}
