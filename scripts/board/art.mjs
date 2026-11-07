// Lane banner art. Each returns { body, css } for an 880x64 banner, drawn to the
// right of the lane title (x 296..864). Motion is decoration only: every element
// is visible on frame one, so a viewer that never animates still sees the scene.

// Deterministic PRNG so the daily rebuild does not churn the SVGs.
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}

function conveyor(p) {
  const boxes = Array.from({ length: 7 }, (_, i) =>
    `<rect class="bx" style="animation-delay:-${(i * 0.9).toFixed(1)}s" x="300" y="22" width="18" height="16" rx="2" fill="${p.amber}"/>`).join("");
  const rollers = Array.from({ length: 20 }, (_, i) => `<circle cx="${300 + i * 28}" cy="45" r="3" fill="${p.line}"/>`).join("");
  return {
    body: `<line x1="296" y1="40" x2="864" y2="40" stroke="${p.muted}" stroke-width="2"/>${rollers}${boxes}`,
    css: ".bx{animation:ride 6.3s linear infinite} @keyframes ride{from{transform:translateX(0)}to{transform:translateX(550px)}}",
  };
}

function candles(p) {
  const r = rng(7);
  let price = 0;
  const raw = [];
  for (let i = 0; i < 18; i++) {
    const o = price, c = o + (r() * 12 - 5);
    price = c;
    raw.push([o, c, Math.max(o, c) + 1 + r() * 2, Math.min(o, c) - 1 - r() * 2]);
  }
  const lo = Math.min(...raw.map((x) => x[3])), hi = Math.max(...raw.map((x) => x[2]));
  const Y = (v) => 54 - ((v - lo) / (hi - lo)) * 44;
  const body = raw.map(([o, c, h, l], i) => {
    const x = 320 + i * 30, col = c >= o ? p.green : p.red, top = Y(Math.max(o, c));
    const bh = Math.max(Y(Math.min(o, c)) - top, 2);
    return `<g class="cd" style="animation-delay:${(i * 0.18).toFixed(2)}s;transform-origin:${x}px 54px">` +
      `<line x1="${x}" y1="${Y(h).toFixed(1)}" x2="${x}" y2="${Y(l).toFixed(1)}" stroke="${col}"/>` +
      `<rect x="${x - 5}" y="${top.toFixed(1)}" width="10" height="${bh.toFixed(1)}" rx="1" fill="${col}"/></g>`;
  }).join("");
  return { body, css: ".cd{animation:pop 6s ease-out infinite} @keyframes pop{0%{transform:scaleY(.2);opacity:.35}12%,100%{transform:scaleY(1);opacity:1}}" };
}

function bars(p) {
  const hs = [30, 18, 40, 24, 36, 12, 44, 28, 20, 38, 16, 34, 26, 42, 22, 32, 14, 40];
  const body = hs.map((h, i) =>
    `<rect class="br" style="animation-delay:-${(i * 0.23).toFixed(2)}s;transform-origin:${316 + i * 30}px 54px" x="${309 + i * 30}" y="${54 - h}" width="14" height="${h}" rx="2" fill="${p.blue}"/>`).join("");
  return { body, css: ".br{animation:grow 3s ease-in-out infinite} @keyframes grow{0%,100%{transform:scaleY(1)}50%{transform:scaleY(.45)}}" };
}

function scan(p) {
  const lines = [520, 460, 540, 380, 500].map((w, i) => `<rect x="300" y="${14 + i * 9}" width="${w}" height="4" rx="2" fill="${p.line}"/>`).join("");
  const hits = [[420, 0, 60, 0.6], [620, 2, 80, 1.6], [360, 4, 50, 2.6]].map(([x, row, w, d]) =>
    `<rect class="hl" style="animation-delay:${d}s" x="${x}" y="${14 + row * 9}" width="${w}" height="4" rx="2" fill="${p.purple}"/>`).join("");
  return {
    body: `${lines}${hits}<rect class="sc" x="300" y="8" width="3" height="48" rx="1" fill="${p.purple}"/>`,
    css: ".sc{animation:scan 4s linear infinite} @keyframes scan{from{transform:translateX(0)}to{transform:translateX(550px)}}" +
      " .hl{opacity:.35;animation:hit 4s linear infinite} @keyframes hit{0%,10%{opacity:1}40%,100%{opacity:.35}}",
  };
}

function moonscape(p) {
  const r = rng(3);
  const stars = Array.from({ length: 22 }, () =>
    `<circle class="st" style="animation-delay:-${(r() * 3).toFixed(1)}s" cx="${Math.round(300 + r() * 560)}" cy="${Math.round(8 + r() * 22)}" r="1.2" fill="${p.text}"/>`).join("");
  const ridge = "M296 56 Q340 40 380 48 T470 44 T560 50 T650 40 T740 48 T864 44 L864 63 L296 63 Z";
  const rover = `<g class="rv"><rect x="0" y="-8" width="16" height="7" rx="2" fill="${p.pink}"/>` +
    `<circle cx="3" cy="0" r="2.5" fill="${p.text}"/><circle cx="13" cy="0" r="2.5" fill="${p.text}"/>` +
    `<line x1="12" y1="-8" x2="15" y2="-13" stroke="${p.pink}"/></g>`;
  return {
    body: `${stars}<path d="${ridge}" fill="${p.line}"/>${rover}`,
    css: ".st{animation:tw 3s ease-in-out infinite} @keyframes tw{50%{opacity:.25}}" +
      " .rv{transform:translate(300px,48px);animation:drive 9s linear infinite} @keyframes drive{0%{transform:translate(300px,48px)}25%{transform:translate(440px,44px)}50%{transform:translate(580px,49px)}75%{transform:translate(720px,46px)}100%{transform:translate(850px,44px)}}",
  };
}

export const ART = { conveyor, candles, bars, scan, moonscape };
