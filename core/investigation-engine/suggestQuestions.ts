// MINE AI V0.1 — Investigation Engine: Suggested Questions
// Builds grouped, plain-language questions from the dataset's real columns
// (and findings when available). No AI: every suggestion is validated with
// the real question parser + variable selector, so none can fail.
//
// The user SEES a natural question with real numbers in it.
// The engine receives a safe column-only question.

import type { ColumnProfile, Finding } from "@/models/types";
import { parseQuestion } from "./questionParser";
import { selectVariables } from "./variableSelector";

export type QuestionGroup = "changed" | "unusual" | "connected";

export interface SuggestedQuestion {
  label: string;
  question: string;
  basedOn: string;
  group: QuestionGroup;
}

const MAX_TOTAL = 6;
const MAX_PER_GROUP = 2;

function plain(name: string): string {
  return name.replace(/_/g, " ");
}

function fmt(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function describe(column: ColumnProfile | undefined): string {
  if (!column?.plainSummary) return "A number column in your file";
  return column.plainSummary.replace(/^In simple terms:\s*/i, "");
}

function shiftOf(
  column: ColumnProfile | undefined
): { dir: "up" | "down"; pct: number } | null {
  const m = (column?.plainSummary ?? "").match(/\((up|down) (\d+)%\)/);
  return m ? { dir: m[1] as "up" | "down", pct: Number(m[2]) } : null;
}

function shiftWords(s: { dir: "up" | "down"; pct: number }): string {
  return `${s.dir === "down" ? "drop" : "rise"} ${s.pct}%`;
}

function hasHighOutlier(c: ColumnProfile): boolean {
  return !!c.stats && c.stats.max > c.stats.mean + 3 * c.stats.stdDev;
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
    const key = vars.join("|");
    if (used.has(key)) return;

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

  // 1) Strongest findings first, when we have them.
  const ranked = [...findings].sort((a, b) => b.rankScore - a.rankScore);
  for (const f of ranked) {
    const vars = f.variablesInvolved.slice(0, 2);
    const first = byName.get(vars[0]);
    const [a, b] = vars.map(plain);
    const shift = shiftOf(first);
    if (f.type === "anomaly") {
      add("unusual", `Why were some ${a} values unusual?`, vars, describe(first));
    } else if (f.type === "relationship") {
      add(
        "connected",
        b ? `Is ${a} linked to ${b}?` : `What is linked to ${a}?`,
        vars,
        describe(first)
      );
    } else {
      add(
        "changed",
        shift ? `Why did ${a} ${shiftWords(shift)}?` : `What is behind the change in ${a}?`,
        vars,
        describe(first)
      );
    }
  }

  // 2) What changed: columns that clearly moved, biggest first.
  const moved = numeric
    .filter((c) => shiftOf(c) !== null)
    .sort((a, b) => shiftOf(b)!.pct - shiftOf(a)!.pct);
  for (const c of moved) {
    add("changed", `Why did ${plain(c.name)} ${shiftWords(shiftOf(c)!)}?`, [c.name], describe(c));
  }

  // 3) What looks unusual: columns with very high values.
  for (const c of numeric.filter(hasHighOutlier)) {
    add(
      "unusual",
      `Why are some ${plain(c.name)} values so high (up to ${fmt(c.stats!.max)})?`,
      [c.name],
      `Typical ${plain(c.name)} is about ${fmt(c.stats!.median)}, but the highest value is ${fmt(c.stats!.max)}.`
    );
  }

  // 4) What is connected: the remaining columns.
  for (const c of numeric) {
    add("connected", `What is linked to changes in ${plain(c.name)}?`, [c.name], describe(c));
  }

  return out;
}

export function askableColumnNames(columns: ColumnProfile[]): string[] {
  return columns.filter((c) => c.type === "numeric").map((c) => plain(c.name));
}
