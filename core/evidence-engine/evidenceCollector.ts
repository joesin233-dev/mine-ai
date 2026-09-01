// MINE AI V0.1 — Evidence Engine: Evidence Collector
// Stage 7: assembles the factual record behind a finding — what data was
// used, what was calculated, and which contributors support or contradict
// the finding. This is the audit trail per the locked "must be auditable"
// rule — every number here traces back to a real calculation.

import type { Contributor, EvidenceCalculation, Finding } from "@/models/types";

export interface CollectedEvidence {
  dataUsed: string[];
  variablesUsed: string[];
  calculations: EvidenceCalculation[];
  supportingEvidence: string[];
  contradictingEvidence: string[];
}

export function collectEvidence(
  finding: Finding,
  contributors: Contributor[],
  datasetFilename: string
): CollectedEvidence {
  const targetVariable = finding.variablesInvolved[0];

  const variablesUsed = [
    targetVariable,
    ...contributors.map((c) => c.variableName),
  ];

  const calculations: EvidenceCalculation[] = [
    {
      label: `${targetVariable} magnitude of change`,
      formula: "(comparisonMean - baselineMean) / baselineMean * 100",
      result: finding.magnitude,
    },
    ...contributors.map((c) => ({
      label: `${c.variableName} correlation with ${targetVariable}`,
      formula: "Pearson correlation coefficient",
      result: c.scoreBreakdown.correlation,
    })),
  ];

  // Supporting: contributors whose evidence is high or medium strength.
  const supportingEvidence = contributors
    .filter((c) => c.evidenceStrength === "high" || c.evidenceStrength === "medium")
    .map(
      (c) =>
        `${c.variableName} ${c.observedChange}, with a correlation of ${c.scoreBreakdown.correlation} to ${targetVariable} — evidence strength: ${c.evidenceStrength}.`
    );

  // Contradicting: contributors whose own contradictingEvidence score is
  // notably high, meaning their movement doesn't reliably track the target.
  const contradictingEvidence = contributors
    .filter((c) => c.scoreBreakdown.contradictingEvidence >= 0.6)
    .map(
      (c) =>
        `${c.variableName} does not consistently move with ${targetVariable} (inconsistency score: ${c.scoreBreakdown.contradictingEvidence}), which weakens confidence in it as a contributor.`
    );

  return {
    dataUsed: [datasetFilename],
    variablesUsed,
    calculations,
    supportingEvidence,
    contradictingEvidence,
  };
}
