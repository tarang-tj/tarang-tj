// Draws assets/hero-{dark,light}.svg: the profile as a terminal running ./verify.
//
// WHY THIS IS STATIC, AND WHY THAT IS NOT A COMPROMISE
// Neither CSS @keyframes nor SMIL animates inside an SVG that GitHub embeds with
// an image tag. Verified directly rather than assumed: a plain HTML div running
// the same keyframes moved between two screenshots while the identical animation
// inside an image stayed on frame one, and SMIL did too. Bytes reaching the
// browser unmodified is not the same as the browser agreeing to run them, and
// only the second one matters. So every drop of craft here has to come from
// rendering, not motion.
//
// What DOES survive the image boundary, all confirmed the same way: gradients,
// feGaussianBlur for phosphor glow, feTurbulence for grain, pattern fills for
// scanlines, and radial gradients for vignette. That is the whole toolkit, and
// it is enough to build a CRT.
//
// Two themes for one idea. Dark is a green-phosphor terminal. Light is the same
// readout as a printout: ink on warm paper, texture dialled down, no glow. A
// terminal that turned into a dark slab on a white page would be worse than
// having no theme at all.

const W = 880;
const PAD = 36;
const ROW_H = 28;
const COL_NAME = PAD + 58;
const COL_EV = PAD + 268;

const PASS = "pass";
const WIP = "wip";

// Published, checkable claims from each repo. Test counts feed the summary line,
// so a row and the total can never disagree.
const SYSTEMS = [
  { name: "ragproof", evidence: "NDCG@10 0.72 vs 0.56 BM25 on BEIR/scifact", tests: 54, status: PASS },
  { name: "claude-skill-audit", evidence: "37 checks, 6 rule modules, 0 dependencies", tests: 6, status: PASS },
  // 20, not 37. The 37 belongs to a WebGL "wave 2" that was verified locally and
  // never pushed, so it is not in the public repo and cannot be claimed here.
  // Counted from a fresh clone of the public remote: 14 node test() calls plus
  // 6 fault-oriented python tests.
  { name: "starship-flow-control", evidence: "multi-level BOM constraint model, live demo", tests: 20, status: PASS },
  { name: "the-breaker", evidence: "design done, hardware not built yet", tests: 0, status: WIP },
];

const THEMES = {
  dark: {
    bg: "#050A07",
    dim: "#2E6E4E",
    mid: "#5E8C74",
    ink: "#D6F5E4",
    accent: "#3FE08A",
    amber: "#E0A63F",
    glow: true,
    scanOpacity: 0.34,
    grainOpacity: 0.5,
    vignette: 0.75,
  },
  light: {
    bg: "#FAF8F1",
    dim: "#8A9184",
    mid: "#5C6459",
    ink: "#161A17",
    accent: "#14764A",
    amber: "#8A5A00",
    glow: false,
    scanOpacity: 0.05,
    grainOpacity: 0.16,
    vignette: 0.1,
  },
};

const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const num = (v) => typeof v === "number" && Number.isFinite(v);

// Coverage is floored, never rounded, and matches how the README prints it. A
// suite 82.9% covered has not covered 83% of anything.
function coverage(history) {
  if (!Array.isArray(history)) return null;
  const usable = history.filter((r) => {
    const s = r?.suite;
    return s && num(s.total) && num(s.covered) && s.total > 0;
  });
  const run = usable.at(-1);
  if (!run) return null;
  const { total, covered } = run.suite;
  return { pct: Math.floor((covered / total) * 100), covered, total };
}

export function renderHero(stats, s, entries, history, theme = "dark") {
  const C = THEMES[theme] ?? THEMES.dark;
  const cov = coverage(history);

  // The harness is a row, not the headline. Leading with a trial counter meant
  // leading with a zero, which reads as "nobody came" rather than "open to all".
  const rows = [
    ...SYSTEMS,
    {
      name: "this profile",
      evidence: cov
        ? `${cov.pct}% self-test coverage (${cov.covered}/${cov.total})`
        : "self-test has not run yet",
      tests: 0,
      status: WIP,
    },
  ];

  const totalTests = rows.reduce((n, r) => n + r.tests, 0);
  const shipped = rows.filter((r) => r.status === PASS).length;

  const trials = s?.trials ?? 0;
  const trialLine = trials
    ? `${trials} public trial${trials === 1 ? "" : "s"} run, ${s.open ?? 0} gap${(s.open ?? 0) === 1 ? "" : "s"} still open`
    : "no stranger has tried to break it yet. the invitation is open.";

  const y0 = PAD + 26;
  const cmdY = y0;
  const noteY = y0 + 30;
  const listTop = noteY + 34;
  const ruleY = listTop + rows.length * ROW_H + 6;
  const sumY = ruleY + 30;
  const subY = sumY + 24;
  // The machine line gets its own baseline. Sharing one with the trial line put
  // two left-and-right-anchored strings on a collision course the moment either
  // grew, and the trial line changes length as soon as someone runs a trial.
  const machineY = subY + 20;
  const promptY = machineY + 38;
  const H = promptY + 30;

  // Glow is expensive per element, so it is spent only where it reads: the
  // prompt, the status marks and the summary. Body text stays crisp.
  const g = C.glow ? ' filter="url(#ph)"' : "";
  const gs = C.glow ? ' filter="url(#soft)"' : "";

  const rowSvg = rows
    .map((r, i) => {
      const y = listTop + i * ROW_H;
      const col = r.status === PASS ? C.accent : C.amber;
      const mark = r.status === PASS ? " ok " : "wip ";
      const right = r.tests ? String(r.tests) : "";
      return `
  <text x="${PAD}" y="${y}" fill="${col}"${g}>${mark}</text>
  <text x="${COL_NAME}" y="${y}" fill="${C.ink}">${esc(r.name)}</text>
  <text x="${COL_EV}" y="${y}" fill="${C.mid}">${esc(r.evidence)}</text>
  <text x="${W - PAD}" y="${y}" fill="${C.dim}" text-anchor="end">${esc(right)}</text>`;
    })
    .join("");

  const aria = `${shipped} systems shipped and tested, ${totalTests} tests passing. ${rows
    .map((r) => `${r.name}, ${r.status === PASS ? "ok" : "in progress"}, ${r.evidence}`)
    .join(". ")}. ${trialLine}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="A terminal running a verification of Tarang Jammalamadaka's projects, ${esc(
    stats.verifiedAt,
  )}. ${esc(aria)}">
<defs>
  <radialGradient id="vig" cx="0.5" cy="0.42" r="0.78">
    <stop offset="0.5" stop-color="#000" stop-opacity="0"/>
    <stop offset="1" stop-color="#000" stop-opacity="${C.vignette}"/>
  </radialGradient>
  <filter id="ph" x="-40%" y="-40%" width="180%" height="180%">
    <feGaussianBlur stdDeviation="2.1" result="b"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <filter id="soft" x="-40%" y="-40%" width="180%" height="180%">
    <feGaussianBlur stdDeviation="0.85" result="b"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <filter id="grain">
    <feTurbulence type="fractalNoise" baseFrequency="0.82" numOctaves="4"/>
    <feColorMatrix type="saturate" values="0"/>
    <feComponentTransfer><feFuncA type="linear" slope="0.14"/></feComponentTransfer>
  </filter>
  <pattern id="scan" width="3" height="3" patternUnits="userSpaceOnUse">
    <rect width="3" height="1.2" fill="#000" opacity="${C.scanOpacity}"/>
  </pattern>
</defs>
  <rect width="${W}" height="${H}" rx="12" fill="${C.bg}"/>

  <g font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13.5">
    <text x="${PAD}" y="${cmdY}" fill="${C.accent}"${g}>tj@bothell</text><text x="${PAD + 92}" y="${cmdY}" fill="${C.dim}">:~$</text><text x="${PAD + 128}" y="${cmdY}" fill="${C.ink}"${gs}>./verify --all</text>
    <text x="${PAD}" y="${noteY}" fill="${C.dim}">running ${rows.length} systems, ${totalTests} assertions, every figure checked into something you can run</text>
${rowSvg}
    <line x1="${PAD}" y1="${ruleY}" x2="${W - PAD}" y2="${ruleY}" stroke="${C.dim}" stroke-opacity="0.45"/>
    <text x="${PAD}" y="${sumY}" fill="${C.ink}" font-size="17"${gs}>${shipped} shipped · ${totalTests} passing · 0 claims without evidence</text>
    <text x="${PAD}" y="${subY}" fill="${C.mid}">${esc(trialLine)}</text>
    <text x="${PAD}" y="${machineY}" fill="${C.dim}">${esc(stats.publicRepos)} public repos · ${esc(
      (stats.languages ?? []).map((l) => l.name.toLowerCase()).join(" · "),
    )}</text>
    <text x="${PAD}" y="${promptY}" fill="${C.accent}"${g}>tj@bothell</text><text x="${PAD + 92}" y="${promptY}" fill="${C.dim}">:~$</text>
    <rect x="${PAD + 130}" y="${promptY - 12}" width="9" height="16" fill="${C.accent}"${g}/>
  </g>

  <rect width="${W}" height="${H}" fill="url(#scan)"/>
  <rect width="${W}" height="${H}" filter="url(#grain)" opacity="${C.grainOpacity}"/>
  <rect width="${W}" height="${H}" rx="12" fill="url(#vig)"/>
</svg>
`;
}
