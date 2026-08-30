// MINE AI V0.1 — Investigation Engine: Variable Selector
// Stage 5: matches question keywords to actual dataset columns by simple
// substring matching (e.g. "production" matches "production_tons"). If no
// confident match is found, returns null so the caller can ask the user
// for clarification — per the locked rule that MINE AI must not guess when
// it cannot confidently understand the question.

import type { ColumnProfile } from "@/models/types";
import type { ParsedQuestion } from "./questionParser";

export interface VariableMatch {
  column: ColumnProfile;
  matchedToken: string;
}

/**
 * Normalizes a column name for comparison: lowercase, underscores to spaces.
 */
function normalize(name: string): string {
  return name.toLowerCase().replace(/_/g, " ");
}

export function selectVariables(
  question: ParsedQuestion,
  columns: ColumnProfile[]
): VariableMatch[] {
  const matches: VariableMatch[] = [];
  const numericColumns = columns.filter((c) => c.type === "numeric");

  for (const token of question.tokens) {
    for (const column of numericColumns) {
      const normalizedName = normalize(column.name);
      if (normalizedName.includes(token) || token.includes(normalizedName)) {
        // Avoid duplicate matches for the same column from multiple tokens.
        if (!matches.some((m) => m.column.name === column.name)) {
          matches.push({ column, matchedToken: token });
        }
      }
    }
  }

  return matches;
}
