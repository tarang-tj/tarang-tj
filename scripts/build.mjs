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
const HISTORY_PATH = "data/history.json";

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
    return "_nothing open right now. every question anyone has asked is covered by the facts file._";
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

// The daily self-test appends one record per run to data/history.json. That file
// can be missing, empty or half-written, and "the suite has not run" is a real
// state rather than an error, so a record only counts once its counts are usable.
// Everything downstream reads the newest usable record or nothing at all.
function latestRun(history) {
  if (!Array.isArray(history)) return null;
  const usable = history.filter((r) => {
    const { total, covered } = r?.suite ?? {};
    return Number.isFinite(total) && Number.isFinite(covered) && total > 0;
  });
  return usable.at(-1) ?? null;
}

// Same rule as proxyFigure: no measurement prints as words, never as a fake 0%.
// Coverage is recomputed from the counts instead of read off the record, so a run
// that stored 0.75 and one that stored 75 print identically.
function suiteFigure(run) {
  if (!run) return "not run yet";
  const { total, covered } = run.suite;
  return `${covered}/${total} covered, ${Math.floor((covered / total) * 100)}%`;
}

function uncoveredList(run, limit = 5) {
  if (!run) return "_no run recorded yet, so there is nothing to list here._";
  const questions = (Array.isArray(run.uncovered) ? run.uncovered : [])
    .filter((q) => typeof q === "string" && q.trim())
    .map((q) => q.replace(/\s+/g, " ").trim());
  if (!questions.length) return "_the last run retrieved something for every question in the suite._";
  return questions.slice(0, limit).map((q) => `- ${cell(q)}`).join("\n");
}

function scorersList(top) {
  if (!top.length) return "_no one has stumped it yet._";
  return top
    .map((s, i) => `${i + 1}. \`${cell(s.handle)}\` · ${s.count} break${s.count === 1 ? "" : "s"}`)
    .join("\n");
}

export async function renderReadme(stats) {
  const [template, entries, factsRaw, history] = await Promise.all([
    readFile("README.tmpl.md", "utf8"),
    readJson(EVAL_PATH, []),
    readFile(FACTS_PATH, "utf8"),
    readJson(HISTORY_PATH, []),
  ]);
  const sections = parseSections(factsRaw);
  const s = score(entries, sections);
  const run = latestRun(history);

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
    SUITE: suiteFigure(run),
    UNCOVERED: uncoveredList(run),
  };
  return template.replace(/\{\{(\w+)\}\}/g, (m, k) => (k in tokens ? tokens[k] : m));
}

export async function buildAll(stats) {
  // history feeds the coverage trace on the panel. readJson swallows a missing or
  // malformed file, and renderHero drops any record without usable counts, so the
  // worst case is the empty-state panel rather than a failed build.
  const [entries, factsRaw, history] = await Promise.all([
    readJson(EVAL_PATH, []),
    readFile(FACTS_PATH, "utf8"),
    readJson(HISTORY_PATH, []),
  ]);
  const s = score(entries, parseSections(factsRaw));
  await writeFile("assets/hero.svg", renderHero(stats, s, entries, Array.isArray(history) ? history : []));
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
