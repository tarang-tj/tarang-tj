// The build gate. Run: npm test
//
// This repo had no test of any kind, so an unsubstituted template token or a
// theme that quietly stopped rendering would have shipped to the profile and
// been found by a visitor. These are the cheapest assertions that would have
// caught the things that actually went wrong while building it.
//
// Pure: renders to strings and asserts on them. Nothing writes a file, so
// running the suite cannot leave the working tree dirty.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { renderReadme } from "./build.mjs";
import { renderHero } from "./render-hero.mjs";

const stats = JSON.parse(await readFile("data/stats.json", "utf8"));
const history = JSON.parse(await readFile("data/history.json", "utf8"));
const entries = JSON.parse(await readFile("data/eval.json", "utf8"));
const score = { trials: 0, held: 0, breaks: 0, open: 0, closed: 0 };
const THEMES = ["dark", "light"];
const render = (t, s = score, h = history) => renderHero(stats, s, entries, h, t);

test("every template token is substituted", async () => {
  const out = await renderReadme(stats);
  const left = out.match(/\{\{\w+\}\}/g);
  assert.equal(left, null, `unsubstituted token(s): ${left ? [...new Set(left)].join(", ") : ""}`);
});

test("the README keeps its load-bearing sections", async () => {
  const out = await renderReadme(stats);
  // One per explorable command plus the one section that must never be collapsed.
  for (const needle of ["systems under test", "./limitations", "./stump", "ls ~/repos", "man profile"]) {
    assert.ok(out.includes(needle), `README lost "${needle}"`);
  }
});

test("the README points at both themes and not the retired single hero", async () => {
  const out = await renderReadme(stats);
  assert.ok(out.includes("assets/hero-dark.svg"), "dark hero not referenced");
  assert.ok(out.includes("assets/hero-light.svg"), "light hero not referenced");
  assert.ok(!/assets\/hero\.svg/.test(out), "still references the retired assets/hero.svg");
});

test("both themes render, and they are genuinely different", () => {
  const [dark, light] = THEMES.map((t) => render(t));
  for (const [name, svg] of [["dark", dark], ["light", light]]) {
    assert.ok(svg.startsWith("<svg"), `${name}: not an svg`);
    assert.ok(svg.trimEnd().endsWith("</svg>"), `${name}: unterminated`);
    assert.ok(/aria-label="[^"]+"/.test(svg), `${name}: missing aria-label`);
  }
  assert.notEqual(dark, light, "the theme argument does nothing");
  assert.ok(dark.includes("#050A07"), "dark lost its phosphor background");
  assert.ok(light.includes("#FAF8F1"), "light lost its paper background");
});

// The light theme exists because a dark terminal pasted onto a white page looks
// broken. If glow ever leaks into it, it stops reading as ink on paper.
test("the light theme is a printout, not a dimmed CRT", () => {
  const light = render("light");
  assert.ok(!/filter="url\(#ph\)"/.test(light), "phosphor glow leaked into the light theme");
  assert.ok(!/filter="url\(#soft\)"/.test(light), "soft glow leaked into the light theme");
  assert.ok(render("dark").includes('filter="url(#ph)"'), "the dark theme lost its glow");
});

// Animation is not available: an SVG embedded as an image runs in secure static
// mode, where declarative animation is disabled. Verified against a browser, and
// it matches the SVG Integration spec. So an animation here would not degrade,
// it would simply never run, and anything depending on one would vanish.
test("nothing here relies on animation, because animation cannot run", () => {
  for (const t of THEMES) {
    const svg = render(t);
    assert.ok(!/<animate|@keyframes|animation:/.test(svg), `${t}: contains an animation that will never run`);
  }
});

test("an unmeasured metric never renders as a fake zero", () => {
  const svg = renderHero(stats, { trials: 0, open: 0 }, [], [], "dark");
  assert.ok(svg.includes("no stranger has tried"), "zero trials did not render as words");
  assert.ok(svg.includes("self-test has not run yet"), "absent history did not render as words");
  assert.ok(!/0% self-test coverage/.test(svg), "absent coverage rendered as a fake 0%");
});

// Guards one failure: a row stops rendering while the summary keeps counting it,
// so the panel claims more than it shows. It deliberately does NOT catch a wrong
// number in SYSTEMS, because the summary is summed from that same array and the
// two move together by construction. Both faults were injected to confirm which
// one this actually catches.
test("the summary total matches the rows actually rendered", () => {
  const svg = render("dark");
  const headline = Number(svg.match(/·\s*(\d+)\s*passing/)?.[1]);
  const rows = [...svg.matchAll(/text-anchor="end">(\d+)<\/text>/g)].reduce((n, m) => n + Number(m[1]), 0);
  assert.ok(Number.isFinite(headline), "no summary total found");
  assert.equal(headline, rows, "the summary total disagrees with the rows it summarises");
});

// Inside SVG a style or text node is XML, not HTML. A stray angle bracket from
// unescaped data is read as markup and breaks the document, and the browser then
// shows a broken-image icon with no error anywhere. Caught exactly that way.
test("no unescaped markup can break XML parsing", () => {
  const hostile = { ...stats, languages: [{ name: '</text><script>x</script>' }], publicRepos: '"><b>' };
  for (const t of THEMES) {
    const svg = renderHero(hostile, score, entries, history, t);
    assert.ok(!svg.includes("<script>"), `${t}: unescaped markup reached the SVG`);
    const opens = [...svg.matchAll(/<([a-zA-Z]+)(?:\s[^>]*?)?(\/?)>/g)].filter((m) => !m[2]).length;
    const closes = [...svg.matchAll(/<\/([a-zA-Z]+)>/g)].length;
    assert.equal(opens, closes, `${t}: ${opens} opening tags against ${closes} closing tags`);
  }
});
