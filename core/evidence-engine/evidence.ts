// MINE AI V0.1 — Evidence Engine: Orchestrator
// Stage 7: the full pipeline — a Finding in, a complete auditable
// EvidenceRecord out. Runs diagnostics (Stage 6) internally, then wraps
// its output with evidence collection, confidence, and uncertainty.

import type { Dataset, Finding, EvidenceRecord, Contributor } from "@/models/types";
import { runDiagnostics } from "@/core/diagnostic-engine/diagnose";
import { collectEvidence } from "./evidenceCollector";
import { calculateConfidence } from "./confidenceCalculator";
import { analyzeUncertainty } from "./uncertaintyAnalyzer";

export interface BuildEvidenceInput {
  finding: Finding;
  dataset: Dataset;
  rows: Record<string, string | number | null>[];
}

export interface BuildEvidenceResult {
  contributors: Contributor[];
  evidence: EvidenceRecord;
}

export function buildEvidence(input: BuildEvidenceInput): BuildEvidenceResult {
  const { finding, dataset, rows } = input;

  const diagnostics = runDiagnostics({ finding, dataset, rows });
  const { contributors, alternativeExplanations } = diagnostics;

  const collected = collectEvidence(finding, contributors, dataset.filename);
  const { confidence, confidenceReasons } = calculateConfidence(contributors, rows.length);
  const limitations = analyzeUncertainty(rows.length, collected.variablesUsed.length);

  const evidence: EvidenceRecord = {
    findingId: finding.id,
    dataUsed: collected.dataUsed,
    variablesUsed: collected.variablesUsed,
    period: finding.period,
    calculations: collected.calculations,
    supportingEvidence: collected.supportingEvidence,
    contradictingEvidence: collected.contradictingEvidence,
    alternativeExplanations,
    confidence,
    confidenceReasons,
    limitations,
  };

  return { contributors, evidence };
}
