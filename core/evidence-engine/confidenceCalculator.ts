// MINE AI V0.1 — Evidence Engine: Confidence Calculator
// Stage 7: computes a transparent confidence level from the actual
// evidence gathered, and explains WHY that level was chosen. Confidence is
// never randomly assigned — every reason listed here is deterministic and
// re-derivable from the same inputs.
//
// Update: "high" now needs at least 20 rows (matching the small-sample
// warning in the limitations) and a strong contributor whose row-to-row
// consistency is at least 0.6.

import type { Contributor } from "@/models/types";

export interface ConfidenceResult {
  confidence: "high" | "medium" | "low";
  confidenceReasons: string[];
}

const MIN_ROWS_HIGH = 20;
const MIN_ROWS_MEDIUM = 6;
const MIN_CONSISTENCY_HIGH = 0.6;

export function calculateConfidence(
  contributors: Contributor[],
  rowCount: number
): ConfidenceResult {
  const reasons: string[] = [];

  const strong = contributors.filter((c) => c.evidenceStrength === "high");
  const medium = contributors.filter((c) => c.evidenceStrength === "medium");
  const strongAndConsistent = strong.find(
    (c) => c.scoreBreakdown.consistency >= MIN_CONSISTENCY_HIGH
  );

  let confidence: "high" | "medium" | "low";

  if (strongAndConsistent && rowCount >= MIN_ROWS_HIGH) {
    confidence = "high";
    reasons.push(
      `At least one contributor (${strongAndConsistent.variableName}) showed a strong association that was consistent from row to row, across ${rowCount} data points.`
    );
  } else if ((strong.length >= 1 || medium.length >= 1) && rowCount >= MIN_ROWS_MEDIUM) {
    confidence = "medium";
    if (strong.length >= 1 && rowCount < MIN_ROWS_HIGH) {
      reasons.push(
        `A strong association was found, but with only ${rowCount} rows confidence is held at medium (at least ${MIN_ROWS_HIGH} rows are needed for high).`
      );
    } else if (strong.length >= 1 && !strongAndConsistent) {
      reasons.push(
        "A strong association was found, but it was not consistent from row to row, so confidence is held at medium."
      );
    } else {
      reasons.push(
        "Meaningful evidence was found, but the strength of the association leaves some uncertainty."
      );
    }
  } else {
    confidence = "low";
    reasons.push(
      "The available evidence is limited — either no contributor showed strong association, or there isn't enough data to be confident."
    );
  }

  if (rowCount < 10) {
    reasons.push(`Only ${rowCount} rows were available, which limits statistical reliability.`);
  }

  if (contributors.length === 0) {
    reasons.push("No candidate contributor columns were available to compare against.");
  }

  return { confidence, confidenceReasons: reasons };
}
