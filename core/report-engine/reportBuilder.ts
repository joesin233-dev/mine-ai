// MINE AI V0.1 — Report Engine: Report Builder
// Stage 10: assembles everything (finding, evidence, contributors,
// economic impact) into the final structured Report object, and renders
// it as a downloadable markdown document. Matches the locked report
// structure: Problem, What Changed, Evidence, Possible Contributors,
// Economic Impact, Confidence & Uncertainty, Recommended Next Investigation.

import type { Contributor, EconomicResult, EvidenceRecord, Finding, Report } from "@/models/types";
import { buildProblemStatement, buildWhatChanged } from "./findingsBuilder";
import { buildConfidenceSummary } from "./evidenceBuilder";
import { buildEconomicSummary } from "./economicBuilder";

export interface BuildReportInput {
  finding: Finding;
  evidence: EvidenceRecord;
  contributors: Contributor[];
  economicImpact: EconomicResult | null;
}

function buildRecommendedNextInvestigation(
  contributors: Contributor[],
  evidence: EvidenceRecord
): string {
  const topContributor = contributors.find((c) => c.evidenceStrength === "high") ?? contributors[0];

  if (!topContributor) {
    return "No strong contributor was identified. Consider collecting additional variables that might explain this finding, such as external or operational factors not present in this dataset.";
  }

  return `Validate whether ${topContributor.variableName} is genuinely connected to this finding through direct observation or operational records — this analysis shows association, not proof. ${evidence.limitations[evidence.limitations.length - 1] ?? ""}`;
}

export function buildReport(input: BuildReportInput): Report {
  const { finding, evidence, contributors, economicImpact } = input;

  return {
    analysisId: finding.id,
    problem: buildProblemStatement(finding),
    whatChanged: buildWhatChanged(finding),
    evidence,
    contributors,
    economicImpact,
    confidenceSummary: buildConfidenceSummary(evidence),
    recommendedNextInvestigation: buildRecommendedNextInvestigation(contributors, evidence),
    generatedAt: new Date().toISOString(),
  };
}

export function reportToMarkdown(report: Report): string {
  const lines: string[] = [];

  lines.push(`# MINE AI Report`);
  lines.push(``);
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push(``);
  lines.push(`## Problem`);
  lines.push(report.problem);
  lines.push(``);
  lines.push(`## What Changed`);
  lines.push(report.whatChanged);
  lines.push(``);
  lines.push(`## Evidence`);
  lines.push(`**Confidence:** ${report.evidence.confidence.toUpperCase()}`);
  lines.push(``);
  lines.push(`Calculations:`);
  for (const calc of report.evidence.calculations) {
    lines.push(`- ${calc.label}: ${calc.formula} = ${calc.result}`);
  }
  lines.push(``);
  if (report.evidence.supportingEvidence.length > 0) {
    lines.push(`Supporting evidence:`);
    for (const s of report.evidence.supportingEvidence) lines.push(`- ${s}`);
    lines.push(``);
  }
  if (report.evidence.contradictingEvidence.length > 0) {
    lines.push(`Contradicting evidence:`);
    for (const c of report.evidence.contradictingEvidence) lines.push(`- ${c}`);
    lines.push(``);
  }
  lines.push(`## Possible Contributors`);
  for (const c of report.contributors) {
    lines.push(`- **${c.variableName}** (${c.evidenceStrength} evidence): ${c.observedChange}`);
  }
  lines.push(``);
  lines.push(`## Economic Impact`);
  lines.push(buildEconomicSummary(report.economicImpact));
  lines.push(``);
  lines.push(`## Confidence & Uncertainty`);
  lines.push(report.confidenceSummary);
  lines.push(``);
  lines.push(`Limitations:`);
  for (const l of report.evidence.limitations) lines.push(`- ${l}`);
  lines.push(``);
  lines.push(`Alternative explanations:`);
  for (const a of report.evidence.alternativeExplanations) lines.push(`- ${a}`);
  lines.push(``);
  lines.push(`## Recommended Next Investigation`);
  lines.push(report.recommendedNextInvestigation);

  return lines.join("\n");
}
