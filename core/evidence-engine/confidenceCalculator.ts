// MINE AI V0.1 — Evidence Engine: Confidence Calculator
// Stage 7: computes a transparent confidence level from the actual
// evidence gathered, and explains WHY that level was chosen. Confidence is
// never randomly assigned — every reason listed here is deterministic and
// re-derivable from the same inputs.

import type { Contributor } from "@/models/types";

export interface ConfidenceResult {
  confidence: "high" | "medium" | "low";
  confidenceReasons: string[];
}

export function calculateConfidence(
  contributors: Contributor[],
  rowCount: number
): ConfidenceResult {
  const reasons: string[] = [];

  const highStrengthCount = contributors.filter((c) => c.evidenceStrength === "high").length;
  const mediumStrengthCount = contributors.filter((c) => c.evidenceStrength === "medium").length;

  let confidence: "high" | "medium" | "low";

  if (highStrengthCount >= 1 && rowCount >= 10) {
    confidence = "high";
    reasons.push(
      `At least one contributor (${contributors.find((c) => c.evidenceStrength === "high")?.variableName}) showed strong, consistent evidence across ${rowCount} data points.`
    );
  } else if ((highStrengthCount >= 1 || mediumStrengthCount >= 1) && rowCount >= 6) {
    confidence = "medium";
    reasons.push(
      "Meaningful evidence was found, but either the sample size or the strength of the association leaves some uncertainty."
    );
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
