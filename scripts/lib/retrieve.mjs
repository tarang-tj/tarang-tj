// Splits data/facts.md into sections and ranks them against a question.
// Used twice: to build grounding context for the model, and as the answer path
// when no API key is configured (so the bot degrades to retrieval, not to silence).
const STOP = new Set([
  "the", "a", "an", "is", "are", "was", "were", "do", "does", "did", "what",
  "who", "how", "why", "when", "where", "which", "your", "you", "yours", "of",
  "in", "on", "for", "to", "and", "or", "it", "this", "that", "with", "about",
  "tj", "tarang", "he", "they", "them", "his", "their",
]);

// Hyphenated and dotted compounds are indexed whole *and* in parts, so a question
// about a "kill switch" still reaches a section that says "kill-switch".
const tokenize = (s) => {
  const raw = s.toLowerCase().match(/[a-z0-9+#.-]{2,}/g) ?? [];
  const out = [];
  for (const term of raw) {
    out.push(term);
    if (/[.-]/.test(term)) out.push(...term.split(/[.-]+/).filter((p) => p.length > 1));
  }
  return out.filter((t) => !STOP.has(t));
};

export function parseSections(markdown) {
  const sections = [];
  let current = null;
  for (const line of markdown.split("\n")) {
    const heading = line.match(/^##\s+(.+)$/);
    if (heading) {
      if (current) sections.push(current);
      current = { title: heading[1].trim(), body: [] };
    } else if (current) {
      current.body.push(line);
    }
  }
  if (current) sections.push(current);
  return sections
    .map((s) => ({ title: s.title, body: s.body.join("\n").trim() }))
    .filter((s) => s.body);
}

export function rank(sections, question, k = 6) {
  const q = tokenize(question);
  if (!q.length) return sections.slice(0, k);
  const scored = sections.map((s) => {
    const hay = tokenize(`${s.title} ${s.body}`);
    const bag = new Set(hay);
    // Title matches count double: headings name the topic.
    const titleBag = new Set(tokenize(s.title));
    let score = 0;
    for (const term of new Set(q)) {
      if (bag.has(term)) score += 1;
      if (titleBag.has(term)) score += 1;
    }
    return { ...s, score };
  });
  return scored.sort((a, b) => b.score - a.score).slice(0, k);
}

export function retrievalAnswer(sections, question) {
  const top = rank(sections, question, 2).filter((s) => s.score > 0);
  if (!top.length) return null;
  return top.map((s) => `**${s.title}**: ${s.body.replace(/\n+/g, " ")}`).join("\n\n");
}
