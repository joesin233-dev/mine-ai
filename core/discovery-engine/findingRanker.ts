// MINE AI V0.1 — Discovery Engine: Finding Ranker
// Stage 4: takes findings from all detectors and assigns each a rankScore
// so the most important findings surface first. Per the blueprint, ranking
// considers magnitude, type-relevance, and how many variables are involved —
// this is NOT the same as "biggest number wins."

import type { Finding } from "@/models/types";

// Different finding types carry different baseline importance:
// a sustained change matters more than a single anomalous point, and a
// confirmed relationship between variables is often the most actionable.
const TYPE_WEIGHT: Record<Finding["type"], number> = {
  change: 1.2,
  relationship: 1.1,
  trend: 1.0,
  anomaly: 0.8,
};

export function rankFindings(findings: Finding[]): Finding[] {
  const scored = findings.map((finding) => {
    const typeWeight = TYPE_WEIGHT[finding.type];
    const variableBonus = 1 + (finding.variablesInvolved.length - 1) * 0.1;
    const rankScore = finding.magnitude * typeWeight * variableBonus;
    return { ...finding, rankScore };
  });

  return scored.sort((a, b) => b.rankScore - a.rankScore);
}
