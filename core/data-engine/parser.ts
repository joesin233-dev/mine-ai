// MINE AI V0.1 — Data Engine: Parser
// Stage 2: turns a raw uploaded file (CSV or XLSX) into a plain array of
// row objects. This is the ONLY module that touches papaparse/xlsx directly.
// No statistics, no interpretation — just structural conversion.

import Papa from "papaparse";
import * as XLSX from "xlsx";

export type RawRow = Record<string, string | number | null>;

export interface ParseResult {
  rows: RawRow[];
  headers: string[];
  rowCount: number;
}

/**
 * Parses a CSV file buffer into rows. Assumes the first row is the header.
 */
export function parseCsv(buffer: Buffer): ParseResult {
  const text = buffer.toString("utf-8");
  const result = Papa.parse<RawRow>(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  });

  const headers = result.meta.fields ?? [];
  const rows = result.data;

  return {
    rows,
    headers,
    rowCount: rows.length,
  };
}

/**
 * Parses an XLSX file buffer, reading only the first sheet (V0.1 scope —
 * multi-sheet support is a later-version feature per the locked blueprint).
 */
export function parseXlsx(buffer: Buffer): ParseResult {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];

  const rows: RawRow[] = XLSX.utils.sheet_to_json(sheet, { defval: null });
  const headers = rows.length > 0 ? Object.keys(rows[0]) : [];

  return {
    rows,
    headers,
    rowCount: rows.length,
  };
}

/**
 * Entry point: picks the right parser based on file extension.
 */
export function parseFile(buffer: Buffer, extension: string): ParseResult {
  const ext = extension.toLowerCase();
  if (ext === "csv") return parseCsv(buffer);
  if (ext === "xlsx" || ext === "xls") return parseXlsx(buffer);
  throw new Error(`Unsupported file extension: .${extension}`);
}
