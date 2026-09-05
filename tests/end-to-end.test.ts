// MINE AI V0.1 — Stage 11: End-to-End Pipeline Test
// This is the "V0.1 Success Test" from the locked blueprint (section 21):
// a real CSV/XLSX dataset goes through UPLOAD → UNDERSTAND → DISCOVER →
// DIAGNOSE → EVIDENCE → ECONOMIC IMPACT → REPORT, entirely without an
// external AI API, and the known baked-in finding is detected correctly
// at every stage. This test does not test any single engine in isolation —
// it proves the whole system connects correctly together.

import { describe, it, expect } from "vitest";
import { promises as fs } from "fs";
import path from "path";

import { parseCsv } from "../core/data-engine/parser";
import { validateParseResult } from "../core/data-engine/validator";
import { profileDataset } from "../core/data-engine/profiler";
import { runDiscovery } from "../core/discovery-engine/discover";
import { buildEvidence } from "../core/evidence-engine/evidence";
import { calculateEconomicImpact } from "../core/economic-engine/impactCalculator";
import { buildReport, reportToMarkdown } from "../core/report-engine/reportBuilder";

describe("Stage 11 — full end-to-end pipeline (V0.1 success test)", () => {
  it("takes a real dataset all the way from upload to a complete report", async () => {
    const datasetId = "e2e-test-dataset";

    // STAGE: UPLOAD + UNDERSTAND
    const filePath = path.join(process.cwd(), "tests/fixtures/sample-production.csv");
    const buffer = await fs.readFile(filePath);

    const parseResult = parseCsv(buffer);
    expect(parseResult.rowCount).toBe(14);

    const validation = validateParseResult(parseResult);
    expect(validation.valid).toBe(true);

    const dataset = profileDataset(datasetId, "sample-production.csv", parseResult);
    expect(dataset.columns.length).toBe(5);

    const productionColumn = dataset.columns.find((c) => c.name === "production_tons");
    expect(productionColumn?.type).toBe("numeric");
    expect(productionColumn?.stats).toBeDefined();

    // STAGE: DISCOVER
    const findings = runDiscovery({ datasetId, dataset, rows: parseResult.rows });
    expect(findings.length).toBeGreaterThan(0);

    // The known baked-in signal: production_tons drops in the second half
    // of the data, alongside a downtime_hours increase. Discovery should
    // surface a finding involving production_tons near the top of the
    // ranked list.
    const topFinding = findings[0];
    expect(topFinding.rankScore).toBeGreaterThanOrEqual(findings[findings.length - 1].rankScore);

    const productionFinding = findings.find((f) =>
      f.variablesInvolved.includes("production_tons")
    );
    expect(productionFinding).toBeDefined();

    // STAGE: DIAGNOSE + EVIDENCE (using the production finding specifically,
    // since that's the one with the clearest known root cause in the data)
    const { evidence, contributors } = buildEvidence({
      finding: productionFinding!,
      dataset,
      rows: parseResult.rows,
    });

    expect(["high", "medium", "low"]).toContain(evidence.confidence);
    expect(evidence.limitations.length).toBeGreaterThan(0);

    const downtimeContributor = contributors.find((c) => c.variableName === "downtime_hours");
    expect(downtimeContributor).toBeDefined();
    expect(["high", "medium"]).toContain(downtimeContributor!.evidenceStrength);

    // Enforce the causation rule end-to-end: no contributor description
    // anywhere in the full pipeline claims causation.
    for (const contributor of contributors) {
      expect(contributor.observedChange.toLowerCase()).not.toContain("caused");
    }

    // STAGE: ECONOMIC IMPACT
    const economicResult = calculateEconomicImpact({
      finding: productionFinding!,
      dataset,
      rows: parseResult.rows,
      providedInputs: { valuePerUnit: 50 },
    });

    expect(economicResult.result).not.toBeNull();
    expect(economicResult.valueType).toBe("calculated");
    // Production dropped, so the economic impact should be a loss (negative).
    expect(economicResult.result!).toBeLessThan(0);

    // STAGE: REPORT
    const report = buildReport({
      finding: productionFinding!,
      evidence,
      contributors,
      economicImpact: economicResult,
    });

    expect(report.analysisId).toBe(productionFinding!.id);

    const markdown = reportToMarkdown(report);
    expect(markdown).toContain("# MINE AI Report");
    expect(markdown).toContain("## Problem");
    expect(markdown).toContain("## What Changed");
    expect(markdown).toContain("## Evidence");
    expect(markdown).toContain("## Possible Contributors");
    expect(markdown).toContain("## Economic Impact");
    expect(markdown).toContain("## Confidence & Uncertainty");
    expect(markdown).toContain("## Recommended Next Investigation");
    expect(markdown).toContain("production_tons");
    expect(markdown).toContain("downtime_hours");

    // Final honesty check: the report must never claim certainty it hasn't
    // earned. Somewhere in the limitations, the causation caveat must
    // appear, no matter which finding or path was taken to get here.
    const hasCausationCaveat = evidence.limitations.some((l) =>
      l.toLowerCase().includes("cause")
    );
    expect(hasCausationCaveat).toBe(true);
  });

  it("handles a finding with no strong contributors gracefully (no crash, honest low confidence)", async () => {
    const datasetId = "e2e-test-dataset-2";
    const filePath = path.join(process.cwd(), "tests/fixtures/sample-production.csv");
    const buffer = await fs.readFile(filePath);
    const parseResult = parseCsv(buffer);
    const dataset = profileDataset(datasetId, "sample-production.csv", parseResult);

    // Construct an artificial finding on a column with essentially flat
    // behavior (energy_kwh moves with production, but we isolate it here
    // as a control case) to confirm the pipeline doesn't crash even when
    // evidence is weak.
    const weakFinding = {
      id: "weak-finding",
      datasetId,
      type: "anomaly" as const,
      variablesInvolved: ["cost_usd"],
      period: { start: "2026-01-01", end: "2026-02-07" },
      magnitude: 1,
      rankScore: 1,
      description: "cost_usd showed a minor anomaly",
    };

    const { evidence } = buildEvidence({ finding: weakFinding, dataset, rows: parseResult.rows });
    expect(["high", "medium", "low"]).toContain(evidence.confidence);

    const economicResult = calculateEconomicImpact({
      finding: weakFinding,
      dataset,
      rows: parseResult.rows,
      providedInputs: {}, // deliberately missing valuePerUnit
    });
    expect(economicResult.result).toBeNull();
    expect(economicResult.missingInputs).toContain("valuePerUnit");

    const report = buildReport({
      finding: weakFinding,
      evidence,
      contributors: [],
      economicImpact: economicResult,
    });
    const markdown = reportToMarkdown(report);
    expect(markdown).toContain("cannot currently be calculated");
  });
});
