// Draws the instrument trace at the top of the README.
//
// The profile is an evaluation harness pointed at itself, so the panel is a
// readout rather than a banner: how much of the question suite the facts file
// can answer, plotted one point per day, with an amber tick under every day a
// stranger ran a public trial. Regression baseline underneath, adversarial
// activity marked against it. See the note on animation in the stylesheet.
const C = {
  panel: "#121821",
  border: "#263041",
  rule: "#1E2836",
  grid: "#1B2430",
  ink: "#E6EDF3",
  muted: "#8B98A9",
  amber: "#F2A65A",
  mint: "#7FD1A8",
};

const W = 880;
const PAD = 32;
const PLOT_L = PAD + 36; // gutter for the two reference-line labels
const PLOT_R = W - PAD;
const PLOT_W = PLOT_R - PLOT_L;
const PLOT_TOP = 118; // y of coverage 1.0
// Kept deliberately short. Real coverage sits in the top half, so a taller plot
// just adds dead space below the trace. The alternative, truncating the y-axis to
// start at 0.5, would exaggerate small movements, which is the exact chart
// dishonesty this profile argues against. The domain stays a full 0.0 to 1.0.
const PLOT_H = 88; // 1.0 down to 0.0
const PLOT_BOT = PLOT_TOP + PLOT_H;

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const truncate = (s, n) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

const num = (v) => typeof v === "number" && Number.isFinite(v);
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const r1 = (v) => Math.round(v * 10) / 10;
// Coverage is floored, like the answer rate: a suite that is 80.9% covered has
// not covered 81% of anything.
const pct = (v) => Math.floor(clamp01(v) * 100);

// history.json may be absent, empty, half-written or missing fields. Read it
// defensively and keep only days that carry a real coverage number, so the
// trace never has to draw a hole.
function readings(history) {
  if (!Array.isArray(history)) return [];
  const out = [];
  for (const d of history) {
    if (!d || typeof d !== "object") continue;
    const suite = d.suite && typeof d.suite === "object" ? d.suite : {};
    const trials = d.trials && typeof d.trials === "object" ? d.trials : {};
    // Prefer the raw counts over the stored coverage field. The stored value is
    // rounded to two decimals when it is written, so flooring it here would print
    // 78% while the README floors the true ratio and prints 77%. Same page, two
    // numbers, one of them wrong.
    let coverage =
      num(suite.covered) && num(suite.total) && suite.total > 0
        ? suite.covered / suite.total
        : suite.coverage;
    if (!num(coverage)) continue;
    out.push({
      date: typeof d.date === "string" ? d.date : "",
      coverage: clamp01(coverage),
      total: num(suite.total) ? suite.total : null,
      covered: num(suite.covered) ? suite.covered : null,
      trials: num(trials.total) ? trials.total : 0,
    });
  }
  return out;
}

const xAt = (i, n) => (n < 2 ? PLOT_R : PLOT_L + (i * PLOT_W) / (n - 1));
const yAt = (coverage) => PLOT_BOT - clamp01(coverage) * PLOT_H;

// Frame: five faint verticals, a baseline at 0, and the two labelled reference
// lines that stand in for a y axis. Drawn whether or not there is data, so the
// panel has the same shape on day one as on day two hundred.
function frame() {
  const verticals = [0, 0.25, 0.5, 0.75, 1]
    .map((f) => {
      const x = r1(PLOT_L + f * PLOT_W);
      return `<line class="grid" x1="${x}" y1="${PLOT_TOP}" x2="${x}" y2="${PLOT_BOT}"/>`;
    })
    .join("");
  const refs = [1, 0.5]
    .map(
      (v) =>
        `<line class="ref" x1="${PLOT_L}" y1="${yAt(v)}" x2="${PLOT_R}" y2="${yAt(v)}"/>` +
        `<text class="axis" x="${PLOT_L - 10}" y="${yAt(v) + 3.5}" text-anchor="end">${v.toFixed(1)}</text>`,
    )
    .join("");
  return `${verticals}${refs}<line class="axis-line" x1="${PLOT_L}" y1="${PLOT_BOT}" x2="${PLOT_R}" y2="${PLOT_BOT}"/>`;
}

function trace(rs) {
  if (!rs.length) {
    return `<text class="empty" x="${PLOT_L + PLOT_W / 2}" y="${yAt(0.5) - 12}" text-anchor="middle">no readings yet. the first daily run draws the trace.</text>`;
  }
  const pts = rs.map((d, i) => [r1(xAt(i, rs.length)), r1(yAt(d.coverage))]);
  const head = pts[pts.length - 1];

  // One reading is a level, not a trend. Draw it as a flat dashed baseline with
  // the single marker on it rather than a one-segment path that reads as broken.
  if (pts.length === 1) {
    return `<line class="lone" x1="${PLOT_L}" y1="${head[1]}" x2="${PLOT_R}" y2="${head[1]}"/>${headMark(head)}`;
  }

  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" ");
  const area = `${line} L${head[0]} ${PLOT_BOT} L${pts[0][0]} ${PLOT_BOT} Z`;
  // Individual readings are only worth marking while they are countable.
  const dots =
    pts.length <= 24
      ? pts
          .slice(0, -1)
          .map(([x, y]) => `<circle class="dot" cx="${x}" cy="${y}" r="2"/>`)
          .join("")
      : "";
  return `<path class="area" d="${area}"/><path class="line" d="${line}"/>${dots}${headMark(head)}`;
}

const headMark = ([x, y]) =>
  `<circle class="head-halo" cx="${x}" cy="${y}" r="5.5"/><circle class="head" cx="${x}" cy="${y}" r="3"/>`;

// A day counts as a trial day when the running trial total went up. The first
// reading counts if anyone had already tried by then.
function trialDays(rs) {
  const xs = [];
  for (let i = 0; i < rs.length; i++) {
    const ran = i === 0 ? rs[i].trials > 0 : rs[i].trials > rs[i - 1].trials;
    if (ran) xs.push(r1(xAt(i, rs.length)));
  }
  return xs;
}

const trialTicks = (xs) =>
  xs
    .map((x) => `<line class="tick" x1="${x}" y1="${PLOT_BOT + 5}" x2="${x}" y2="${PLOT_BOT + 12}"/>`)
    .join("");

function axisRow(rs, y, tickCount) {
  if (!rs.length) return "";
  const first = rs[0].date;
  const last = rs[rs.length - 1].date;
  const ends =
    rs.length > 1 && first && last
      ? `<text class="axis" x="${PLOT_L}" y="${y}">${esc(first)}</text>` +
        `<text class="axis" x="${PLOT_R}" y="${y}" text-anchor="end">${esc(last)}</text>`
      : last
        ? `<text class="axis" x="${PLOT_R}" y="${y}" text-anchor="end">${esc(last)}</text>`
        : "";
  // Only explain the tick when there is a tick on the panel to explain.
  const legend = tickCount
    ? `<text class="axis" x="${PLOT_L + PLOT_W / 2}" y="${y}" text-anchor="middle"><tspan class="tick-key">|</tspan> day a public trial ran</text>`
    : "";
  return `${ends}${legend}`;
}

// Suite readout. Drift is the change across the whole window, which is the
// thing the panel is actually watching for.
function suiteLine(rs, y) {
  if (!rs.length) {
    return `<text class="stat" x="${PAD}" y="${y}">suite coverage not measured yet. the daily run writes the first reading.</text>`;
  }
  const d = rs[rs.length - 1];
  const parts = [];
  if (num(d.covered) && num(d.total)) {
    parts.push(`<tspan class="figure">${d.covered}</tspan> of <tspan class="figure">${d.total}</tspan> suite questions covered`);
    const gap = Math.max(0, d.total - d.covered);
    parts.push(`<tspan class="${gap ? "fig-amber" : "figure"}">${gap}</tspan> uncovered`);
  } else {
    parts.push(`coverage <tspan class="figure">${pct(d.coverage)}%</tspan>`);
  }
  if (rs.length > 1) {
    const delta = pct(d.coverage) - pct(rs[0].coverage);
    const sign = delta > 0 ? "+" : delta < 0 ? "-" : "";
    const cls = delta < 0 ? "fig-amber" : "figure";
    parts.push(
      `drift <tspan class="${cls}">${sign}${Math.abs(delta)} pts</tspan> over ${rs.length} readings`,
    );
  }
  return `<text class="stat" x="${PAD}" y="${y}">${parts.join('<tspan class="sep">  ·  </tspan>')}</text>`;
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

function ariaTrace(rs) {
  if (!rs.length) return "Suite coverage has not been measured yet";
  const d = rs[rs.length - 1];
  const window =
    rs.length > 1
      ? `, traced over ${rs.length} daily readings from ${pct(rs[0].coverage)}%`
      : ", one reading so far";
  return `Suite coverage ${pct(d.coverage)}%${window}`;
}

export function renderHero(stats, s = { trials: 0 }, entries = [], history = []) {
  const rs = readings(history);
  const ticks = trialDays(rs);
  const axisY = PLOT_BOT + 30;
  // With no readings there is no date row to leave room for, so the panel closes
  // up rather than sitting on an empty band.
  const suiteY = axisY + (rs.length ? 34 : 12);
  const statY = suiteY + 20;
  const groundY = statY + 20;
  const ruleY = groundY + 20;
  const footY = ruleY + 26;
  const H = footY + 18;

  const latest = rs.length ? rs[rs.length - 1] : null;
  const rate = latest
    ? `<tspan class="rate">${pct(latest.coverage)}%</tspan><tspan class="rate-label"> of its own question suite answerable from its own facts</tspan>`
    : `<tspan class="rate">no reading yet</tspan><tspan class="rate-label"> the first daily run draws the trace</tspan>`;

  const last = s.lastBreak
    ? `last break: "${esc(truncate(s.lastBreak.question, 58))}"${s.lastBreak.handle ? ` by ${esc(s.lastBreak.handle)}` : ""}`
    : "every question a visitor asks is logged here, answered or not.";

  // Decorative only, and only when there is a trace to sweep.
  // The beam is boxed to exactly the plot rectangle so its only hard edges land
  // on the frame's own top and baseline instead of floating in the panel.
  const sweep = rs.length
    ? `<g clip-path="url(#hero-plot)"><g class="sweep" opacity="0">
  <rect x="${PLOT_L - 110}" y="${PLOT_TOP}" width="110" height="${PLOT_H}" fill="url(#hero-beam)"/>
  <line x1="${PLOT_L}" y1="${PLOT_TOP}" x2="${PLOT_L}" y2="${PLOT_BOT + 13}" stroke="${C.mint}" stroke-width="1.25" stroke-opacity="0.65"/>
</g></g>`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${ariaTrace(rs)}. ${s.trials || 0} questions asked of this profile's grounded bot, ${s.held || 0} answered and ${s.breaks || 0} unanswered, ${ariaGrounding(s)}.">
<defs>
  <linearGradient id="hero-fill" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${C.mint}" stop-opacity="0.28"/>
    <stop offset="1" stop-color="${C.mint}" stop-opacity="0.02"/>
  </linearGradient>
  <linearGradient id="hero-beam" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="${C.mint}" stop-opacity="0"/>
    <stop offset="1" stop-color="${C.mint}" stop-opacity="0.13"/>
  </linearGradient>
  <clipPath id="hero-plot">
    <rect x="${PLOT_L}" y="${PLOT_TOP}" width="${PLOT_W}" height="${PLOT_H + 13}"/>
  </clipPath>
</defs>
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
  .grid { stroke: ${C.grid}; stroke-width: 1; }
  .ref { stroke: ${C.rule}; stroke-width: 1; stroke-dasharray: 3 5; }
  .axis-line { stroke: ${C.border}; stroke-width: 1; }
  .axis { fill: ${C.muted}; font-size: 10.5px; opacity: 0.8; }
  .tick-key { fill: ${C.amber}; font-weight: 700; }
  .empty { fill: ${C.muted}; font-size: 13px; }
  .area { fill: url(#hero-fill); }
  .line { fill: none; stroke: ${C.mint}; stroke-width: 2; stroke-linejoin: round; stroke-linecap: round; }
  .lone { stroke: ${C.mint}; stroke-width: 1.5; stroke-dasharray: 4 6; opacity: 0.55; }
  .dot { fill: ${C.mint}; opacity: 0.65; }
  .head { fill: ${C.mint}; }
  .head-halo { fill: ${C.mint}; opacity: 0.2; }
  .tick { stroke: ${C.amber}; stroke-width: 1.6; opacity: 0.9; }
  /* GitHub serves this file as image/svg+xml with the stylesheet intact, so CSS
     animation does play in a browser. It is still written so that every element's
     RESTING state is the finished state: no real content animates in from opacity
     0, and the one moving part is a decorative overlay that is invisible at frame
     0. A still frame of this panel is the complete chart, which keeps it correct
     anywhere the SVG gets rasterised (link previews, screenshots, crawlers). The
     sweep is a scope line travelling across the trace and nothing else moves. */
  .sweep { animation: sweep 7s linear infinite; }
  @keyframes sweep {
    0% { transform: translateX(0); opacity: 0; }
    6% { opacity: 0.85; }
    62% { opacity: 0.85; }
    70% { transform: translateX(${PLOT_W}px); opacity: 0; }
    100% { transform: translateX(${PLOT_W}px); opacity: 0; }
  }
  @media (prefers-reduced-motion: reduce) {
    .sweep { animation: none; }
  }
</style>
<rect class="panel" x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="14"/>
<text class="eyebrow" x="${PAD}" y="42">COVERAGE DRIFT</text>
<text class="stamp" x="${W - PAD}" y="42" text-anchor="end">${rs.length} reading${rs.length === 1 ? "" : "s"} · ${s.trials || 0} trial${s.trials === 1 ? "" : "s"} · updated ${esc(stats.verifiedAt)}</text>
<line class="rule" x1="${PAD}" y1="62" x2="${W - PAD}" y2="62"/>
<text x="${PAD}" y="92">${rate}</text>
${frame()}
${trace(rs)}
${trialTicks(ticks)}
${sweep}
${axisRow(rs, axisY, ticks.length)}
${suiteLine(rs, suiteY)}
${statLine(s, statY)}
${groundingLine(s, groundY)}
<line class="rule" x1="${PAD}" y1="${ruleY}" x2="${W - PAD}" y2="${ruleY}"/>
<text class="note" x="${PAD}" y="${footY}">${esc(last)}</text>
</svg>
`;
}
