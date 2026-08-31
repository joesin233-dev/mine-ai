// MINE AI V0.1 — Diagnostic Engine: Contributor Detector
// Stage 6: identifies candidate contributors for a finding — every other
// numeric column in the dataset besides the one the finding is about.
// This step only IDENTIFIES candidates; it does not score or judge them.

import type { ColumnProfile, Finding } from "@/models/types";

export function detectCandidateContributors(
  finding: Finding,
  columns: ColumnProfile[]
): ColumnProfile[] {
  const targetVariables = new Set(finding.variablesInvolved);

  return columns.filter(
    (col) => col.type === "numeric" && !targetVariables.has(col.name)
  );
}
