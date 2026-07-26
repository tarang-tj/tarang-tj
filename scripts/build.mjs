// Rebuilds README.md and assets/hero.svg from README.tmpl.md + live GitHub data.
// Run: node scripts/build.mjs   (add --no-fetch to rebuild from cached stats)
import { readFile, writeFile } from "node:fs/promises";
import { collectStats } from "./collect-stats.mjs";
import { renderHero } from "./render-hero.mjs";

const STATS_PATH = "data/stats.json";
const AMA_PATH = "data/ama.json";

async function readJson(path, fallback) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return fallback;
  }
}

function amaTable(entries) {
  const recent = entries.slice(-3).reverse();
  if (!recent.length) {
    return "_No questions yet. Be the first: the bot answers within about a minute._";
  }
  const rows = recent
    .map(
      (e) =>
        `| [#${e.issue}](${e.url}) | ${e.question.replace(/\|/g, "\\|")} | ${e.answeredBy} |`,
    )
    .join("\n");
  return `| issue | question | answered by |\n| --- | --- | --- |\n${rows}`;
}

export async function renderReadme(stats) {
  const [template, ama] = await Promise.all([
    readFile("README.tmpl.md", "utf8"),
    readJson(AMA_PATH, []),
  ]);
  const tokens = {
    VERIFIED: stats.verifiedAt,
    REPOS: String(stats.publicRepos),
    STARS: String(stats.stars),
    LANGS: stats.languages.map((l) => l.name).join(" · "),
    AMA_TABLE: amaTable(ama),
  };
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) =>
    key in tokens ? tokens[key] : match,
  );
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
      // Fail loud, then fall back. A stale panel is better than a broken one,
      // but the log must say the numbers did not refresh.
      console.error(`STATS REFRESH FAILED: ${err.message}`);
      if (!cached) throw err;
      stats = cached;
      console.error(`Falling back to cached stats verified ${cached.verifiedAt}.`);
    }
  }

  await writeFile(STATS_PATH, `${JSON.stringify(stats, null, 2)}\n`);
  await writeFile("assets/hero.svg", renderHero(stats));
  await writeFile("README.md", await renderReadme(stats));
  console.log(
    `Built: ${stats.publicRepos} repos, ${stats.stars} stars, verified ${stats.verifiedAt}.`,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
