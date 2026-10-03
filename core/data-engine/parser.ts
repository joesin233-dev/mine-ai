// MINE AI V0.1 — Data Engine: Parser
// Stage 2: turns a raw uploaded file (CSV or XLSX) into a plain array of
// row objects. This is the ONLY module that touches papaparse/xlsx directly.
// No statistics, no interpretation — just structural conversion.
//
// Update: the parser now REMEMBERS the currency symbol it finds in the file
// (₦ $ £ € ₹ K) instead of throwing it away. It never converts currencies
// and never guesses: if the file has plain numbers, currencySymbol is
// left undefined.

import Papa from "papaparse";
import * as XLSX from "xlsx";

export type RawRow = Record<string, string | number | null>;

export interface ParseResult {
  rows: RawRow[];
  headers: string[];
  rowCount: number;
  currencySymbol?: string; // the file's own symbol, if it has one
}

const CURRENCY_SYMBOLS = /[₦$£€₹K]/gi;

type SymbolTally = Record<string, number>;

function addToTally(tally: SymbolTally, symbol: string): void {
  const key = symbol.toUpperCase() === "K" ? "K" : symbol;
  tally[key] = (tally[key] ?? 0) + 1;
}

function mostCommonSymbol(tally: SymbolTally): string | undefined {
  let best: string | undefined;
  let bestCount = 0;
  for (const symbol of Object.keys(tally)) {
    if (tally[symbol] > bestCount) {
      best = symbol;
      bestCount = tally[symbol];
    }
  }
  return best;
}

/**
 * If a raw cell value looks like a currency-formatted number (symbol,
 * thousands separators), strip the formatting so it can be parsed as a
 * plain number — and record which symbol was used.
 * Leaves genuinely non-numeric text untouched.
 */
function cleanCurrencyValue(value: unknown, tally: SymbolTally): unknown {
  if (typeof value !== "string") return value;

  const trimmed = value.trim();
  const looksLikeCurrency = /^[₦$£€₹K]?\s?-?[\d,]+(\.\d+)?$/i.test(trimmed);
  if (!looksLikeCurrency) return value;

  const symbolMatch = trimmed.match(/^[₦$£€₹K]/i);
  if (symbolMatch) addToTally(tally, symbolMatch[0]);

  return trimmed.replace(CURRENCY_SYMBOLS, "").replace(/,/g, "").trim();
}

/**
 * Excel often keeps the currency in the cell's number format (for example
 * "₦"#,##0 or [$₦-466]#,##0) and not in the value. This reads it from there.
 */
function symbolFromFormat(format: string): string | null {
  const bracket = format.match(/\[\$([^\]\-]+)(?:-[^\]]*)?\]/);
  if (bracket && bracket[1].trim()) return bracket[1].trim();

  const quoted = format.match(/"([^"]{1,3})"/);
  if (quoted && /^(?:[₦£€₹$]|K|[A-Za-z]{3})$/.test(quoted[1])) {
    return quoted[1];
  }

  const withoutBrackets = format.replace(/\[[^\]]*\]/g, "");
  const plain = withoutBrackets.match(/[₦£€₹$]/);
  return plain ? plain[0] : null;
}

/**
 * Parses a CSV file buffer into rows. Assumes the first row is the header.
 */
export function parseCsv(buffer: Buffer): ParseResult {
  const text = buffer.toString("utf-8");
  const tally: SymbolTally = {};
  const result = Papa.parse<RawRow>(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
    transform: (value) => cleanCurrencyValue(value, tally) as string,
  });

  const headers = result.meta.fields ?? [];
  const rows = result.data;

  return {
    rows,
    headers,
    rowCount: rows.length,
    currencySymbol: mostCommonSymbol(tally),
  };
}

/**
 * Parses an XLSX file buffer, reading only the first sheet (V0.1 scope —
 * multi-sheet support is a later-version feature per the locked blueprint).
 */
export function parseXlsx(buffer: Buffer): ParseResult {
  const workbook = XLSX.read(buffer, { type: "buffer", cellNF: true });
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];
  const tally: SymbolTally = {};

  // Look for currency symbols stored in the cells' number formats.
  for (const key of Object.keys(sheet)) {
    if (key.startsWith("!")) continue;
    const cell = sheet[key] as XLSX.CellObject;
    if (cell && cell.t === "n" && typeof cell.z === "string") {
      const symbol = symbolFromFormat(cell.z);
      if (symbol) addToTally(tally, symbol);
    }
  }

  const rawRows: RawRow[] = XLSX.utils.sheet_to_json(sheet, { defval: null });

  // Clean currency-formatted text values, then pick up numbers.
  const rows: RawRow[] = rawRows.map((row) => {
    const cleanedRow: RawRow = {};
    for (const key of Object.keys(row)) {
      const cleaned = cleanCurrencyValue(row[key], tally);
      const asNumber =
        typeof cleaned === "string" &&
        cleaned !== "" &&
        !Number.isNaN(Number(cleaned))
          ? Number(cleaned)
          : cleaned;
      cleanedRow[key] = asNumber as string | number | null;
    }
    return cleanedRow;
  });

  const headers = rows.length > 0 ? Object.keys(rows[0]) : [];

  return {
    rows,
    headers,
    rowCount: rows.length,
    currencySymbol: mostCommonSymbol(tally),
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
