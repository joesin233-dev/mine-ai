// MINE AI V0.1 — Investigation Engine: Orchestrator
// Stage 5: the full pipeline — question in, targeted Finding out (or a
// clarification request if the question couldn't be confidently understood).
// Per the locked rules: no external AI/LLM, and no guessing when uncertain.

import type { Dataset, Finding } from "@/models/types";
import { parseQuestion } from "./questionParser";
import { selectVariables } from "./variableSelector";
import { selectTimePeriod, splitRowsByMonth } from "./timePeriodSelector";
import { compareGroups } from "./comparisonEngine";

export interface InvestigateInput {
  datasetId: string;
  dataset: Dataset;
  rows: Record<string, string | number | null>[];
  question: string;
}

export interface InvestigateResult {
  needsClarification: boolean;
  clarificationMessage?: string;
  finding?: Finding;
}

export function runInvestigation(input: InvestigateInput): InvestigateResult {
  const { datasetId, dataset, rows, question } = input;

  const parsedQuestion = parseQuestion(question);
  const variableMatches = selectVariables(parsedQuestion, dataset.columns);

  if (variableMatches.length === 0) {
    return {
      needsClarification: true,
      clarificationMessage:
        "I couldn't confidently match your question to a column in this dataset. " +
        "Could you name the specific variable you're asking about (e.g. \"production\", \"downtime\")?",
    };
  }

  // Use the first confidently matched variable — if the question mentions
  // multiple, later stages (diagnostics) will look at the others as
  // candidate contributors.
  const targetColumn = variableMatches[0].column;

  const dateColumn = dataset.columns.find((c) => c.type === "datetime");
  const dateValues = dateColumn
    ? rows.map((row) => row[dateColumn.name])
    : rows.map((_, i) => i);

  const allValues = rows
    .map((row) => Number(row[targetColumn.name]))
    .filter((v) => !Number.isNaN(v));

  if (allValues.length < 4) {
    return {
      needsClarification: true,
      clarificationMessage: `There isn't enough data in "${targetColumn.name}" to run a reliable comparison (need at least 4 data points).`,
    };
  }

  const timePeriod = selectTimePeriod(question);

  let baselineValues: number[];
  let comparisonValues: number[];
  let periodDescription: string;

  if (timePeriod && dateColumn) {
    const { inPeriod, outsidePeriod } = splitRowsByMonth(dateValues, timePeriod.monthIndex);
    comparisonValues = inPeriod.map((i) => Number(rows[i][targetColumn.name])).filter((v) => !Number.isNaN(v));
    baselineValues = outsidePeriod.map((i) => Number(rows[i][targetColumn.name])).filter((v) => !Number.isNaN(v));
    periodDescription = timePeriod.monthName;
  } else {
    // No specific period mentioned — fall back to first half vs second half.
    const mid = Math.floor(allValues.length / 2);
    baselineValues = allValues.slice(0, mid);
    comparisonValues = allValues.slice(mid);
    periodDescription = "the most recent portion of the available data";
  }

  const comparison = compareGroups(baselineValues, comparisonValues);

  if (!comparison) {
    return {
      needsClarification: true,
      clarificationMessage: `Not enough data was found for "${periodDescription}" to compare against the rest of the dataset.`,
    };
  }

  const direction = comparison.percentChange < 0 ? "dropped" : "increased";

  const finding: Finding = {
    id: `investigation-${targetColumn.name}-${datasetId}`,
    datasetId,
    type: "change",
    variablesInvolved: [targetColumn.name],
    period: {
      start: String(dateValues[0] ?? ""),
      end: String(dateValues[dateValues.length - 1] ?? ""),
    },
    magnitude: Math.abs(comparison.percentChange),
    rankScore: Math.abs(comparison.percentChange),
    description: `${targetColumn.name} ${direction} by ${Math.abs(comparison.percentChange).toFixed(1)}% during ${periodDescription}, compared with the baseline average of ${comparison.baselineMean.toFixed(1)} (based on ${comparison.baselineCount} baseline data points vs ${comparison.comparisonCount} in the period asked about).`,
  };

  return {
    needsClarification: false,
    finding,
  };
}
