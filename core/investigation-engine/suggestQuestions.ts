// MINE AI V0.1 — Investigation Engine: Suggested Questions
// Builds real business questions (what affects sales? does price affect
// quantity? why are some values so high?) from the dataset's own columns.
// No AI: every suggestion is validated with the real question parser +
// variable selector, so a button that wouldn't work is never shown.
//
// The user SEES a natural question. The engine receives a safe
// column-only question.

import type { ColumnProfile, Finding } from "@/models/types";
import { parseQuestion } from "./questionParser";
import { selectVariables } from "./variableSelector";

export type QuestionGroup = "changed" | "unusual" | "connected";

export interface SuggestedQuestion {
  label: string; // the question the user sees
  question: string; // what is sent to Investigate
  basedOn: string; // short hint about what they will get
  group: QuestionGroup;
}

const MAX_TOTAL = 6;
const MAX_PER_GROUP = 3;
const HINT_DRIVERS = "You will get: the main contributors, with evidence and confidence.";
const HINT_LINK = "You will get: whether they move together, with evidence and confidence.";
const HINT_UNUSUAL = "You will get: what was different when the unusual values happened.";

function plain(name: string): string {
  return name.replace(/_/g, " ");
}

function words(name: string): string[] {
  return name.toLowerCase().split(/[^a-z]+/).filter(Boolean);
}

function has(c: ColumnProfile, hints: string[]): boolean {
  return words(c.name).some((w) => hints.some((h) => w.startsWith(h)));
}

function hasHighOutlier(c: ColumnProfile): boolean {
  return !!c.stats && c.stats.max > c.stats.mean + 3 * c.stats.stdDev;
}

function variation(c: ColumnProfile): number {
  if (!c.stats || c.stats.mean === 0) return 0;
  return c.stats.stdDev / Math.abs(c.stats.mean);
}

/** The main "result" column: totals, sales, revenue, profit come first. */
function pickTarget(numeric: ColumnProfile[]): ColumnProfile | undefined {
  const score = (c: ColumnProfile): number =>
    has(c, ["total", "revenue", "profit", "income"])
      ? 3
      : has(c, ["sales", "value"])
      ? 2
      : has(c, ["quantity", "sold", "units", "production"])
      ? 1
      : 0;
  return [...numeric].sort(
    (a, b) => score(b) - score(a) || (b.stats?.mean ?? 0) - (a.stats?.mean ?? 0)
  )[0];
}

export function suggestQuestions(
  columns: ColumnProfile[],
  findings: Finding[] = []
): SuggestedQuestion[] {
  const numeric = columns.filter(
    (c) => c.type === "numeric" && c.stats && c.stats.stdDev > 0
  );
  const byName = new Map(numeric.map((c) => [c.name, c]));
  const out: SuggestedQuestion[] = [];
  const used = new Set<string>();
  const perGroup: Record<QuestionGroup, number> = {
    changed: 0,
    unusual: 0,
    connected: 0,
  };

  const add = (
    group: QuestionGroup,
    label: string,
    vars: string[],
    basedOn: string
  ): void => {
    if (out.length >= MAX_TOTAL || perGroup[group] >= MAX_PER_GROUP) return;
    if (vars.length === 0 || !vars.every((v) => byName.has(v))) return;
    const key = `${group}|${vars.join("|")}`;
    if (used.has(key)) return;

    // The engine must be able to resolve this question to the right column.
    const question = `Investigate ${vars.map(plain).join(" ")}`;
    const matched = selectVariables(parseQuestion(question), columns).map(
      (m) => m.column.name
    );
    if (matched[0] !== vars[0] || !vars.every((v) => matched.includes(v))) {
      return;
    }

    used.add(key);
    perGroup[group]++;
    out.push({ label, question, basedOn, group });
  };

  const target = pickTarget(numeric);
  const price = numeric.find((c) => has(c, ["price", "rate"]));
  const quantity = numeric.find((c) => has(c, ["quantity", "sold", "units", "volume"]));
  const costs = numeric.filter((c) => has(c, ["cost", "expense"]));

  // 0) Strongest findings first, when we have them.
  const ranked = [...findings].sort((a, b) => b.rankScore - a.rankScore);
  for (const f of ranked) {
    const vars = f.variablesInvolved.slice(0, 2);
    const [a, b] = vars.map(plain);
    if (f.type === "anomaly") {
      add("unusual", `Why were some ${a} values unusual?`, vars, HINT_UNUSUAL);
    } else if (f.type === "relationship") {
      add("connected", b ? `Is ${a} linked to ${b}?` : `What is linked to ${a}?`, vars, HINT_LINK);
    } else if (f.type === "trend") {
      add("changed", `What is behind the trend in ${a}?`, vars, HINT_DRIVERS);
    } else {
      add("changed", `What is behind the change in ${a}?`, vars, HINT_DRIVERS);
    }
  }

  // 1) The main result column.
  if (target) {
    add("changed", `What affects ${plain(target.name)} the most?`, [target.name], HINT_DRIVERS);
  }

  // 2) Does price affect quantity?
  if (price && quantity && price.name !== quantity.name) {
    add(
      "connected",
      `Does ${plain(price.name)} affect ${plain(quantity.name)}?`,
      [price.name, quantity.name],
      HINT_LINK
    );
  }

  // 3) Unusually high values (the main column first).
  const outliers = numeric.filter(hasHighOutlier);
  outliers.sort((a, b) => (a === target ? -1 : b === target ? 1 : 0));
  for (const c of outliers) {
    add(
      "unusual",
      `Why are some ${plain(c.name)} values so high compared with normal?`,
      [c.name],
      HINT_UNUSUAL
    );
  }

  // 4) Are the costs linked to the main result?
  if (target) {
    for (const c of costs) {
      if (c.name === target.name) continue;
      add(
        "connected",
        `Is ${plain(c.name)} linked to ${plain(target.name)}?`,
        [c.name, target.name],
        HINT_LINK
      );
    }
  }

  // 5) The column that swings the most.
  const swingiest = [...numeric].sort((a, b) => variation(b) - variation(a))[0];
  if (swingiest && variation(swingiest) >= 0.3) {
    add(
      "unusual",
      `Why does ${plain(swingiest.name)} vary so much?`,
      [swingiest.name],
      HINT_UNUSUAL
    );
  }

  // 6) What is driving each cost.
  for (const c of costs) {
    add("changed", `What is driving ${plain(c.name)}?`, [c.name], HINT_DRIVERS);
  }

  // 7) Fallback so any file gets questions.
  for (const c of numeric) {
    add("changed", `What affects ${plain(c.name)}?`, [c.name], HINT_DRIVERS);
  }

  return out;
}

export function askableColumnNames(columns: ColumnProfile[]): string[] {
  return columns.filter((c) => c.type === "numeric").map((c) => plain(c.name));
}
