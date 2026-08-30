// MINE AI V0.1 — Investigation Engine: Question Parser
// Stage 5: breaks a free-text question into lowercase keyword tokens.
// No external AI/LLM is used — this is plain string tokenization, per the
// locked rule that MINE AI must function without an external AI API.

export interface ParsedQuestion {
  originalText: string;
  tokens: string[];
}

const STOP_WORDS = new Set([
  "the", "a", "an", "is", "was", "were", "in", "on", "at", "of", "to",
  "and", "or", "please", "investigate", "possible", "contributors",
  "for", "why", "did", "what", "caused", "cause", "this", "that",
]);

export function parseQuestion(text: string): ParsedQuestion {
  const tokens = text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ") // strip punctuation
    .split(/\s+/)
    .filter((token) => token.length > 0 && !STOP_WORDS.has(token));

  return {
    originalText: text,
    tokens,
  };
}
