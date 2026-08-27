// MINE AI V0.1 — Data Engine: Validator
// Stage 2: checks a parsed file for structural problems before it goes any
// further. This does NOT interpret the data (that's the profiler, Stage 3) —
// it only flags malformed input so bad files are rejected early and clearly.

import type { ParseResult } from "./parser";

export interface ValidationIssue {
  type: "no_rows" | "no_headers" | "duplicate_header" | "inconsistent_row_length" | "empty_header";
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

export function validateParseResult(result: ParseResult): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (result.rowCount === 0) {
    issues.push({
      type: "no_rows",
      message: "The file has no data rows.",
    });
  }

  if (result.headers.length === 0) {
    issues.push({
      type: "no_headers",
      message: "No column headers were found. The first row should contain column names.",
    });
  }

  const seen = new Set<string>();
  for (const header of result.headers) {
    if (!header || header.trim() === "") {
      issues.push({
        type: "empty_header",
        message: "One or more column headers are empty.",
      });
      continue;
    }
    if (seen.has(header)) {
      issues.push({
        type: "duplicate_header",
        message: `Column header "${header}" appears more than once.`,
      });
    }
    seen.add(header);
  }

  // Spot-check row shape consistency against the header count.
  const expectedKeys = result.headers.length;
  const inconsistentRows = result.rows.filter(
    (row) => Object.keys(row).length !== expectedKeys
  );
  if (inconsistentRows.length > 0) {
    issues.push({
      type: "inconsistent_row_length",
      message: `${inconsistentRows.length} row(s) have a different number of columns than the header.`,
    });
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}
