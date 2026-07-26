// The scoreboard behind the profile.
//
// Every question asked of the bot is one trial. If the bot answered from the
// grounding corpus the trial is `held`; if it could not, the asker scored a
// `break`. A break is a real gap in data/facts.md, so each one is also a task.
// A break counts as `closed` once the corpus has grown enough that the same
// question would now be answerable, which is recomputed here on every build.
import { rank } from "./retrieve.mjs";

export const HELD = "held";
export const BREAK = "break";
export const GENERATED = "generated";

// Mean of the numeric values only. Returns null for an empty set rather than 0,
// because "no measurement" and "measured zero" are different claims.
const mean = (values) => {
  const nums = values.filter((v) => typeof v === "number" && Number.isFinite(v));
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
};

export function score(entries, sections) {
  const trials = entries.length;
  const breaks = entries.filter((e) => e.verdict === BREAK);
  // Only generated answers can be scored for quality. An extractive answer is
  // copied out of the corpus, so its faithfulness is 1.0 by construction and
  // averaging it in would inflate the figure with a tautology.
  const generated = entries.filter((e) => e.answerMode === GENERATED);

  // Replay each break against the corpus as it stands now.
  const closed = breaks.filter((e) => {
    const top = rank(sections, e.question, 1)[0];
    return top && top.score > 0;
  });

  const held = trials - breaks.length;
  return {
    trials,
    held,
    breaks: breaks.length,
    open: breaks.length - closed.length,
    closed: closed.length,
    // Share of trials the corpus could answer. Deliberately not rounded up.
    answerRate: trials ? Math.floor((held / trials) * 100) : null,
    generated: generated.length,
    meanFaithfulness: mean(generated.map((e) => e.faithfulness)),
    meanRelevance: mean(generated.map((e) => e.answerRelevance)),
    lastBreak: breaks.at(-1) ?? null,
  };
}

// Breaks that are still unanswerable, newest first: the actual to-do list.
export function openBreaks(entries, sections, limit = 5) {
  return entries
    .filter((e) => e.verdict === BREAK)
    .filter((e) => {
      const top = rank(sections, e.question, 1)[0];
      return !top || top.score === 0;
    })
    .slice(-limit)
    .reverse();
}

export function scorers(entries, limit = 5) {
  const tally = new Map();
  for (const e of entries) {
    if (e.verdict !== BREAK || !e.handle) continue;
    tally.set(e.handle, (tally.get(e.handle) ?? 0) + 1);
  }
  return [...tally.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([handle, count]) => ({ handle, count }));
}
