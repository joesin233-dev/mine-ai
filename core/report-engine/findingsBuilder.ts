// MINE AI V0.1 — Report Engine: Findings Builder
// Stage 10: turns a Finding into the plain-language "Problem" and
// "What Changed" sections of the report.

import type { Finding } from "@/models/types";

export function buildProblemStatement(finding: Finding): string {
  const variables = finding.variablesInvolved.join(", ");
  return `This report investigates a ${finding.type} detected in ${variables}, covering the period from ${finding.period.start || "the start of the data"} to ${finding.period.end || "the end of the data"}.`;
}

export function buildWhatChanged(finding: Finding): string {
  return finding.description;
}
