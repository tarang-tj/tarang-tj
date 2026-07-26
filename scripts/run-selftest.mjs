// The regression suite behind the scoreboard. Public trials are rare, so the
// panel would sit at zero for weeks and look dead. This runs data/selftest.md
// against data/facts.md every day and records what the corpus could answer.
//
// It uses the SAME predicate a public trial uses to decide held vs break
// (rank(...,1)[0].score > 0), so the self-test number and the trial number
// cannot drift apart or mean two different things.
//
// No model, no network. It is pure retrieval over local files, which is why it
// is safe to run unattended on a schedule.
// Run: node scripts/run-selftest.mjs
import { readFile, writeFile } from "node:fs/promises";
import { parseSections, rank } from "./lib/retrieve.mjs";
import { HELD, BREAK } from "./lib/eval-log.mjs";

const SUITE_PATH = "data/selftest.md";
const FACTS_PATH = "data/facts.md";
const EVAL_PATH = "data/eval.json";
const HISTORY_PATH = "data/history.json";

// Roughly six months of daily points: enough to draw a trend, small enough that
// the file stays reviewable in a diff.
const MAX_RECORDS = 180;
// The uncovered list is a to-do list, not an archive. Six lines is what fits in
// a console summary and in any panel that later reads this file.
const MAX_UNCOVERED = 6;
const UNCOVERED_CHARS = 80;

export function parseSuite(text) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
}

// The one place coverage is decided. Same shape as eval-log.mjs score(): counts
// first, then the derived figures, so a caller never has to recompute anything.
export function scoreSuite(questions, sections) {
  const results = questions.map((question) => {
    const top = rank(sections, question, 1)[0];
    const score = top?.score ?? 0;
    return { question, score, title: top?.title ?? null, verdict: score > 0 ? HELD : BREAK };
  });
  const covered = results.filter((r) => r.verdict === HELD).length;
  const total = results.length;
  return {
    total,
    covered,
    // Rounded to 2 decimals, never rounded up to a full point: 0 of 0 is 0,
    // because an empty suite has proved nothing.
    coverage: total ? Number((covered / total).toFixed(2)) : 0,
    results,
  };
}

// Trial counts come from the public eval log so one history record holds both
// halves of the picture: what the suite proved and what the public tried.
export function summariseTrials(entries) {
  const breaks = entries.filter((e) => e.verdict === BREAK).length;
  return { total: entries.length, held: entries.length - breaks, breaks };
}

export function uncoveredList(results) {
  return results
    .filter((r) => r.verdict === BREAK)
    .slice(0, MAX_UNCOVERED)
    .map((r) => r.question.slice(0, UNCOVERED_CHARS));
}

// One record per day. A rerun on the same date replaces that day's record
// instead of appending, so a workflow retry or a manual run cannot inflate the
// history into a fake trend.
export function upsertRecord(history, record) {
  const kept = history.filter((h) => h?.date !== record.date);
  return [...kept, record].slice(-MAX_RECORDS);
}

async function readJson(path, fallback) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return fallback;
  }
}

async function main() {
  const [suiteRaw, factsRaw] = await Promise.all([
    readFile(SUITE_PATH, "utf8"),
    readFile(FACTS_PATH, "utf8"),
  ]);
  const entries = await readJson(EVAL_PATH, []);
  const history = await readJson(HISTORY_PATH, []);

  const questions = parseSuite(suiteRaw);
  const sections = parseSections(factsRaw);
  const suite = scoreSuite(questions, sections);

  const record = {
    date: new Date().toISOString().slice(0, 10),
    suite: { total: suite.total, covered: suite.covered, coverage: suite.coverage },
    trials: summariseTrials(Array.isArray(entries) ? entries : []),
    uncovered: uncoveredList(suite.results),
  };

  const next = upsertRecord(Array.isArray(history) ? history : [], record);
  await writeFile(HISTORY_PATH, `${JSON.stringify(next, null, 2)}\n`);

  const pct = Math.round(suite.coverage * 100);
  console.log(
    `selftest ${record.date}: ${suite.covered}/${suite.total} covered (${pct}%), ` +
      `${record.trials.total} public trials, ${record.trials.breaks} breaks.`,
  );
  for (const r of suite.results) {
    const mark = r.verdict === HELD ? "hit " : "MISS";
    console.log(`  ${mark} ${String(r.score).padStart(2)}  ${r.question}`);
  }
  if (record.uncovered.length) {
    console.log(`\nGaps the corpus does not cover (${suite.total - suite.covered} total):`);
    for (const q of record.uncovered) console.log(`  - ${q}`);
  }
  console.log(`\nWrote ${HISTORY_PATH} (${next.length} record${next.length === 1 ? "" : "s"}).`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
