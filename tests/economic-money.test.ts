import { describe, it, expect } from "vitest";
import { currencyTagInName } from "@/core/data-engine/currencyTag";
import { calculateEconomicImpact } from "@/core/economic-engine/impactCalculator";
import type { Dataset, Finding } from "@/models/types";

describe("currency tag in column names", () => {
  it("reads real currency tags", () => {
    expect(currencyTagInName("Total Sales Value (NGN)")).toBe("NGN");
    expect(currencyTagInName("cost_usd")).toBe("USD");
    expect(currencyTagInName("Revenue NGN")).toBe("NGN");
  });
  it("ignores units and ordinary words", () => {
    expect(currencyTagInName("Quantity Sold (kg)")).toBeUndefined();
    expect(currencyTagInName("energy_kwh")).toBeUndefined();
    expect(currencyTagInName("Top Sales")).toBeUndefined();
    expect(currencyTagInName("Cost Per Cup")).toBeUndefined();
  });
});

const finding = (name: string): Finding => ({
  id: "f1",
  datasetId: "d1",
  type: "change",
  variablesInvolved: [name],
  period: { start: "a", end: "b" },
  magnitude: 1,
  rankScore: 1,
  description: "",
});
const dataset = {
  id: "d1", filename: "t.csv", uploadedAt: "", rowCount: 4, columns: [],
} as unknown as Dataset;

describe("economic impact", () => {
  it("a money column uses its own change: (200-100) x 2 rows = 200 NGN", () => {
    const rows = [100, 100, 200, 200].map((v) => ({ "Revenue (NGN)": v }));
    const r = calculateEconomicImpact({
      finding: finding("Revenue (NGN)"),
      dataset,
      rows,
      providedInputs: {},
    });
    expect(r.result).toBeCloseTo(200, 5);
    expect(r.currency).toBe("NGN");
  });

  it("a quantity column multiplies by value per unit: 10 x 2 rows x 50 = 1000", () => {
    const rows = [10, 10, 20, 20].map((v) => ({ "Quantity (kg)": v }));
    const r = calculateEconomicImpact({
      finding: finding("Quantity (kg)"),
      dataset,
      rows,
      providedInputs: { valuePerUnit: 50 },
      currency: "NGN",
    });
    expect(r.result).toBeCloseTo(1000, 5);
    expect(r.currency).toBe("NGN");
  });

  it("a quantity column without a value per unit is not calculated", () => {
    const rows = [10, 10, 20, 20].map((v) => ({ "Quantity (kg)": v }));
    const r = calculateEconomicImpact({
      finding: finding("Quantity (kg)"),
      dataset,
      rows,
      providedInputs: {},
    });
    expect(r.result).toBeNull();
  });
});
