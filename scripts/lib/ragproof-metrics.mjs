// Answer-quality metrics, ported from TJ's own harness (tarang-tj/ragproof,
// ragproof/generation.py) so the profile scores itself with the same code it
// ships elsewhere rather than a metric invented for the demo.
//
// Retrieval metrics only say whether the right context was fetched. These two
// score the answer that came back:
// - faithfulness: fraction of answer sentences supported by some context chunk.
//   Low faithfulness means the model made something up.
// - answer relevance: how on-topic the answer is to the question asked.
//
// The embedder is the deterministic bag-of-words one from ragproof's own tests
// (tests/test_generation.py::toy_embed). It needs no model download, no API key
// and no dependency, which is the whole constraint here: the repo stays on the
// node standard library.
import { createHash } from "node:crypto";

// ragproof defaults, kept identical so numbers here mean the same thing there.
const DIM = 128;
const THRESHOLD = 0.55;

// Same sentence split as ragproof: punctuation followed by whitespace.
const SENT_SPLIT = /(?<=[.!?])\s+/;

export function splitSentences(text) {
  return text
    .trim()
    .split(SENT_SPLIT)
    .map((s) => s.trim())
    .filter(Boolean);
}

// Mirrors toy_embed: lowercase, split on whitespace, hash each token to a bucket
// and count it. Whitespace splitting (not a word regex) is deliberate, because
// that is what the python reference does and the scores have to line up.
export function embed(text) {
  const vec = new Array(DIM).fill(0);
  for (const word of text.toLowerCase().split(/\s+/)) {
    if (!word) continue;
    const digest = createHash("md5").update(word, "utf8").digest("hex");
    // md5 is 128 bits, wider than Number can hold exactly, so fold it with BigInt.
    const idx = Number(BigInt(`0x${digest}`) % BigInt(DIM));
    vec[idx] += 1;
  }
  return vec;
}

export function cosine(a, b) {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

// Fraction of answer sentences supported by at least one context chunk.
// Returns null, not a number, when there is no answer to score: an absent
// measurement must not be averaged in as if it were a perfect one.
export function faithfulness(answer, contexts, threshold = THRESHOLD) {
  const sentences = splitSentences(answer ?? "");
  if (!sentences.length) return null;
  const ctxVecs = (contexts ?? []).map(embed);
  let supported = 0;
  for (const sentence of sentences) {
    const sv = embed(sentence);
    let best = 0;
    for (const cv of ctxVecs) best = Math.max(best, cosine(sv, cv));
    if (best >= threshold) supported += 1;
  }
  return supported / sentences.length;
}

export function answerRelevance(question, answer) {
  return Math.max(0, cosine(embed(question), embed(answer)));
}
