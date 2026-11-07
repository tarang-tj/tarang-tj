// Renders the lane board: one header, one banner per lane, one tile per project,
// each in a dark and a light variant, plus the README markdown that lays them out.
// Input: data/board.json. Output: assets/board/*.svg and a markdown string.
import { THEMES, esc, svg, frame } from "./board/theme.mjs";
import { ART } from "./board/art.mjs";
import { ICONS } from "./board/icons.mjs";


export function renderHeader(h, theme) {
  const p = THEMES[theme];
  const pts = [[560, 92], [590, 80], [620, 86], [650, 62], [680, 70], [710, 48], [740, 58], [770, 34], [800, 40], [840, 22]];
  const poly = pts.map(([x, y]) => `${x},${y}`).join(" ");
  const stops = ["amber", "green", "blue", "purple", "pink"].map((k, i) => `<stop offset="${i / 4}" stop-color="${p[k]}"/>`).join("");
  const body =
    `<defs><linearGradient id="g" x1="0" x2="1">${stops}</linearGradient></defs>${frame(880, 120, p, 14)}` +
    `<text x="32" y="56" font-size="34" font-weight="700" fill="${p.text}">${esc(h.title)}</text>` +
    `<text x="32" y="86" font-size="16" fill="${p.muted}">${esc(h.tagline)}<tspan class="cur" fill="${p.green}">_</tspan></text>` +
    `<polyline class="ln" points="${poly}" fill="none" stroke="url(#g)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<circle r="5" fill="${p.pink}"><animateMotion dur="4s" repeatCount="indefinite" path="M${poly.replace(/ /g, " L")}"/></circle>`;
  const css = ".ln{stroke-dasharray:400;animation:draw 4s ease-in-out infinite} @keyframes draw{0%{stroke-dashoffset:200}60%,100%{stroke-dashoffset:0}}" +
    " .cur{animation:blink 1s steps(1) infinite} @keyframes blink{50%{opacity:0}}";
  return svg(880, 120, body, css, `${h.title}. ${h.tagline}.`);
}

export function renderBanner(lane, theme) {
  const p = THEMES[theme];
  const art = ART[lane.art](p);
  const body = `${frame(880, 64, p)}<circle cx="28" cy="32" r="6" fill="${p[lane.accent]}"/>` +
    `<text x="44" y="39" font-size="20" font-weight="700" fill="${p.text}">${esc(lane.name)}</text>${art.body}`;
  return svg(880, 64, body, art.css, `${lane.name} projects`);
}

export function renderTile(tile, accent, theme) {
  const p = THEMES[theme], a = p[accent];
  const icon = ICONS[tile.icon](p, a);
  const body = `${frame(288, 150, p)}<rect x="0.5" y="0.5" width="4" height="149" rx="2" fill="${a}"/>` +
    `<g transform="translate(232 18)">${icon.body}</g>` +
    `<text x="22" y="62" font-size="${tile.bigSize ?? 30}" font-weight="700" fill="${p.text}" class="m">${esc(tile.big)}</text>` +
    `<text x="22" y="92" font-size="13" fill="${p.muted}">${esc(tile.label)}</text>` +
    `<text x="22" y="128" font-size="14" font-weight="600" fill="${a}">${esc(tile.name)} →</text>`;
  return svg(288, 150, body, icon.css, `${tile.name}: ${tile.big}, ${tile.label}`);
}

// Every file the board needs, keyed by path under assets/board/.
export function renderBoardFiles(board) {
  const files = {};
  for (const theme of Object.keys(THEMES)) {
    files[`header-${theme}.svg`] = renderHeader(board.header, theme);
    for (const lane of board.lanes) {
      files[`lane-${lane.id}-${theme}.svg`] = renderBanner(lane, theme);
      for (const t of lane.tiles) files[`tile-${t.id}-${theme}.svg`] = renderTile(t, lane.accent, theme);
    }
  }
  return files;
}

// <picture> per image so each reader gets their colour scheme. Paths are
// relative, which GitHub resolves against the profile repo.
function picture(name, alt, width) {
  return `<picture><source media="(prefers-color-scheme: dark)" srcset="assets/board/${name}-dark.svg">` +
    `<source media="(prefers-color-scheme: light)" srcset="assets/board/${name}-light.svg">` +
    `<img src="assets/board/${name}-dark.svg" alt="${esc(alt)}" width="${width}"></picture>`;
}

export function renderBoardMarkdown(board) {
  const out = [`<p>${picture("header", `${board.header.title}. ${board.header.tagline}.`, "100%")}</p>`];
  for (const lane of board.lanes) {
    out.push(`<p>${picture(`lane-${lane.id}`, `${lane.name} projects`, "100%")}</p>`);
    const tiles = lane.tiles.map((t) => `<a href="${esc(t.link)}">${picture(`tile-${t.id}`, `${t.name}: ${t.big}, ${t.label}`, "32%")}</a>`);
    out.push(`<p>\n${tiles.join("\n")}\n</p>`);
  }
  return out.join("\n\n");
}

