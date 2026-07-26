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

export function score(entries, sections) {
  const trials = entries.length;
  const breaks = entries.filter((e) => e.verdict === BREAK);

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
