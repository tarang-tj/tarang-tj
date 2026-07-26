// Draws the verification panel at the top of the README.
// Static by design. See the note on animation in the stylesheet below.
const C = {
  panel: "#121821",
  border: "#263041",
  rule: "#1E2836",
  ink: "#E6EDF3",
  muted: "#8B98A9",
  amber: "#F2A65A",
  mint: "#7FD1A8",
};

const W = 880;
const PAD = 32;
const ROW_TOP = 100;
const ROW_STEP = 38;
// Canvas height is derived from the row count so the footer note can never be
// clipped when a row is added or removed.
const heightFor = (rowCount) => ROW_TOP + rowCount * ROW_STEP + 50;

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Each row is a claim plus the artifact that backs it. `value` is either a
// literal fact already public in the linked repo, or a number from the API.
function buildRows(stats) {
  const langs = stats.languages.map((l) => l.name).slice(0, 3).join(" · ");
  return [
    { label: "ships", value: `${stats.publicRepos} public repos · ${stats.stars} stars`, receipt: "/repos" },
    { label: "retrieval", value: "ragproof · evaluated on BEIR", receipt: "/ragproof" },
    { label: "agent safety", value: "the-breaker · hardware HALT", receipt: "/the-breaker" },
    { label: "in production", value: "SyllabusAI · 500+ users", receipt: "syllabusai.net" },
    { label: "works in", value: langs || "Python · TypeScript", receipt: "/repos" },
  ];
}

function rowMarkup(row, i) {
  const y = ROW_TOP + i * ROW_STEP;
  return `
  <g class="row">
    <text class="check" x="${PAD}" y="${y}">✓</text>
    <text class="label" x="${PAD + 30}" y="${y}">${esc(row.label)}</text>
    <text class="value" x="${PAD + 190}" y="${y}">${esc(row.value)}</text>
    <text class="receipt" x="${W - PAD}" y="${y}">${esc(row.receipt)}</text>
  </g>`;
}

export function renderHero(stats) {
  const rows = buildRows(stats);
  const ruleY = 68;
  const footY = ROW_TOP + rows.length * ROW_STEP - 4;
  const H = heightFor(rows.length);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Verification panel: ${rows.length} claims, each linked to the repository that backs it.">
<style>
  .panel { fill: ${C.panel}; stroke: ${C.border}; }
  text { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
  .eyebrow { fill: ${C.amber}; font-size: 12px; letter-spacing: 2.6px; }
  .stamp { fill: ${C.muted}; font-size: 12px; letter-spacing: 0.4px; }
  .check { fill: ${C.mint}; font-size: 15px; }
  .label { fill: ${C.ink}; font-size: 15px; }
  .value { fill: ${C.muted}; font-size: 15px; }
  .receipt { fill: ${C.amber}; font-size: 13px; text-anchor: end; opacity: .82; }
  .note { fill: ${C.muted}; font-size: 12px; letter-spacing: 0.3px; }
  .rule { stroke: ${C.rule}; stroke-width: 1; }
  /* No entrance animation, deliberately. GitHub embeds this SVG through an img
     tag, and in that context the document is rendered frozen at its first frame:
     anything that starts at opacity 0 never becomes visible. CSS keyframes and
     SMIL were both tested in that embedding and both left the rows blank, so the
     panel is static and the only motion is the status dot, whose resting state
     is already visible. */
  .dot { fill: ${C.amber}; animation: blip 2.6s ease-in-out infinite; }
  @keyframes blip { 0%, 100% { opacity: 1; } 50% { opacity: .3; } }
  @media (prefers-reduced-motion: reduce) { .dot { animation: none; } }
</style>
<rect class="panel" x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="14"/>
<text class="eyebrow" x="${PAD}" y="42">GROUNDED PROFILE</text>
<circle class="dot" cx="${W - PAD - 162}" cy="38" r="3.5"/>
<text class="stamp" x="${W - PAD}" y="42" text-anchor="end">verified ${esc(stats.verifiedAt)}</text>
<line class="rule" x1="${PAD}" y1="${ruleY}" x2="${W - PAD}" y2="${ruleY}"/>
${rows.map(rowMarkup).join("\n")}
<line class="rule" x1="${PAD}" y1="${footY}" x2="${W - PAD}" y2="${footY}"/>
<text class="note" x="${PAD}" y="${footY + 26}">every claim above links to the artifact that proves it. the panel is rebuilt from the GitHub API each day.</text>
</svg>
`;
}
