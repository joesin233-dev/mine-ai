// MINE AI V0.1 — Investigation Engine: Suggested Questions
// Builds tap-to-ask questions from the dataset's real columns and findings,
// so users never have to guess what to type. No AI: every suggestion is
// validated with the real question parser + variable selector, so a
// suggestion that would fail is never shown.

import type { ColumnProfile, Finding } from "@/models/types";
import { parseQuestion } from "./questionParser";
import { selectVariables } from "./variableSelector";

export interface SuggestedQuestion {
  label: string; // what the user sees on the button
  question: string; // what is sent to Investigate
  basedOn: string; // short plain-English reason
}

const MAX_SUGGESTIONS = 6;

/** Underscores become spaces so the selector's substring match works. */
function plain(name: string): string {
  return name.replace(/_/g, " ");
}

function labelFor(finding: Finding, vars: string[]): string {
  const [a, b] = vars.map(plain);
  switch (finding.type) {
    case "trend":
      return `What is behind the trend in ${a}?`;
    case "change":
      return `What is behind the change in ${a}?`;
    case "anomaly":
      return `What explains the unusual values in ${a}?`;
    case "relationship":
      return b ? `What connects ${a} and ${b}?` : `What is connected to ${a}?`;
    default:
      return `What is behind ${a}?`;
  }
}

export function suggestQuestions(
  columns: ColumnProfile[],
  findings: Finding[] = []
): SuggestedQuestion[] {
  const numeric = columns.filter(
    (c) => c.type === "numeric" && c.stats && c.stats.stdDev > 0
  );
  const numericNames = new Set(numeric.map((c) => c.name));
  const out: SuggestedQuestion[] = [];
  const used = new Set<string>();

  const add = (label: string, vars: string[], basedOn: string): void => {
    if (out.length >= MAX_SUGGESTIONS || vars.length === 0) return;
    if (!vars.every((v) => numericNames.has(v))) return;
    const key = vars.join("|");
    if (used.has(key)) return;

    const question = `Investigate ${vars.map(plain).join(" ")}`;
    const matched = selectVariables(parseQuestion(question), columns).map(
      (m) => m.column.name
    );
    // Must resolve to the intended column first, and include all of them.
    if (matched[0] !== vars[0] || !vars.every((v) => matched.includes(v))) {
      return;
    }

    used.add(key);
    out.push({ label, question, basedOn });
  };

  // 1) Questions from the strongest findings first.
  const ranked = [...findings].sort((a, b) => b.rankScore - a.rankScore);
  for (const f of ranked) {
    const vars = f.variablesInvolved.slice(0, 2);
    add(labelFor(f, vars), vars, `Based on a ${f.type} Tarpec found in your data`);
  }

  // 2) Fill the rest with simple questions about the numeric columns.
  for (const c of numeric) {
    add(`What drives ${plain(c.name)}?`, [c.name], "A numeric column in your file");
  }

  return out;
}

/** Column names the user can mention if they type their own question. */
export function askableColumnNames(columns: ColumnProfile[]): string[] {
  return columns.filter((c) => c.type === "numeric").map((c) => plain(c.name));
}
