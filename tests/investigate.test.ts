// Stage 5 test — verifies the investigation engine correctly targets a
// question at the right variable and time period in the fixture data.

import { describe, it, expect } from "vitest";
import { promises as fs } from "fs";
import path from "path";
import { parseCsv } from "../core/data-engine/parser";
import { profileDataset } from "../core/data-engine/profiler";
import { runInvestigation } from "../core/investigation-engine/investigate";

describe("investigation engine (Stage 5)", () => {
  it("answers a question about production dropping in February", async () => {
    const filePath = path.join(process.cwd(), "tests/fixtures/sample-production.csv");
    const buffer = await fs.readFile(filePath);
    const parsed = parseCsv(buffer);
    const dataset = profileDataset("test-id", "sample-production.csv", parsed);

    const result = runInvestigation({
      datasetId: "test-id",
      dataset,
      rows: parsed.rows,
      question: "Why did production drop in February?",
    });

    expect(result.needsClarification).toBe(false);
    expect(result.finding).toBeDefined();
    expect(result.finding!.variablesInvolved).toContain("production_tons");
    expect(result.finding!.magnitude).toBeGreaterThan(8);
  });

  it("asks for clarification when no variable can be matched", async () => {
    const filePath = path.join(process.cwd(), "tests/fixtures/sample-production.csv");
    const buffer = await fs.readFile(filePath);
    const parsed = parseCsv(buffer);
    const dataset = profileDataset("test-id", "sample-production.csv", parsed);

    const result = runInvestigation({
      datasetId: "test-id",
      dataset,
      rows: parsed.rows,
      question: "What happened with the widget frobnication rate?",
    });

    expect(result.needsClarification).toBe(true);
    expect(result.clarificationMessage).toBeDefined();
  });

  it("falls back to first-half/second-half comparison with no month mentioned", async () => {
    const filePath = path.join(process.cwd(), "tests/fixtures/sample-production.csv");
    const buffer = await fs.readFile(filePath);
    const parsed = parseCsv(buffer);
    const dataset = profileDataset("test-id", "sample-production.csv", parsed);

    const result = runInvestigation({
      datasetId: "test-id",
      dataset,
      rows: parsed.rows,
      question: "Investigate downtime hours",
    });

    expect(result.needsClarification).toBe(false);
    expect(result.finding!.variablesInvolved).toContain("downtime_hours");
  });
});
