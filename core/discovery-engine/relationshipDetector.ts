// MINE AI V0.1 — Discovery Engine: Relationship Detector
// Stage 4: detects correlation between pairs of numeric columns using the
// Pearson correlation coefficient. This finds "these two variables move
// together" — it does NOT claim one causes the other. That distinction is
// enforced by the causation rule in the diagnostic engine (later stage).

import type { Finding } from "@/models/types";

const MIN_CORRELATION = 0.7; // |r| below this is not reported

export function detectRelationships(
  datasetId: string,
  columns: { name: string; values: number[] }[],
  periodDates: string[]
): Finding[] {
  const findings: Finding[] = [];

  for (let i = 0; i < columns.length; i++) {
    for (let j = i + 1; j < columns.length; j++) {
      const colA = columns[i];
      const colB = columns[j];

      if (colA.values.length !== colB.values.length) continue;
      if (colA.values.length < 4) continue;

      const r = pearsonCorrelation(colA.values, colB.values);
      if (r === null) continue;

      if (Math.abs(r) >= MIN_CORRELATION) {
        const direction = r > 0 ? "move together" : "move in opposite directions";
        findings.push({
          id: `relationship-${colA.name}-${colB.name}-${datasetId}`,
          datasetId,
          type: "relationship",
          variablesInvolved: [colA.name, colB.name],
          period: {
            start: periodDates[0] ?? "",
            end: periodDates[periodDates.length - 1] ?? "",
          },
          magnitude: Math.abs(r),
          rankScore: 0,
          description: `${colA.name} and ${colB.name} ${direction} (correlation r=${r.toFixed(2)}). This is an observed association, not a confirmed cause-and-effect relationship.`,
        });
      }
    }
  }

  return findings;
}

function pearsonCorrelation(x: number[], y: number[]): number | null {
  const n = x.length;
  const xMean = x.reduce((s, v) => s + v, 0) / n;
  const yMean = y.reduce((s, v) => s + v, 0) / n;

  let numerator = 0;
  let sumXSq = 0;
  let sumYSq = 0;

  for (let i = 0; i < n; i++) {
    const dx = x[i] - xMean;
    const dy = y[i] - yMean;
    numerator += dx * dy;
    sumXSq += dx * dx;
    sumYSq += dy * dy;
  }

  const denominator = Math.sqrt(sumXSq * sumYSq);
  if (denominator === 0) return null;

  return numerator / denominator;
}
