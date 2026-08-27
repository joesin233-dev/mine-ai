// MINE AI V0.1 — Shared data models
// These types are the contract every engine communicates through.
// No engine may bypass these shapes.

export type ColumnType = "numeric" | "categorical" | "datetime" | "unknown";

export interface NumericStats {
  mean: number;
  median: number;
  min: number;
  max: number;
  stdDev: number;
  percentiles: Record<string, number>; // e.g. "p25", "p50", "p75", "p90"
}

export interface ColumnProfile {
  name: string;
  type: ColumnType;
  missingCount: number;
  duplicateFlag: boolean;
  stats?: NumericStats; // present only when type === "numeric"
  qualityIssues: string[];
}

export interface Dataset {
  id: string;
  filename: string;
  uploadedAt: string; // ISO timestamp
  rowCount: number;
  columns: ColumnProfile[];
}

export type ValueType = "observed" | "calculated" | "estimated";

export interface Finding {
  id: string;
  datasetId: string;
  type: "trend" | "anomaly" | "change" | "relationship";
  variablesInvolved: string[];
  period: { start: string; end: string };
  magnitude: number;
  rankScore: number;
  description: string;
}

export interface ContributorScoreBreakdown {
  magnitude: number;
  temporalAlignment: number;
  correlation: number;
  consistency: number;
  contradictingEvidence: number;
}

export interface Contributor {
  variableName: string;
  observedChange: string;
  evidenceStrength: "high" | "medium" | "low";
  scoreBreakdown: ContributorScoreBreakdown;
}

export interface EvidenceCalculation {
  label: string;
  formula: string;
  result: number;
}

export interface EvidenceRecord {
  findingId: string;
  dataUsed: string[];
  variablesUsed: string[];
  period: { start: string; end: string };
  calculations: EvidenceCalculation[];
  supportingEvidence: string[];
  contradictingEvidence: string[];
  alternativeExplanations: string[];
  confidence: "high" | "medium" | "low";
  confidenceReasons: string[];
  limitations: string[];
}

export interface EconomicResult {
  findingId: string;
  inputs: Record<string, number>;
  formula: string;
  result: number | null; // null when required inputs are missing
  currency: string;
  period: { start: string; end: string };
  valueType: ValueType;
  missingInputs?: string[];
}

export interface Report {
  analysisId: string;
  problem: string;
  whatChanged: string;
  evidence: EvidenceRecord;
  contributors: Contributor[];
  economicImpact: EconomicResult | null;
  confidenceSummary: string;
  recommendedNextInvestigation: string;
  generatedAt: string;
}
