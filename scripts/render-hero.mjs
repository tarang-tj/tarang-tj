// Draws assets/hero-{dark,light}.svg: the profile rendered as an eval report.
//
// The panel is a test-runner summary, not a popularity counter. Rows are systems
// under test; each carries the evidence behind it and a status mark. Live figures
// (repo count, suite coverage, public trials) come from the pipeline; the
// per-system evidence is published fact from each repo, restated here so the panel
// has something true to show on a day when nobody has run a trial.
//
// Every row's resting state is its finished state, so a rasterised still frame
// (GitHub's mobile app, a screenshot, prefers-reduced-motion) is already the
// complete report rather than a half-drawn one.
//
// Two themes, because the panel sits on github.com and roughly half of visitors
// read it in light mode. Rendered as two files and selected with <picture>, which
// is the only method GitHub documents as reliable.

const W = 880;
const PAD = 34;
const ROW_H = 30;

// PASS means shipped, tested, and publicly verifiable. WIP means real but
// unfinished, and it stays WIP until it is not. Nothing here is aspirational.
const PASS = "pass";
const WIP = "wip";

// Evidence strings are published claims from each repo, restated so the panel can
// be read without clicking through. Test counts feed the header sum, so a number
// changed here changes the total: the row and the headline cannot disagree.
const SYSTEMS = [
  {
    name: "ragproof",
    evidence: "retrieval + generation eval · NDCG@10 0.72 vs 0.56 BM25",
    tests: 54,
    status: PASS,
  },
  {
    name: "claude-skill-audit",
    evidence: "37 checks across skills, agents, hooks, MCP · 0 deps",
    tests: 6,
    status: PASS,
  },
  {
    name: "starship-flow-control",
    evidence: "multi-level BOM constraint model · live demo",
    tests: 37,
    status: PASS,
  },
  {
    name: "the-breaker",
    evidence: "hardware kill-switch · design done, build in progress",
    tests: 0,
    status: WIP,
  },
];

const THEMES = {
  dark: {
    panel: "#121821",
    border: "#263041",
    rule: "#1E2836",
    ink: "#E6EDF3",
    muted: "#8B98A9",
    pass: "#7FD1A8",
    wip: "#F2A65A",
  },
  light: {
    panel: "#FFFFFF",
    border: "#D8DEE4",
    rule: "#E7EBEF",
    ink: "#1F2328",
    muted: "#5A6472",
    pass: "#1A7F5A",
    wip: "#8A5A00",
  },
};

const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const num = (v) => typeof v === "number" && Number.isFinite(v);

// history.json may be absent, empty, half-written or missing fields. Keep only
// days carrying real counts. Coverage is floored, never rounded: a suite that is
// 77.9% covered has not covered 78% of anything, and the README floors it too.
function coverageLabel(history) {
  if (!Array.isArray(history)) return "suite not run yet";
  const usable = history.filter((r) => {
    const s = r?.suite;
    return s && num(s.total) && num(s.covered) && s.total > 0;
  });
  const run = usable.at(-1);
  if (!run) return "suite not run yet";
  const { total, covered } = run.suite;
  return `${Math.floor((covered / total) * 100)}% self-test coverage (${covered}/${total})`;
}

// No measurement prints as words, never as a fake 0.
function trialLabel(s) {
  const n = s?.trials ?? 0;
  if (!n) return "open to public trial, none run yet";
  const open = s.open ?? 0;
  return `${n} public trial${n === 1 ? "" : "s"} · ${open} gap${open === 1 ? "" : "s"} open`;
}

export function renderHero(stats, s, entries, history, theme = "dark") {
  const C = THEMES[theme] ?? THEMES.dark;

  // The harness is the last row, not the headline. It is instrumentation on this
  // page rather than the achievement, and leading with it made an empty
  // scoreboard the first thing a visitor read.
  const rows = [
    ...SYSTEMS,
    {
      name: "this profile",
      evidence: `retrieval harness over data/facts.md · ${trialLabel(s)}`,
      tests: 0,
      status: WIP,
    },
  ];

  const totalTests = rows.reduce((n, r) => n + r.tests, 0);
  const shipped = rows.filter((r) => r.status === PASS).length;

  const headTop = PAD + 46;
  // The divider is drawn at listTop - 22, so this gap has to clear the subtitle
  // baseline at headTop + 34 or the rule strikes through the text.
  const listTop = headTop + 78;
  const footY = listTop + rows.length * ROW_H + 30;
  const H = footY + 26;

  const langs = (stats.languages ?? []).map((l) => l.name).join("  ·  ");
  const coverage = coverageLabel(history);

  const rowSvg = rows
    .map((r, i) => {
      const y = listTop + i * ROW_H;
      const col = r.status === PASS ? C.pass : C.wip;
      const mark = r.status === PASS ? "PASS" : "WIP";
      const right = r.tests ? `${r.tests} tests` : "";
      return `
  <g>
    <text x="${PAD}" y="${y}" fill="${col}" font-size="11" letter-spacing="1.2">${mark}</text>
    <text x="${PAD + 48}" y="${y}" fill="${C.ink}" font-size="13.5">${esc(r.name)}</text>
    <text x="${PAD + 250}" y="${y}" fill="${C.muted}" font-size="12.5">${esc(r.evidence)}</text>
    <text x="${W - PAD}" y="${y}" fill="${C.muted}" font-size="12" text-anchor="end">${esc(right)}</text>
  </g>`;
    })
    .join("");

  const ariaRows = rows
    .map((r) => `${r.name}, ${r.status === PASS ? "pass" : "in progress"}, ${r.evidence}`)
    .join(". ");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Evaluation report for Tarang Jammalamadaka, verified ${esc(stats.verifiedAt)}. ${shipped} systems shipped and tested, ${totalTests} tests passing. ${esc(ariaRows)}. ${esc(coverage)}.">
<style>
  text { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
  /* Nothing that carries information is animated, and nothing depends on an
     animation running in order to be visible.
     This was learned the hard way. An earlier draft revealed each row with a
     staggered keyframe. Loaded as a document it looked right, but GitHub embeds
     this file as an image, which is secure static mode: the browser applied the
     animation's starting keyframe and then never advanced it, so every row
     stayed at opacity 0 and the panel rendered as a header and a footer with a
     hole between them. A backwards fill mode strands content exactly like a
     hardcoded zero opacity there.
     Note also that this comment may not contain an angle bracket: inside SVG a
     style element is parsed as XML, not as HTML, so a stray tag in here is read
     as markup and breaks the whole document.
     So the only animation left is the sweep below, which is purely additive: it
     starts transparent and adds a moving highlight. If it never runs, nothing is
     lost, because it never had anything to reveal. */
  .sweep { opacity: 0; animation: sweep 7s linear infinite; }
  @keyframes sweep {
    0%   { opacity: 0; transform: translateX(0); }
    8%   { opacity: .55; }
    60%  { opacity: .55; }
    72%  { opacity: 0; transform: translateX(${W - PAD * 2}px); }
    100% { opacity: 0; transform: translateX(${W - PAD * 2}px); }
  }
  @media (prefers-reduced-motion: reduce) { .sweep { animation: none; } }
</style>
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="10" fill="${C.panel}" stroke="${C.border}"/>

  <text x="${PAD}" y="${PAD + 14}" fill="${C.muted}" font-size="11" letter-spacing="2.6">EVAL REPORT</text>
  <text x="${W - PAD}" y="${PAD + 14}" fill="${C.muted}" font-size="11" text-anchor="end">verified ${esc(stats.verifiedAt)}</text>

  <text x="${PAD}" y="${headTop + 12}" fill="${C.ink}" font-size="19">${shipped} systems shipped · ${totalTests} tests passing</text>
  <text x="${PAD}" y="${headTop + 34}" fill="${C.muted}" font-size="12.5">every figure below is checked into something you can run yourself</text>

  <line x1="${PAD}" y1="${listTop - 22}" x2="${W - PAD}" y2="${listTop - 22}" stroke="${C.rule}"/>
${rowSvg}
  <rect class="sweep" x="${PAD}" y="${listTop - 20}" width="2" height="${rows.length * ROW_H}" fill="${C.pass}"/>
  <line x1="${PAD}" y1="${footY - 22}" x2="${W - PAD}" y2="${footY - 22}" stroke="${C.rule}"/>

  <text x="${PAD}" y="${footY}" fill="${C.muted}" font-size="12">${esc(stats.publicRepos)} public repos  ·  ${esc(langs)}</text>
  <text x="${W - PAD}" y="${footY}" fill="${C.muted}" font-size="12" text-anchor="end">${esc(coverage)}</text>
</svg>
`;
}
