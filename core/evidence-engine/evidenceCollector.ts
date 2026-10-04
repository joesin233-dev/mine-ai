// Tarpec AI — Evidence Engine: Evidence Collector
// Stage 7: assembles the factual record behind a finding — what data was
// used, what was calculated, and which contributors support or contradict
// the finding. This is the audit trail per the locked "must be auditable"
// rule — every number here traces back to a real calculation.
//
// Update: the relationship number is labelled honestly (strength from 0 to
// 1, direction ignored) instead of as a signed correlation.

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
      label: `${c.variableName} relationship strength with ${targetVariable}`,
      formula:
        "Absolute value of the Pearson correlation (0 = none, 1 = perfect; direction ignored)",
      result: c.scoreBreakdown.correlation,
    })),
  ];

  // Supporting: contributors whose evidence is high or medium strength.
  const supportingEvidence = contributors
    .filter((c) => c.evidenceStrength === "high" || c.evidenceStrength === "medium")
    .map(
      (c) =>
        `${c.variableName} ${c.observedChange}, with a relationship strength of ${c.scoreBreakdown.correlation} (scale 0 to 1) to ${targetVariable} — evidence strength: ${c.evidenceStrength}.`
    );

  // Contradicting: contributors that do not reliably move together with the
  // target from one row to the next (in either direction).
  const contradictingEvidence = contributors
    .filter((c) => c.scoreBreakdown.contradictingEvidence >= 0.6)
    .map(
      (c) =>
        `${c.variableName} does not reliably move together with ${targetVariable} from row to row (inconsistency score: ${c.scoreBreakdown.contradictingEvidence}), which weakens confidence in it as a contributor.`
    );

  return {
    dataUsed: [datasetFilename],
    variablesUsed,
    calculations,
    supportingEvidence,
    contradictingEvidence,
  };
}
