// MINE AI V0.1 — Diagnostic Engine: Alternative Explanation Detector
// Stage 6: surfaces honest caveats — contributors that were considered but
// scored weakly, plus general limitations. This exists specifically so
// MINE AI never presents one contributor as the whole story.

import type { Contributor } from "@/models/types";

export function detectAlternativeExplanations(
  contributors: Contributor[],
  totalRowCount: number
): string[] {
  const explanations: string[] = [];

  const weakContributors = contributors.filter((c) => c.evidenceStrength === "low");
  if (weakContributors.length > 0) {
    const names = weakContributors.map((c) => c.variableName).join(", ");
    explanations.push(
      `${names} ${weakContributors.length === 1 ? "was" : "were"} also examined but showed weak association with this finding — unlikely to be the main driver, but not ruled out entirely.`
    );
  }

  if (totalRowCount < 20) {
    explanations.push(
      `The dataset has only ${totalRowCount} rows, which limits confidence in any of these associations. A larger sample would give more reliable results.`
    );
  }

  explanations.push(
    "Factors not present in this dataset (e.g. external market conditions, staffing changes, equipment maintenance events) could also explain this finding and cannot be ruled out from this data alone."
  );

  return explanations;
}
