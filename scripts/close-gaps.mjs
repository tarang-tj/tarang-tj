// Closes the loop on a break. A gap stops being listed the moment the fact lands
// in data/facts.md, but the person who found it never hears about it. This walks
// the eval log, finds breaks the corpus can now answer, tells the finder on their
// own issue, and closes it.
//
// The predicate for "closed" is the same one eval-log.mjs scores with: the
// question retrieves a section with a non-zero score. One source of truth, so the
// comment can never disagree with the number on the panel.
//
// Dry run by default. It only touches GitHub when APPLY=1.
// Run: node scripts/close-gaps.mjs            (prints what it would do)
//      APPLY=1 REPO=owner/name node scripts/close-gaps.mjs
import { readFile, writeFile } from "node:fs/promises";
import { parseSections, rank } from "./lib/retrieve.mjs";
import { BREAK } from "./lib/eval-log.mjs";

const EVAL_PATH = "data/eval.json";
const FACTS_PATH = "data/facts.md";
const API = "https://api.github.com";

const env = (name) => process.env[name] ?? "";
const apply = () => env("APPLY") === "1";

// Seeded and test rows carry issue 0 and no url. There is no thread to comment
// on, so they are never candidates however well they retrieve.
const addressable = (e) =>
  Number.isInteger(e.issue) && e.issue > 0 && typeof e.url === "string" && e.url.length > 0;

function closeComment(handle, title) {
  const credit = handle ? `\`${handle}\` found this gap and it is now closed` : "this gap is now closed";
  return (
    `**gap closed.** ${credit}: the **${title}** section of \`data/facts.md\` covers the question now, ` +
    `so the bot can answer it from the corpus.\n\n` +
    `it drops off the open list on the profile at the next build.`
  );
}

async function ghWrite(method, path, payload) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Bearer ${env("GITHUB_TOKEN")}`,
      "content-type": "application/json",
      "user-agent": "tarang-tj-profile-close-gaps",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`${method} ${path} failed ${res.status}: ${await res.text()}`);
  }
  return res;
}

// Splits the log into the entries to act on and the reasons everything else was
// left alone, so a dry run explains itself instead of just printing a number.
export function selectClosable(entries, sections) {
  const closable = [];
  const skipped = [];
  for (const e of entries) {
    if (e.verdict !== BREAK) continue;
    if (e.closedAt) {
      skipped.push(`#${e.issue} already announced ${e.closedAt}`);
      continue;
    }
    // announcedAt without closedAt means the comment landed but the close did
    // not. Still a candidate, but for the close only: it must never be commented
    // on twice.
    const top = rank(sections, e.question, 1)[0];
    if (!top || top.score === 0) {
      skipped.push(`#${e.issue} still open, nothing in the corpus matches`);
      continue;
    }
    if (!addressable(e)) {
      skipped.push(`#${e.issue} covered now but has no issue to comment on`);
      continue;
    }
    closable.push({ entry: e, title: top.title });
  }
  return { closable, skipped };
}

async function main() {
  const [raw, factsRaw] = await Promise.all([
    readFile(EVAL_PATH, "utf8").catch(() => "[]"),
    readFile(FACTS_PATH, "utf8"),
  ]);
  const entries = JSON.parse(raw);
  const sections = parseSections(factsRaw);
  const { closable, skipped } = selectClosable(entries, sections);

  console.log(`close-gaps: ${entries.length} trials logged, ${closable.length} newly closed gap(s) to announce.`);
  for (const line of skipped) console.log(`  skipped: ${line}`);

  if (!closable.length) return;

  if (!apply()) {
    console.log("\nDRY RUN. Nothing posted, nothing written. Set APPLY=1 to act.");
    for (const { entry, title } of closable) {
      if (entry.announcedAt) {
        console.log(`\n  would close #${entry.issue} (${entry.url}); already commented on ${entry.announcedAt}`);
        console.log(`    question:     ${entry.question}`);
        console.log(`    now covered by: ${title}`);
        continue;
      }
      console.log(`\n  would comment on #${entry.issue} (${entry.url}) and close it`);
      console.log(`    question:     ${entry.question}`);
      console.log(`    now covered by: ${title}`);
      console.log(`    comment:\n${closeComment(entry.handle, title).split("\n").map((l) => `      | ${l}`).join("\n")}`);
    }
    return;
  }

  const repo = env("REPO");
  if (!repo || !env("GITHUB_TOKEN")) {
    // Not fatal on purpose: this step runs ahead of the README rebuild in CI and
    // must never be the reason the profile goes stale.
    console.error("APPLY=1 but REPO or GITHUB_TOKEN is missing. Nothing done.");
    return;
  }

  const today = new Date().toISOString().slice(0, 10);
  let announced = 0;
  for (const { entry, title } of closable) {
    try {
      if (!entry.announcedAt) {
        await ghWrite("POST", `/repos/${repo}/issues/${entry.issue}/comments`, {
          body: closeComment(entry.handle, title),
        });
        // A comment cannot be unsent, so it is stamped and persisted on its own
        // the moment it lands. If the close below fails, the next run sees
        // announcedAt and attempts the close only: no second comment.
        entry.announcedAt = today;
        await writeFile(EVAL_PATH, `${JSON.stringify(entries, null, 2)}\n`);
      }
      await ghWrite("PATCH", `/repos/${repo}/issues/${entry.issue}`, {
        state: "closed",
        state_reason: "completed",
      });
    } catch (err) {
      // One bad issue (deleted, locked, transferred) must not strand the rest.
      // Whichever step failed is left unmarked, so the next run retries that
      // step and only that step.
      console.error(`  #${entry.issue} failed, left open: ${err.message}`);
      continue;
    }
    // Written only after the close lands.
    entry.closedAt = today;
    announced += 1;
    await writeFile(EVAL_PATH, `${JSON.stringify(entries, null, 2)}\n`);
    console.log(`  #${entry.issue} closed, covered by "${title}".`);
  }

  console.log(`Announced ${announced} of ${closable.length} closed gap(s).`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
