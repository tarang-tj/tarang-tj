// The build gate. Run: npm test
//
// Pure: renders to strings and asserts on them. Nothing writes a file, so running
// the suite cannot leave the working tree dirty. The network half of the gate
// (every tile number matches its source README, every link answers 200) lives in
// scripts/verify-board.mjs, because a unit test should not depend on GitHub.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { renderReadme } from "./build.mjs";
import { renderBoardFiles, renderBoardMarkdown, renderTile } from "./render-board.mjs";
import { ICONS } from "./board/icons.mjs";
import { ART } from "./board/art.mjs";

const stats = JSON.parse(await readFile("data/stats.json", "utf8"));
const board = JSON.parse(await readFile("data/board.json", "utf8"));
const files = renderBoardFiles(board);
const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
const tiles = board.lanes.flatMap((l) => l.tiles.map((t) => ({ ...t, accent: l.accent })));

test("every template token is substituted", async () => {
  const out = await renderReadme(stats);
  const left = out.match(/\{\{\w+\}\}/g);
  assert.equal(left, null, `unsubstituted token(s): ${left ? [...new Set(left)].join(", ") : ""}`);
});

test("the false claim that README images cannot animate is gone", async () => {
  const out = await renderReadme(stats);
  assert.ok(!/secure static mode/i.test(out));
  assert.ok(!/\*\*0\*\* trials/.test(out), "the dead trial counter is back on the page");
});

test("one header, one banner per lane, one tile per project, in both themes", () => {
  const want = 2 * (1 + board.lanes.length + tiles.length);
  assert.equal(Object.keys(files).length, want);
  for (const t of ["dark", "light"]) {
    assert.ok(files[`header-${t}.svg`]);
    for (const l of board.lanes) assert.ok(files[`lane-${l.id}-${t}.svg`], `missing banner ${l.id} ${t}`);
    for (const x of tiles) assert.ok(files[`tile-${x.id}-${t}.svg`], `missing tile ${x.id} ${t}`);
  }
});

test("every lane names real art and every tile a real icon", () => {
  for (const l of board.lanes) assert.ok(ART[l.art], `lane ${l.id}: no art "${l.art}"`);
  for (const t of tiles) assert.ok(ICONS[t.icon], `tile ${t.id}: no icon "${t.icon}"`);
});

test("each tile shows exactly its own number and links where board.json says", () => {
  const md = renderBoardMarkdown(board);
  for (const t of tiles) {
    const svg = files[`tile-${t.id}-dark.svg`];
    assert.ok(svg.includes(`>${t.big.replace(/&/g, "&amp;")}<`), `tile ${t.id} does not render "${t.big}"`);
    assert.ok(md.includes(`<a href="${t.link}">`), `tile ${t.id} link missing from the README`);
  }
});

test("the big number is backed by its own source tokens", () => {
  // Offline half of the source rule: a tile cannot claim a number its cited
  // quotes do not contain. verify-board.mjs then checks the quotes against GitHub.
  for (const t of tiles) {
    const q = t.source.quotes.join(" ").toLowerCase();
    for (const k of t.source.tokens) assert.ok(q.includes(k.toLowerCase()), `${t.id}: token "${k}" not in its quotes`);
    const digits = t.big.match(/[\d.,]+/g) ?? [];
    for (const d of digits.filter((x) => /\d/.test(x))) {
      // A digit may also be cited spelled out ("Six rule modules", "seven real
      // vision models"), but only as the word for that exact number.
      const word = WORDS[Number(d)];
      const ok = q.includes(d.toLowerCase()) || (word !== undefined && new RegExp(`\\b${word}\\b`).test(q));
      assert.ok(ok, `${t.id}: "${d}" from "${t.big}" is not in its quotes`);
    }
  }
});

test("both themes render and differ", () => {
  for (const name of Object.keys(files).filter((n) => n.endsWith("-dark.svg"))) {
    const light = files[name.replace("-dark", "-light")];
    assert.notEqual(files[name], light, `${name}: light theme is identical to dark`);
  }
});

test("motion is decoration: nothing starts invisible", () => {
  // A keyframe that starts at opacity 0 strands the shape on any viewer that
  // paints frame one and stops. The blink at 50% is fine; a 0%/from at 0 is not.
  for (const [name, svg] of Object.entries(files)) {
    assert.ok(!/(?:from|(?<![\d.])0%)\s*\{[^}]*opacity:\s*0[;}]/.test(svg), `${name}: an animation starts at opacity 0`);
    assert.ok(!/animation-fill-mode:\s*backwards/.test(svg), `${name}: fill-mode backwards strands the first frame`);
  }
});

test("the SVGs actually animate", () => {
  assert.ok(/@keyframes/.test(files["header-dark.svg"]));
  for (const l of board.lanes) assert.ok(/@keyframes/.test(files[`lane-${l.id}-dark.svg`]), `banner ${l.id} is static`);
});

test("nothing inside an SVG reaches outside it", () => {
  // GitHub's image proxy serves SVGs with default-src 'none': external images,
  // fonts and scripts inside the file would silently fail.
  for (const [name, svg] of Object.entries(files)) {
    assert.ok(!/<script|href="http|@import|url\(http/i.test(svg), `${name}: references something outside the file`);
    assert.ok(svg.length < 60_000, `${name}: ${svg.length} bytes`);
  }
});

test("text from board.json is escaped", () => {
  const evil = { id: "x", big: "<b>&", label: "a<script>", name: "n\"", icon: "spark", link: "#" };
  const svg = renderTile(evil, "blue", "dark");
  assert.ok(!/<b>|<script>/.test(svg), "raw markup leaked into the SVG");
  assert.ok(svg.includes("&lt;b&gt;&amp;"));
});

test("markdown text above the fold stays short (the art carries the rest)", async () => {
  const out = await renderReadme(stats);
  const visible = out.split("<details>")[0].replace(/<!--[\s\S]*?-->/g, "").replace(/<[^>]+>/g, " ");
  const words = visible.split(/\s+/).filter(Boolean).length;
  assert.ok(words <= 40, `${words} words before the fold`);
});
