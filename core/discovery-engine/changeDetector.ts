// MINE AI V0.1 — Discovery Engine: Change Detector
// Stage 4: detects a meaningful shift in a numeric column between an
// earlier period and a later period in the data (e.g. "production dropped
// after week 2"). Splits the column's values into two halves in row order
// and compares their means. Deterministic, no external AI involved.

import type { Finding } from "@/models/types";

const MIN_CHANGE_PERCENT = 8; // below this, a shift isn't worth flagging
const MIN_ROWS_PER_HALF = 3; // too few rows makes a mean unreliable

export function detectChanges(
  datasetId: string,
  columnName: string,
  values: number[],
  periodDates: string[]
): Finding[] {
  if (values.length < MIN_ROWS_PER_HALF * 2) return [];

  const mid = Math.floor(values.length / 2);
  const firstHalf = values.slice(0, mid);
  const secondHalf = values.slice(mid);

  const meanFirst = average(firstHalf);
  const meanSecond = average(secondHalf);

  if (meanFirst === 0) return [];

  const percentChange = ((meanSecond - meanFirst) / meanFirst) * 100;

  if (Math.abs(percentChange) < MIN_CHANGE_PERCENT) return [];

  const direction = percentChange < 0 ? "decreased" : "increased";

  const finding: Finding = {
    id: `change-${columnName}-${datasetId}`,
    datasetId,
    type: "change",
    variablesInvolved: [columnName],
    period: {
      start: periodDates[0] ?? "",
      end: periodDates[periodDates.length - 1] ?? "",
    },
    magnitude: Math.abs(percentChange),
    rankScore: 0, // assigned later by the ranker
    description: `${columnName} ${direction} by ${Math.abs(percentChange).toFixed(1)}% between the first and second half of the available period.`,
  };

  return [finding];
}

function average(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}
