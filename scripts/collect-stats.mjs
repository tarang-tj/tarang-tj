// Pulls the numbers the profile asserts, straight from the GitHub API.
// Every value rendered on the hero panel comes from here, never typed by hand.
import { gh, ghPaged } from "./lib/gh.mjs";

const USER = "tarang-tj";

export async function collectStats() {
  const [user, repos] = await Promise.all([
    gh(`/users/${USER}`),
    ghPaged(`/users/${USER}/repos?type=owner&sort=pushed`),
  ]);

  const owned = repos.filter((r) => !r.fork && !r.private);
  const stars = owned.reduce((sum, r) => sum + r.stargazers_count, 0);

  // Language mix by repo count, not bytes: repo count is what a reader can verify.
  // Markup labels are dropped: linguist tags a single-file Three.js scene as HTML,
  // which says nothing about what the repo is written in.
  const MARKUP = new Set(["HTML", "CSS", "SCSS"]);
  const langCounts = new Map();
  for (const r of owned) {
    if (!r.language || MARKUP.has(r.language)) continue;
    langCounts.set(r.language, (langCounts.get(r.language) ?? 0) + 1);
  }
  const languages = [...langCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([name, count]) => ({ name, count }));

  const lastPush = owned
    .map((r) => r.pushed_at)
    .filter(Boolean)
    .sort()
    .at(-1);

  return {
    login: user.login,
    publicRepos: owned.length,
    stars,
    followers: user.followers,
    languages,
    lastPush,
    // Set by build.mjs so a failed refresh is visible rather than silently stale.
    verifiedAt: new Date().toISOString().slice(0, 10),
  };
}
