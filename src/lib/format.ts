import type { ModelPricing } from "./types.js";

const CSV_COLUMNS = [
  "id",
  "vendor",
  "family",
  "inputUsdPerMillion",
  "outputUsdPerMillion",
  "cachedInputUsdPerMillion",
  "cacheWriteUsdPerMillion",
  "asOf",
  "source",
] as const;

export type CsvColumn = (typeof CSV_COLUMNS)[number];

export interface ToCsvOptions {
  columns?: readonly CsvColumn[];
  header?: boolean;
}

export function toCsv(
  models: readonly ModelPricing[],
  options: ToCsvOptions = {},
): string {
  const columns = options.columns ?? CSV_COLUMNS;
  const includeHeader = options.header ?? true;
  const lines: string[] = [];
  if (includeHeader) {
    lines.push(columns.map(escapeCsvCell).join(","));
  }
  for (const m of models) {
    const row = columns.map((c) => {
      const raw = m[c];
      if (raw === undefined || raw === null) return "";
      return escapeCsvCell(String(raw));
    });
    lines.push(row.join(","));
  }
  // RFC 4180 line terminator is CRLF; many tools accept LF, but spreadsheets
  // are more reliable with CRLF. Use CRLF to match the spec.
  return `${lines.join("\r\n")}\r\n`;
}

function escapeCsvCell(value: string): string {
  if (value === "") return "";
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
