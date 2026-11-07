// Source check for the lane board. For every tile: fetch the cited file from the
// cited repo, require each quote to appear in it verbatim, require each token to
// appear in the quotes, and require the tile's link to answer 200. Any miss exits
// non-zero, so the refresh Action goes red instead of publishing a stale number.
// Run: node scripts/verify-board.mjs
import { readFile } from "node:fs/promises";

const board = JSON.parse(await readFile("data/board.json", "utf8"));
const cache = new Map();

async function fetchText(repo, file) {
  const url = `https://raw.githubusercontent.com/${repo}/HEAD/${file}`;
  if (!cache.has(url)) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${url} answered ${res.status}`);
    cache.set(url, await res.text());
  }
  return cache.get(url);
}

const failures = [];
for (const lane of board.lanes) {
  for (const t of lane.tiles) {
    const { repo, file, quotes, tokens } = t.source;
    try {
      const text = await fetchText(repo, file);
      for (const q of quotes) if (!text.includes(q)) failures.push(`${t.id}: quote not found in ${repo}/${file}: "${q}"`);
      const joined = quotes.join(" ").toLowerCase();
      for (const k of tokens) if (!joined.includes(k.toLowerCase())) failures.push(`${t.id}: token "${k}" is not in its own quotes`);
      const res = await fetch(t.link, { method: "GET", redirect: "follow" });
      if (res.status !== 200) failures.push(`${t.id}: link ${t.link} answered ${res.status}`);
    } catch (err) {
      failures.push(`${t.id}: ${err.message}`);
    }
  }
}

const n = board.lanes.reduce((a, l) => a + l.tiles.length, 0);
if (failures.length) {
  console.error(`BOARD SOURCE CHECK FAILED (${failures.length}):\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log(`board source check: ${n} tiles, every quote found, every link 200`);
