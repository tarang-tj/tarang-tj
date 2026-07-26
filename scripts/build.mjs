// Rebuilds README.md and assets/hero.svg from README.tmpl.md, live GitHub data,
// and the eval log. Run: node scripts/build.mjs   (--no-fetch uses cached stats)
import { readFile, writeFile } from "node:fs/promises";
import { collectStats } from "./collect-stats.mjs";
import { renderHero } from "./render-hero.mjs";
import { parseSections } from "./lib/retrieve.mjs";
import { score, openBreaks, scorers } from "./lib/eval-log.mjs";

const STATS_PATH = "data/stats.json";
const EVAL_PATH = "data/eval.json";
const FACTS_PATH = "data/facts.md";

async function readJson(path, fallback) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return fallback;
  }
}

const cell = (s) => String(s).replace(/\|/g, "\\|");

function openBreaksTable(breaks) {
  if (!breaks.length) {
    return "_Nothing open right now. Every question anyone has asked is covered by the facts file._";
  }
  const rows = breaks
    .map((b) => `| ${cell(b.question)} | ${b.handle ? `\`${cell(b.handle)}\`` : "anon"} | [#${b.issue}](${b.url}) |`)
    .join("\n");
  return `| the question it could not answer | found by | trial |\n| --- | --- | --- |\n${rows}`;
}

// "no measurement" prints as n/a, never as 0: an unscored metric is not a zero.
// Two decimals at most, because the underlying figure is a mean of values that
// can only be 0, 0.33, 0.67 or 1.
function proxyFigure(v) {
  if (typeof v !== "number" || !Number.isFinite(v)) return "n/a";
  return String(Number(v.toFixed(2)));
}

function scorersList(top) {
  if (!top.length) return "_No one has stumped it yet._";
  return top
    .map((s, i) => `${i + 1}. \`${cell(s.handle)}\` · ${s.count} break${s.count === 1 ? "" : "s"}`)
    .join("\n");
}

export async function renderReadme(stats) {
  const [template, entries, factsRaw] = await Promise.all([
    readFile("README.tmpl.md", "utf8"),
    readJson(EVAL_PATH, []),
    readFile(FACTS_PATH, "utf8"),
  ]);
  const sections = parseSections(factsRaw);
  const s = score(entries, sections);

  const tokens = {
    VERIFIED: stats.verifiedAt,
    REPOS: String(stats.publicRepos),
    STARS: String(stats.stars),
    LANGS: stats.languages.map((l) => l.name).join(" · "),
    TRIALS: String(s.trials),
    HELD: String(s.held),
    BREAKS: String(s.breaks),
    OPEN: String(s.open),
    CLOSED: String(s.closed),
    RATE: s.answerRate === null ? "n/a" : `${s.answerRate}%`,
    GENERATED: String(s.generated ?? 0),
    FAITHFULNESS: proxyFigure(s.meanFaithfulness),
    OPEN_BREAKS: openBreaksTable(openBreaks(entries, sections)),
    SCORERS: scorersList(scorers(entries)),
  };
  return template.replace(/\{\{(\w+)\}\}/g, (m, k) => (k in tokens ? tokens[k] : m));
}

export async function buildAll(stats) {
  const [entries, factsRaw] = await Promise.all([
    readJson(EVAL_PATH, []),
    readFile(FACTS_PATH, "utf8"),
  ]);
  const s = score(entries, parseSections(factsRaw));
  await writeFile("assets/hero.svg", renderHero(stats, s, entries));
  await writeFile("README.md", await renderReadme(stats));
  return s;
}

async function main() {
  const cached = await readJson(STATS_PATH, null);
  let stats;

  if (process.argv.includes("--no-fetch") && cached) {
    stats = cached;
  } else {
    try {
      stats = await collectStats();
    } catch (err) {
      // Fail loud, then fall back. A stale panel beats a broken one, but the log
      // must say the numbers did not refresh.
      console.error(`STATS REFRESH FAILED: ${err.message}`);
      if (!cached) throw err;
      stats = cached;
      console.error(`Falling back to cached stats verified ${cached.verifiedAt}.`);
    }
  }

  await writeFile(STATS_PATH, `${JSON.stringify(stats, null, 2)}\n`);
  const s = await buildAll(stats);
  console.log(
    `Built: ${stats.publicRepos} repos, ${stats.stars} stars | ` +
      `${s.trials} trials, ${s.held} held, ${s.breaks} stumped, ${s.open} open.`,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
