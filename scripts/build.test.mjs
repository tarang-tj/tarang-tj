// The build gate. Run from the repo root: node --test scripts/
//
// This repo had no test of any kind, so a template token that never got
// substituted, or a theme that silently stopped rendering, would have shipped to
// the profile and been discovered by a visitor. These assertions are the cheapest
// things that would have caught that.
//
// Pure: it renders to strings and asserts on them. Nothing here writes a file, so
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

test("every template token is substituted", async () => {
  const out = await renderReadme(stats);
  const left = out.match(/\{\{\w+\}\}/g);
  assert.equal(
    left,
    null,
    `unsubstituted token(s) left in README: ${left ? [...new Set(left)].join(", ") : ""}`,
  );
});

test("the rendered README still carries its load-bearing sections", async () => {
  const out = await renderReadme(stats);
  for (const needle of ["systems under test", "known limitations", "add a failing test case"]) {
    assert.ok(out.includes(needle), `README lost its "${needle}" section`);
  }
});

test("the README points at both theme assets and never at the retired single hero", async () => {
  const out = await renderReadme(stats);
  assert.ok(out.includes("assets/hero-dark.svg"), "dark hero not referenced");
  assert.ok(out.includes("assets/hero-light.svg"), "light hero not referenced");
  assert.ok(
    !/assets\/hero\.svg/.test(out),
    "README still references assets/hero.svg, which is no longer generated",
  );
});

test("both themes render, and they are actually different", () => {
  const dark = renderHero(stats, score, entries, history, "dark");
  const light = renderHero(stats, score, entries, history, "light");

  for (const [name, svg] of [
    ["dark", dark],
    ["light", light],
  ]) {
    assert.ok(svg.startsWith("<svg"), `${name}: not an svg`);
    assert.ok(svg.trimEnd().endsWith("</svg>"), `${name}: unterminated svg`);
    assert.ok(/aria-label="[^"]+"/.test(svg), `${name}: missing aria-label`);
  }

  assert.notEqual(dark, light, "both themes rendered identically, so the theme argument does nothing");
  assert.ok(dark.includes("#121821"), "dark theme lost its dark panel");
  assert.ok(light.includes("#FFFFFF"), "light theme lost its light panel");
});

test("an unmeasured metric never renders as a fake zero", () => {
  // No trials logged and no usable history: the panel must say so in words rather
  // than print 0%, which would read as a measured failure instead of no reading.
  const svg = renderHero(stats, { trials: 0, open: 0 }, [], [], "dark");
  assert.ok(svg.includes("none run yet"), "zero trials did not render as words");
  assert.ok(svg.includes("suite not run yet"), "absent history did not render as words");
  assert.ok(!/\b0% self-test coverage/.test(svg), "absent coverage rendered as a fake 0%");
});

// Guards one specific failure: a row stops rendering while the headline keeps
// counting it, so the panel claims more than it shows. It deliberately does NOT
// catch a wrong test count in SYSTEMS, because the headline is summed from that
// same array and the two move together by construction. Verified by injecting
// both faults: a dropped row goes red here, an edited count does not.
test("the headline total matches the rows actually rendered", () => {
  const svg = renderHero(stats, score, entries, history, "dark");
  const headline = Number(svg.match(/systems shipped · (\d+) tests passing/)?.[1]);
  const rows = [...svg.matchAll(/>(\d+) tests</g)].reduce((n, m) => n + Number(m[1]), 0);
  assert.ok(Number.isFinite(headline), "no headline test count found");
  assert.equal(headline, rows, "the headline total disagrees with the rows it summarises");
});

// Regression guard for a bug that was caught in a browser, not in review. A draft
// revealed each row with a staggered keyframe. GitHub embeds this SVG with <img>,
// which is secure static mode: the browser painted the animation's first keyframe
// and never advanced, so every row sat at opacity 0 and the panel rendered as a
// header and a footer with a hole between them.
//
// The invariant that prevents it: nothing carrying information may be animated,
// and no animation fill mode may strand an element in its starting keyframe. The
// only animated thing is the decorative sweep, which starts transparent and only
// ever adds, so a renderer that ignores it loses nothing.
test("no content depends on an animation running to be visible", () => {
  const svg = renderHero(stats, score, entries, history, "dark");
  const raw = svg.match(/<style>[\s\S]*?<\/style>/)?.[0] ?? "";
  assert.ok(raw, "no stylesheet found");
  // Strip CSS comments first. The comment above this rule names the very
  // properties being banned, and matching against it made this assertion fail on
  // its own documentation.
  const style = raw.replace(/\/\*[\s\S]*?\*\//g, "");

  assert.ok(
    !/animation-fill-mode|forwards|backwards/.test(style),
    "an animation fill mode can strand an element in its first keyframe under <img>",
  );

  const animated = [...style.matchAll(/^\s*\.([\w-]+)\s*\{[^}]*animation:/gm)].map((m) => m[1]);
  assert.deepEqual(
    [...new Set(animated)],
    ["sweep"],
    "something other than the decorative sweep is animated",
  );

  // The sweep must be a plain rect. The moment it decorates a <text>, an
  // unrendered animation starts hiding words again.
  const sweepTags = [...svg.matchAll(/<(\w+)[^>]*class="sweep"/g)].map((m) => m[1]);
  assert.deepEqual([...new Set(sweepTags)], ["rect"], "the sweep is attached to something that carries text");
  assert.ok(!/class="row"/.test(svg), "rows still carry an animated class");
});

// Inside SVG a style element is XML, not HTML: its contents are parsed as markup
// rather than as raw text. A single angle bracket in a CSS comment therefore
// breaks the whole document, and the browser shows a broken-image icon with no
// error anywhere. Caught exactly that way, by a rendered page, not by review.
test("the stylesheet contains no markup that would break XML parsing", () => {
  for (const theme of ["dark", "light"]) {
    const svg = renderHero(stats, score, entries, history, theme);
    const inner = svg.match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? "";
    assert.ok(inner, `${theme}: no stylesheet found`);
    assert.ok(!/[<>]/.test(inner), `${theme}: an angle bracket inside <style> will be parsed as XML markup`);
  }
});

// Cheap structural well-formedness check without pulling in an XML parser, since
// this repo ships zero dependencies on purpose. Counts tag openings against
// closings and self-closings.
test("every rendered SVG is structurally balanced", () => {
  for (const theme of ["dark", "light"]) {
    const svg = renderHero(stats, score, entries, history, theme);
    const opens = [...svg.matchAll(/<([a-zA-Z]+)(?:\s[^>]*?)?(\/?)>/g)];
    const closes = [...svg.matchAll(/<\/([a-zA-Z]+)>/g)].map((m) => m[1]);
    const stack = [];
    for (const [, tag, selfClose] of opens) if (!selfClose) stack.push(tag);
    assert.equal(
      stack.length,
      closes.length,
      `${theme}: ${stack.length} opening tags against ${closes.length} closing tags`,
    );
  }
});

test("markup in the corpus cannot break out of the SVG", () => {
  const hostile = { ...stats, languages: [{ name: '</text><script>x</script>' }] };
  const svg = renderHero(hostile, score, entries, history, "dark");
  assert.ok(!svg.includes("<script>"), "unescaped markup reached the SVG");
});
