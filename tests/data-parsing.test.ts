// Stage 2 test — verifies CSV parsing and validation against the fixture file.

import { describe, it, expect } from "vitest";
import { promises as fs } from "fs";
import path from "path";
import { parseCsv } from "../core/data-engine/parser";
import { validateParseResult } from "../core/data-engine/validator";

describe("parser (Stage 2)", () => {
  it("parses the sample production CSV correctly", async () => {
    const filePath = path.join(process.cwd(), "tests/fixtures/sample-production.csv");
    const buffer = await fs.readFile(filePath);
    const result = parseCsv(buffer);

    expect(result.headers).toEqual([
      "date",
      "production_tons",
      "downtime_hours",
      "energy_kwh",
      "cost_usd",
    ]);
    expect(result.rowCount).toBe(14);
    expect(result.rows[0].production_tons).toBe(1200);
  });

  it("flags a file with no rows", () => {
    const result = validateParseResult({ rows: [], headers: [], rowCount: 0 });
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.type === "no_rows")).toBe(true);
  });

  it("validates a well-formed parse result", async () => {
    const filePath = path.join(process.cwd(), "tests/fixtures/sample-production.csv");
    const buffer = await fs.readFile(filePath);
    const parsed = parseCsv(buffer);
    const result = validateParseResult(parsed);

    expect(result.valid).toBe(true);
    expect(result.issues.length).toBe(0);
  });
});
