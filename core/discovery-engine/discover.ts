// MINE AI V0.1 — Discovery Engine: Orchestrator
// Stage 4: runs all detectors against a dataset's numeric columns and
// returns a single ranked list of findings. This is the function the
// Discover API route calls — it does not talk to storage or HTTP directly.

import type { Dataset, Finding } from "@/models/types";
import { detectChanges } from "./changeDetector";
import { detectAnomalies } from "./anomalyDetector";
import { detectTrends } from "./trendDetector";
import { detectRelationships } from "./relationshipDetector";
import { rankFindings } from "./findingRanker";

export interface DiscoverInput {
  datasetId: string;
  dataset: Dataset;
  rows: Record<string, string | number | null>[];
}

/**
 * Finds the first datetime-typed column to use as the row-order/date label
 * for findings. Falls back to row index if no datetime column exists.
 */
function getDateLabels(input: DiscoverInput): string[] {
  const dateColumn = input.dataset.columns.find((c) => c.type === "datetime");
  if (!dateColumn) {
    return input.rows.map((_, i) => `row ${i + 1}`);
  }
  return input.rows.map((row) => String(row[dateColumn.name] ?? ""));
}

export function runDiscovery(input: DiscoverInput): Finding[] {
  const { datasetId, dataset, rows } = input;
  const dateLabels = getDateLabels(input);

  const numericColumns = dataset.columns.filter((c) => c.type === "numeric");

  let allFindings: Finding[] = [];

  const numericColumnValues: { name: string; values: number[] }[] = [];

  for (const column of numericColumns) {
    const values = rows.map((row) => Number(row[column.name])).filter(
      (v) => !Number.isNaN(v)
    );

    if (values.length === 0) continue;

    numericColumnValues.push({ name: column.name, values });

    allFindings = allFindings.concat(
      detectChanges(datasetId, column.name, values, dateLabels)
    );
    allFindings = allFindings.concat(
      detectAnomalies(datasetId, column.name, values, dateLabels)
    );
    allFindings = allFindings.concat(
      detectTrends(datasetId, column.name, values, dateLabels)
    );
  }

  allFindings = allFindings.concat(
    detectRelationships(datasetId, numericColumnValues, dateLabels)
  );

  return rankFindings(allFindings);
}
