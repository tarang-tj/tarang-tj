// Renders a wide hero card for one project's own README, from that project's
// tile in data/board.json, so the profile tile and the repo landing page can
// never disagree on the headline number.
// Run: node scripts/render-repo-hero.mjs <tile-id> <out-dir>
//   writes <out-dir>/hero-dark.svg and <out-dir>/hero-light.svg
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { THEMES, esc, svg, frame } from "./board/theme.mjs";
import { ICONS } from "./board/icons.mjs";

export function renderRepoHero(tile, lane, theme) {
  const p = THEMES[theme], a = p[lane.accent];
  const icon = ICONS[tile.icon](p, a);
  const big = tile.big.length > 9 ? 44 : 56;
  const body = `${frame(880, 180, p, 14)}<rect x="0.5" y="0.5" width="6" height="179" rx="3" fill="${a}"/>` +
    `<text x="40" y="46" font-size="13" font-weight="700" letter-spacing="2" fill="${a}">${esc(lane.name.toUpperCase())}</text>` +
    `<text x="40" y="112" font-size="${big}" font-weight="700" fill="${p.text}" class="m">${esc(tile.big)}</text>` +
    `<text x="40" y="148" font-size="17" fill="${p.muted}">${esc(tile.label)}</text>` +
    `<g transform="translate(700 32) scale(2.7)">${icon.body}</g>`;
  return svg(880, 180, body, icon.css, `${tile.name}: ${tile.big}, ${tile.label}`);
}

async function main() {
  const [id, outDir] = process.argv.slice(2);
  if (!id || !outDir) throw new Error("usage: node scripts/render-repo-hero.mjs <tile-id> <out-dir>");
  const board = JSON.parse(await readFile(new URL("../data/board.json", import.meta.url), "utf8"));
  const lane = board.lanes.find((l) => l.tiles.some((t) => t.id === id));
  if (!lane) throw new Error(`no tile "${id}" in data/board.json`);
  const tile = lane.tiles.find((t) => t.id === id);
  await mkdir(outDir, { recursive: true });
  for (const theme of Object.keys(THEMES)) await writeFile(`${outDir}/hero-${theme}.svg`, renderRepoHero(tile, lane, theme));
  console.log(`wrote ${outDir}/hero-{dark,light}.svg for ${tile.name}`);
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
