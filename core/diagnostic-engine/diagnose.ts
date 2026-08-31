// MINE AI V0.1 — Diagnostic Engine: Orchestrator
// Stage 6: the full pipeline — a Finding in, ranked Contributors plus
// alternative explanations out. This is the function Stage 7 (Evidence)
// will call to build the full EvidenceRecord.

import type { Dataset, Finding, Contributor } from "@/models/types";
import { detectCandidateContributors } from "./contributorDetector";
import { scoreContributor } from "./contributorScorer";
import { detectAlternativeExplanations } from "./alternativeExplanationDetector";

export interface DiagnoseInput {
  finding: Finding;
  dataset: Dataset;
  rows: Record<string, string | number | null>[];
}

export interface DiagnoseResult {
  contributors: Contributor[];
  alternativeExplanations: string[];
}

export function runDiagnostics(input: DiagnoseInput): DiagnoseResult {
  const { finding, dataset, rows } = input;

  const targetColumnName = finding.variablesInvolved[0];
  const targetValues = rows.map((row) => Number(row[targetColumnName]));

  const candidates = detectCandidateContributors(finding, dataset.columns);

  // Reconstruct the same baseline/comparison split the finding was based
  // on: the second half of rows vs the first half, unless the finding
  // covers a specific narrower period (handled the same simple way for
  // consistency across Discovery and Investigation findings in V0.1).
  const mid = Math.floor(rows.length / 2);
  const baselineIndices = rows.slice(0, mid).map((_, i) => i);
  const comparisonIndices = rows.slice(mid).map((_, i) => i + mid);

  const contributors = candidates.map((candidate) => {
    const candidateValues = rows.map((row) => Number(row[candidate.name]));
    return scoreContributor({
      candidate,
      candidateValues,
      targetValues,
      baselineIndices,
      comparisonIndices,
    });
  });

  // Strongest evidence first.
  const strengthOrder = { high: 3, medium: 2, low: 1 };
  contributors.sort((a, b) => strengthOrder[b.evidenceStrength] - strengthOrder[a.evidenceStrength]);

  const alternativeExplanations = detectAlternativeExplanations(contributors, rows.length);

  return { contributors, alternativeExplanations };
}
