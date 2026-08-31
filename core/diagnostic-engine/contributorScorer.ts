// MINE AI V0.1 — Diagnostic Engine: Contributor Scorer
// Stage 6: scores each candidate contributor transparently, using only
// real calculations. Per the locked causation rule, this NEVER concludes
// that a contributor caused the finding — only how strongly it is
// associated with it, in plain, careful language.

import type { ColumnProfile, Contributor } from "@/models/types";
import { average, pearsonCorrelation, directionalConsistency } from "./statsHelpers";

export interface ScoringInput {
  candidate: ColumnProfile;
  candidateValues: number[];
  targetValues: number[];
  baselineIndices: number[];
  comparisonIndices: number[];
}

export function scoreContributor(input: ScoringInput): Contributor {
  const { candidate, candidateValues, targetValues, baselineIndices, comparisonIndices } = input;

  // Magnitude: how much the candidate itself changed between the same
  // baseline/comparison split used for the target variable's finding.
  const baselineVals = baselineIndices
    .map((i) => candidateValues[i])
    .filter((v) => !Number.isNaN(v));
  const comparisonVals = comparisonIndices
    .map((i) => candidateValues[i])
    .filter((v) => !Number.isNaN(v));

  let magnitudeScore = 0;
  let observedChangeText = "no measurable change";
  if (baselineVals.length > 0 && comparisonVals.length > 0) {
    const baselineMean = average(baselineVals);
    const comparisonMean = average(comparisonVals);
    if (baselineMean !== 0) {
      const percentChange = ((comparisonMean - baselineMean) / baselineMean) * 100;
      magnitudeScore = Math.min(Math.abs(percentChange) / 20, 1); // cap at 1
      const direction = percentChange < 0 ? "decreased" : "increased";
      observedChangeText = `${direction} by ${Math.abs(percentChange).toFixed(1)}%`;
    }
  }

  // Correlation: overall linear relationship with the target across all rows.
  const correlation = pearsonCorrelation(candidateValues, targetValues) ?? 0;
  const correlationScore = Math.abs(correlation);

  // Temporal alignment: does the candidate's change happen in the SAME
  // period as the target's change (approximated here by correlation
  // restricted to the comparison-period rows only).
  const targetComparisonVals = comparisonIndices
    .map((i) => targetValues[i])
    .filter((v) => !Number.isNaN(v));
  const temporalCorrelation =
    comparisonVals.length >= 2 && targetComparisonVals.length >= 2
      ? pearsonCorrelation(comparisonVals, targetComparisonVals) ?? 0
      : 0;
  const temporalAlignmentScore = Math.abs(temporalCorrelation);

  // Consistency: how often the candidate and target move the same
  // direction row-to-row, across the whole series.
  const consistencyScore = directionalConsistency(candidateValues, targetValues);

  // Contradicting evidence: rows where the candidate moved but the target
  // didn't move the same way — the inverse of consistency.
  const contradictingEvidenceScore = 1 - consistencyScore;

  const overallScore =
    magnitudeScore * 0.3 +
    correlationScore * 0.3 +
    temporalAlignmentScore * 0.25 +
    consistencyScore * 0.15;

  let evidenceStrength: "high" | "medium" | "low";
  if (overallScore >= 0.6) evidenceStrength = "high";
  else if (overallScore >= 0.35) evidenceStrength = "medium";
  else evidenceStrength = "low";

  return {
    variableName: candidate.name,
    observedChange: observedChangeText,
    evidenceStrength,
    scoreBreakdown: {
      magnitude: round(magnitudeScore),
      temporalAlignment: round(temporalAlignmentScore),
      correlation: round(correlationScore),
      consistency: round(consistencyScore),
      contradictingEvidence: round(contradictingEvidenceScore),
    },
  };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
