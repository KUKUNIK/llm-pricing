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

export interface CurrencyOptions {
  /** Number of `currency` units equal to 1 USD (e.g. `1320` for KRW). */
  rate: number;
  /** Display code shown beside the amount, e.g. `"KRW"`. */
  symbol?: string;
  /** Decimal places. Defaults to 2. */
  fractionDigits?: number;
}

/**
 * Format a USD amount into another currency using a user-supplied
 * exchange rate. This package intentionally bundles NO live FX data —
 * pass the rate you trust.
 */
export function fmtCurrency(usd: number, opts: CurrencyOptions): string {
  if (!Number.isFinite(opts.rate) || opts.rate <= 0) {
    throw new Error(`rate must be a positive finite number, got ${opts.rate}`);
  }
  const amount = usd * opts.rate;
  const digits = opts.fractionDigits ?? 2;
  const body = amount.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  return opts.symbol ? `${opts.symbol} ${body}` : body;
}

function escapeCsvCell(value: string): string {
  if (value === "") return "";
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
