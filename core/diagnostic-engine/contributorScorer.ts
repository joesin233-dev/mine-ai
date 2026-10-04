// Tarpec AI — Diagnostic Engine: Contributor Scorer
// Stage 6: scores each candidate contributor transparently, using only
// real calculations. Per the locked causation rule, this NEVER concludes
// that a contributor caused the finding — only how strongly it is
// associated with it, in plain, careful language.
//
// Update: consistency is direction-aware; the contradicting score is
// rescaled so 0 = perfectly consistent and 1 = no reliable pattern;
// missing values are skipped.

import type { ColumnProfile, Contributor } from "@/models/types";
import { average, pearsonCorrelation, signAwareConsistency } from "./statsHelpers";

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
    .filter((v) => Number.isFinite(v));
  const comparisonVals = comparisonIndices
    .map((i) => candidateValues[i])
    .filter((v) => Number.isFinite(v));

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
  // The size of the relationship counts, whichever direction it goes.
  const correlation = pearsonCorrelation(candidateValues, targetValues) ?? 0;
  const correlationScore = Math.abs(correlation);

  // Temporal alignment: correlation inside the comparison period only,
  // using rows where BOTH the candidate and the target have a value.
  const pairs = comparisonIndices
    .map((i) => [candidateValues[i], targetValues[i]] as const)
    .filter(([c, t]) => Number.isFinite(c) && Number.isFinite(t));
  const temporalCorrelation =
    pairs.length >= 2
      ? pearsonCorrelation(
          pairs.map((p) => p[0]),
          pairs.map((p) => p[1])
        ) ?? 0
      : 0;
  const temporalAlignmentScore = Math.abs(temporalCorrelation);

  // Consistency: how reliably the candidate and target move together
  // row to row, in either direction (0.5 = no pattern, 1 = always).
  const consistencyScore = signAwareConsistency(candidateValues, targetValues);

  // Contradicting evidence: 0 = perfectly consistent, 1 = no reliable
  // pattern (or no comparable movements at all).
  const contradictingEvidenceScore =
    consistencyScore === 0 ? 1 : Math.min(1, (1 - consistencyScore) * 2);

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
