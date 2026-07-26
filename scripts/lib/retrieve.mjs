// Splits data/facts.md into sections and ranks them against a question.
// Used twice: to build grounding context for the model, and as the answer path
// when no API key is configured (so the bot degrades to retrieval, not to silence).
// Function words only. Anything left in the index has to be a content word,
// because a single match is enough to call a question covered: if a preposition
// could score, a gap would be declared closed on the word "from".
const STOP = new Set([
  // articles, conjunctions, prepositions
  "the", "a", "an", "and", "or", "but", "if", "so", "as", "at", "by", "for",
  "from", "in", "into", "of", "on", "onto", "to", "with", "without", "about",
  "over", "under", "than", "then", "there", "here", "out", "up", "down", "off",
  "per", "via", "vs", "between", "during", "after", "before", "while",
  // pronouns and determiners
  "i", "me", "my", "mine", "we", "us", "our", "ours", "you", "your", "yours",
  "he", "him", "his", "she", "her", "hers", "they", "them", "their", "theirs",
  "it", "its", "this", "that", "these", "those", "who", "whom", "whose",
  "what", "which", "any", "all", "some", "each", "every", "both", "no", "not",
  // verbs with no topical content
  "is", "are", "was", "were", "be", "been", "being", "am", "do", "does", "did",
  "done", "have", "has", "had", "can", "could", "will", "would", "shall",
  "should", "may", "might", "must", "get", "got", "let", "make", "makes",
  // question and filler words
  "how", "why", "when", "where", "ever", "never", "just", "only", "also",
  "very", "much", "many", "more", "most", "one", "two", "thing", "things",
  "stuff", "way", "ways", "like", "tell", "say", "says", "know",
  // the subject himself: matching his own name says nothing
  "tj", "tarang", "jammalamadaka",
  // url and domain debris. without these, a link pasted into a question matches
  // "com" inside "github.com" and scores a hit on content it has nothing to do with.
  "http", "https", "www", "com", "net", "org", "io", "dev", "app", "co", "html",
]);

// Questions arrive from the public and may contain links or markup. Retrieval runs
// on the prose only, so pasted urls cannot manufacture a match.
export const normalise = (s) =>
  s.replace(/https?:\/\/\S+/gi, " ").replace(/[<>[\]()|*_`#~\\]/g, " ");

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

// The section that answers "who is this". Named by title so the corpus can be
// reordered without breaking the fallback; first section if no title matches.
const identityIndex = (sections) => {
  const i = sections.findIndex((s) => /who .* is/i.test(s.title));
  return i === -1 ? 0 : i;
};

// A question with no content tokens left is asking the broadest thing there is:
// every word in it was a pronoun, an auxiliary verb or his own name ("who is tj
// and what does he do"). That is the one question the corpus definitely answers,
// so it routes to the identity section rather than being logged as a gap. Note
// this only fires when NOTHING survives: "what is tj's shoe size" keeps "shoe"
// and "size", scores 0 against every section, and stays a genuine break.
function overview(sections, k) {
  if (!sections.length) return [];
  const i = identityIndex(sections);
  const rest = sections.filter((_, j) => j !== i).map((s) => ({ ...s, score: 0 }));
  return [{ ...sections[i], score: 1 }, ...rest].slice(0, k);
}

export function rank(sections, question, k = 6) {
  const q = tokenize(normalise(question));
  if (!q.length) return overview(sections, k);
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
  const top = rank(sections, normalise(question), 2).filter((s) => s.score > 0);
  if (!top.length) return null;
  return top.map((s) => `**${s.title}**: ${s.body.replace(/\n+/g, " ")}`).join("\n\n");
}
