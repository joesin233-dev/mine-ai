// MINE AI V0.1 — Report Engine: Evidence Builder
// Stage 10: turns the confidence result into a plain-language summary
// sentence for the "Confidence & Uncertainty" section of the report.

import type { EvidenceRecord } from "@/models/types";

export function buildConfidenceSummary(evidence: EvidenceRecord): string {
  const reasonText = evidence.confidenceReasons.join(" ");
  return `Confidence in this finding is ${evidence.confidence.toUpperCase()}. ${reasonText}`;
}
