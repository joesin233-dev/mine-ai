// MINE AI V0.1 — Discovery Engine: Anomaly Detector
// Stage 4: flags individual data points that sit unusually far from the
// rest of the column's values, using a standard z-score. This detects
// single unusual rows, not the sustained shifts that changeDetector finds.

import type { Finding } from "@/models/types";

const Z_SCORE_THRESHOLD = 2; // points beyond 2 standard deviations are flagged

export function detectAnomalies(
  datasetId: string,
  columnName: string,
  values: number[],
  rowDates: string[]
): Finding[] {
  if (values.length < 4) return []; // too few points for a meaningful stddev

  const mean = average(values);
  const stdDev = standardDeviation(values, mean);

  if (stdDev === 0) return []; // no variation, nothing to flag

  const findings: Finding[] = [];

  values.forEach((value, index) => {
    const zScore = (value - mean) / stdDev;
    if (Math.abs(zScore) >= Z_SCORE_THRESHOLD) {
      findings.push({
        id: `anomaly-${columnName}-${index}-${datasetId}`,
        datasetId,
        type: "anomaly",
        variablesInvolved: [columnName],
        period: {
          start: rowDates[index] ?? "",
          end: rowDates[index] ?? "",
        },
        magnitude: Math.abs(zScore),
        rankScore: 0,
        description: `${columnName} had an unusual value of ${value} on ${rowDates[index] ?? "an unknown date"}, ${Math.abs(zScore).toFixed(1)} standard deviations from the average.`,
      });
    }
  });

  return findings;
}

function average(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function standardDeviation(values: number[], mean: number): number {
  const variance =
    values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}
