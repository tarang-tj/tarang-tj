// Draws the live scoreboard at the top of the README.
//
// The profile is an evaluation harness pointed at itself: every question a visitor
// asks is a trial, drawn as one mark in a test-suite strip. Mint held, amber broke.
// See the note on animation in the stylesheet below.
const C = {
  panel: "#121821",
  border: "#263041",
  rule: "#1E2836",
  ink: "#E6EDF3",
  muted: "#8B98A9",
  amber: "#F2A65A",
  mint: "#7FD1A8",
  empty: "#1B2430",
};

const W = 880;
const PAD = 32;
const CELL = 13;
const GAP = 5;
const PER_ROW = Math.floor((W - PAD * 2 + GAP) / (CELL + GAP));
// Always draw a full grid so the panel keeps its shape from the first day.
const MIN_SLOTS = PER_ROW * 2;

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const truncate = (s, n) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

function strip(entries, top) {
  const slots = Math.max(MIN_SLOTS, Math.ceil(entries.length / PER_ROW) * PER_ROW);
  const newest = entries.length - 1;
  const marks = [];
  for (let i = 0; i < slots; i++) {
    const e = entries[i];
    const fill = !e ? C.empty : e.verdict === "break" ? C.amber : C.mint;
    const x = PAD + (i % PER_ROW) * (CELL + GAP);
    const y = top + Math.floor(i / PER_ROW) * (CELL + GAP);
    const round = e ? 3 : 2;
    // Only the most recent trial moves, so the motion means "this just happened"
    // rather than being decoration.
    const cls = i === newest ? ' class="fresh"' : "";
    marks.push(
      `<rect${cls} x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="${round}" fill="${fill}"${e ? "" : ' opacity="0.75"'}/>`,
    );
  }
  const rows = slots / PER_ROW;
  return { markup: marks.join(""), height: rows * (CELL + GAP) - GAP };
}

function statLine(s, y) {
  if (!s.trials) {
    return `<text class="stat" x="${PAD}" y="${y}">no one has tried yet. an untested claim is just a claim.</text>`;
  }
  const parts = [
    `<tspan class="figure">${s.held}</tspan> held`,
    `<tspan class="fig-amber">${s.breaks}</tspan> stumped`,
    `<tspan class="figure">${s.closed}</tspan> gaps closed`,
    `<tspan class="figure">${s.open}</tspan> still open`,
  ];
  return `<text class="stat" x="${PAD}" y="${y}">${parts.join('<tspan class="sep">  ·  </tspan>')}</text>`;
}

const num = (v) => typeof v === "number" && Number.isFinite(v);
// Two decimals at most. Per-trial faithfulness can only land on 0, .33, .67 or 1
// because answers are capped at three sentences, so more precision is noise.
const proxy = (v) => String(Number(v.toFixed(2)));

// Faithfulness here is ragproof's algorithm and threshold run with the hash
// bag-of-words embedder from that repo's test suite, so it measures lexical
// overlap with the retrieved facts, not entailment. The panel says "proxy" and
// says so in words, because a bare 0.67 would read as a claim it cannot support.
function groundingLine(s, y) {
  const parts = [];
  if (!s.generated) {
    parts.push("no model-written answer scored yet. a grounding score needs a generated answer.");
  } else {
    parts.push(`<tspan class="figure">${s.generated}</tspan> model-written`);
    if (num(s.meanFaithfulness)) {
      parts.push(`grounding proxy <tspan class="figure">${proxy(s.meanFaithfulness)}</tspan>`);
      parts.push("lexical overlap, not entailment");
    } else {
      parts.push("grounding not scored");
    }
  }
  return `<text class="stat" x="${PAD}" y="${y}">${parts.join('<tspan class="sep">  ·  </tspan>')}</text>`;
}

// The grounding row, said in words for a screen reader. Same honest framing the
// panel gives sighted readers: how many answers the model wrote, the proxy figure
// only when there is one, and what the proxy actually measures.
function ariaGrounding(s) {
  const generated = num(s.generated) ? s.generated : 0;
  if (!generated) return "no model-written answer has been scored yet";
  const figure = num(s.meanFaithfulness)
    ? `a grounding proxy of ${proxy(s.meanFaithfulness)} from lexical overlap, not entailment`
    : "no grounding score yet";
  return `${generated} of them model-written with ${figure}`;
}

export function renderHero(stats, s = { trials: 0 }, entries = []) {
  const stripTop = 108;
  const grid = strip(entries, stripTop);
  const statY = stripTop + grid.height + 34;
  const groundY = statY + 20;
  const ruleY = groundY + 20;
  const footY = ruleY + 26;
  const H = footY + 18;

  const rate =
    s.trials > 0
      ? `<tspan class="rate">${s.answerRate}%</tspan><tspan class="rate-label"> answered from its own facts</tspan>`
      : `<tspan class="rate">trial 001</tspan><tspan class="rate-label"> unclaimed</tspan>`;

  const last = s.lastBreak
    ? `last break: "${esc(truncate(s.lastBreak.question, 58))}"${s.lastBreak.handle ? ` by ${esc(s.lastBreak.handle)}` : ""}`
    : "every question a visitor asks is logged here, answered or not.";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Live scoreboard: ${s.trials || 0} questions asked of this profile's grounded bot, ${s.held || 0} answered and ${s.breaks || 0} unanswered, ${ariaGrounding(s)}.">
<style>
  .panel { fill: ${C.panel}; stroke: ${C.border}; }
  text { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
  .eyebrow { fill: ${C.amber}; font-size: 12px; letter-spacing: 2.6px; }
  .stamp { fill: ${C.muted}; font-size: 12px; }
  .rate { fill: ${C.ink}; font-size: 26px; font-weight: 600; }
  .rate-label { fill: ${C.muted}; font-size: 14px; }
  .stat { fill: ${C.muted}; font-size: 13.5px; }
  .figure { fill: ${C.mint}; font-weight: 600; }
  .fig-amber { fill: ${C.amber}; font-weight: 600; }
  .sep { fill: ${C.rule}; }
  .note { fill: ${C.muted}; font-size: 12px; }
  .rule { stroke: ${C.rule}; stroke-width: 1; }
  /* GitHub serves this file as image/svg+xml with the stylesheet intact, so CSS
     animation does play in a browser. It is still written so that every element's
     RESTING state is the finished state: nothing animates in from opacity 0. A
     still frame of this panel is complete, which keeps it correct anywhere the SVG
     gets rasterised (link previews, screenshots, some readers). Exactly one thing
     moves, and only because it carries meaning: the most recent trial. */
  .fresh { animation: pulse 1.9s ease-in-out infinite; }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .42; } }
  @media (prefers-reduced-motion: reduce) {
    .fresh { animation: none; }
  }
</style>
<rect class="panel" x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="14"/>
<text class="eyebrow" x="${PAD}" y="42">ADVERSARIAL EVAL</text>
<text class="stamp" x="${W - PAD}" y="42" text-anchor="end">${s.trials || 0} trials · updated ${esc(stats.verifiedAt)}</text>
<line class="rule" x1="${PAD}" y1="62" x2="${W - PAD}" y2="62"/>
<text x="${PAD}" y="92">${rate}</text>
${grid.markup}
${statLine(s, statY)}
${groundingLine(s, groundY)}
<line class="rule" x1="${PAD}" y1="${ruleY}" x2="${W - PAD}" y2="${ruleY}"/>
<text class="note" x="${PAD}" y="${footY}">${esc(last)}</text>
</svg>
`;
}
