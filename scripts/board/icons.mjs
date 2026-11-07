// Tile icons, drawn in a 44x44 box at the tile's top-right. Each takes the theme
// palette and the lane accent and returns { body, css }. As with the banners,
// every shape is visible on frame one; motion only decorates.

const range = (n) => Array.from({ length: n }, (_, i) => i);

export const ICONS = {
  plane: (p, a) => ({
    // Side-view airliner pointing right: fuselage, swept wing, tail fin.
    body: `<path d="M0 34 H14" stroke="${p.line}" stroke-width="2" stroke-dasharray="3 3"/><g class="pl">` +
      `<path d="M6 19 H34 C40 19 43 21 43 22 C43 23 40 25 34 25 H6 Z" fill="${a}"/>` +
      `<path d="M20 22 L13 36 H18 L29 23 Z" fill="${a}"/><path d="M20 21 L15 13 H19 L26 20 Z" fill="${a}" opacity=".7"/>` +
      `<path d="M6 20 L2 10 H7 L12 20 Z" fill="${a}"/></g>`,
    css: ".pl{animation:fly 3s ease-in-out infinite} @keyframes fly{0%,100%{transform:translate(-2px,3px)}50%{transform:translate(2px,-3px)}}",
  }),
  wave: (p, a) => ({
    body: `<g transform="scale(.72 1)"><path class="wv" d="M0 20 q4 -3 8 0 t8 0 q5 -8 10 0 t10 0 q6 -14 12 0 t12 0" fill="none" stroke="${a}" stroke-width="2"/></g>`,
    css: ".wv{transform-origin:0 20px;animation:amp 2s ease-in-out infinite} @keyframes amp{0%,100%{transform:scaleY(.6)}50%{transform:scaleY(1.4)}}",
  }),
  grid: (p) => ({
    body: range(9).map((i) => `<rect x="${(i % 3) * 12}" y="${Math.floor(i / 3) * 12}" width="9" height="9" rx="2" fill="${p.line}"/>`).join("") +
      `<rect class="gp" x="12" y="12" width="9" height="9" rx="2" fill="${p.red}"/>`,
    css: `.gp{animation:gate 2.4s steps(1) infinite} @keyframes gate{50%{fill:${p.green}}}`,
  }),
  lights: (p, a) => ({
    body: range(3).map((i) => `<circle class="ck" style="animation-delay:${i * 0.4}s" cx="${i * 14 + 4}" cy="12" r="5" fill="${a}"/>`).join("") +
      `<text x="0" y="40" font-size="9" fill="${p.muted}" class="m">PO GR INV</text>`,
    css: `.ck{animation:ok 2.4s infinite} @keyframes ok{0%{fill:${p.line}}20%,80%{fill:${a}}90%{fill:${p.red}}}`,
  }),
  fan: (p, a) => ({
    body: [-9, -4, 0, 5, 10].map((d, i) => `<path class="pa" style="animation-delay:${i * 0.25}s" d="M0 20 C 14 20, 20 ${20 + d}, 40 ${20 + d * 1.6}" fill="none" stroke="${a}" stroke-opacity=".8"/>`).join(""),
    css: ".pa{stroke-dasharray:60;animation:fan 3s ease-out infinite} @keyframes fan{0%{stroke-dashoffset:30}50%,100%{stroke-dashoffset:0}}",
  }),
  thermo: (p) => ({
    body: `<rect x="14" y="0" width="10" height="34" rx="5" fill="none" stroke="${p.muted}"/><circle cx="19" cy="38" r="7" fill="${p.red}"/><rect class="mq" x="17" y="8" width="6" height="28" rx="3" fill="${p.red}"/>`,
    css: ".mq{transform-origin:19px 36px;animation:heat 3s ease-in-out infinite} @keyframes heat{0%,100%{transform:scaleY(.4)}50%{transform:scaleY(1)}}",
  }),
  spark: (p, a) => ({
    body: `<polyline points="0,30 8,26 16,28 24,16 32,20 40,8" fill="none" stroke="${a}" stroke-width="2"/><circle class="pu" cx="40" cy="8" r="3" fill="${a}"/>`,
    css: ".pu{transform-origin:40px 8px;animation:pulse 1.6s ease-out infinite} @keyframes pulse{50%{transform:scale(2);opacity:.4}}",
  }),
  coins: (p, a) => ({
    body: range(4).map((i) => `<rect class="cn" style="animation-delay:${i * 0.3}s" x="6" y="${30 - i * 7}" width="28" height="5" rx="2.5" fill="${a}"/>`).join(""),
    css: ".cn{animation:stack 2.4s ease-out infinite} @keyframes stack{0%{transform:translateY(-6px);opacity:.4}30%,100%{transform:none;opacity:1}}",
  }),
  house: (p, a) => ({
    body: `<path d="M4 20 L20 6 L36 20 V38 H4 Z" fill="none" stroke="${p.muted}" stroke-width="2"/><path class="ar" d="M14 32 L26 16 M20 16 H26 V22" fill="none" stroke="${a}" stroke-width="2.5" stroke-linecap="round"/>`,
    css: ".ar{animation:up 2s ease-in-out infinite} @keyframes up{0%,100%{transform:translate(0,2px)}50%{transform:translate(0,-3px)}}",
  }),
  magnifier: (p, a) => ({
    body: `<rect x="0" y="4" width="26" height="32" rx="3" fill="none" stroke="${p.muted}"/><g class="mg"><circle cx="26" cy="22" r="8" fill="none" stroke="${a}" stroke-width="2.5"/><line x1="32" y1="28" x2="40" y2="36" stroke="${a}" stroke-width="3" stroke-linecap="round"/></g>`,
    css: ".mg{animation:look 3s ease-in-out infinite} @keyframes look{0%,100%{transform:translate(-8px,-6px)}50%{transform:translate(0,4px)}}",
  }),
  shield: (p, a) => ({
    body: `<path d="M20 2 L38 9 V20 C38 30 30 37 20 40 C10 37 2 30 2 20 V9 Z" fill="none" stroke="${a}" stroke-width="2"/><path class="tk" d="M12 21 L18 27 L29 15" fill="none" stroke="${p.green}" stroke-width="3" stroke-linecap="round" stroke-dasharray="30"/>`,
    css: ".tk{animation:tick 2.4s ease-out infinite} @keyframes tick{0%{stroke-dashoffset:20}40%,100%{stroke-dashoffset:0}}",
  }),
  crate: (p, a) => ({
    body: range(6).map((i) => `<circle cx="${i * 8}" cy="30" r="2" fill="${p.line}"/>`).join("") + `<rect class="cr" x="0" y="14" width="12" height="10" rx="2" fill="${a}"/>`,
    css: ".cr{animation:go 2.6s ease-in-out infinite alternate} @keyframes go{to{transform:translateX(30px)}}",
  }),
  moon: (p) => ({
    body: `<defs><clipPath id="mn"><circle cx="20" cy="20" r="16"/></clipPath></defs><circle cx="20" cy="20" r="16" fill="${p.text}" opacity=".85"/><g clip-path="url(#mn)"><circle class="sh" cx="20" cy="20" r="16" fill="${p.line}"/></g>`,
    css: ".sh{transform:translateX(10px);animation:phase 5s ease-in-out infinite} @keyframes phase{0%,100%{transform:translateX(10px)}50%{transform:translateX(26px)}}",
  }),
  dots: (p, a) => ({
    body: range(25).map((i) => `<circle class="fp" style="animation-delay:${((i * 0.13) % 1.6).toFixed(2)}s" cx="${6 + (i % 5) * 8}" cy="${6 + Math.floor(i / 5) * 8}" r="2" fill="${a}"/>`).join(""),
    css: ".fp{animation:fl 1.6s ease-in-out infinite} @keyframes fl{50%{opacity:.25}}",
  }),
  bowl: (p, a) => ({
    body: `<path d="M2 22 H38 C38 32 30 38 20 38 C10 38 2 32 2 22 Z" fill="${a}"/>` +
      range(3).map((i) => `<path class="sm" style="animation-delay:${i * 0.5}s" d="M${10 + i * 10} 18 q-4 -5 0 -9 t0 -9" fill="none" stroke="${p.muted}" stroke-width="2" stroke-linecap="round"/>`).join(""),
    css: ".sm{animation:steam 2s ease-in-out infinite} @keyframes steam{0%{transform:translateY(3px);opacity:.4}50%{opacity:1}100%{transform:translateY(-4px);opacity:.4}}",
  }),
};
