import { describe, expect, it } from "vitest";
import { fmtCurrency, toCsv } from "../src/lib/format.js";
import { listModels } from "../src/lib/catalog.js";
import type { ModelPricing } from "../src/lib/types.js";

const SAMPLE: ModelPricing[] = [
  {
    id: "alpha",
    vendor: "acme",
    family: "alpha",
    inputUsdPerMillion: 1.25,
    outputUsdPerMillion: 5,
    cachedInputUsdPerMillion: 0.5,
    asOf: "2026-01-01",
    source: "https://example.com/pricing",
  },
  {
    id: "beta-1",
    vendor: "acme",
    family: "beta",
    inputUsdPerMillion: 0,
    outputUsdPerMillion: 0,
    asOf: "2026-01-01",
  },
];

describe("toCsv", () => {
  it("emits a header row by default", () => {
    const csv = toCsv(SAMPLE);
    const firstLine = csv.split("\r\n")[0];
    expect(firstLine).toContain("id");
    expect(firstLine).toContain("vendor");
    expect(firstLine).toContain("cachedInputUsdPerMillion");
  });

  it("uses CRLF line endings (RFC 4180)", () => {
    const csv = toCsv(SAMPLE);
    expect(csv.endsWith("\r\n")).toBe(true);
    expect(csv.split("\r\n").length).toBe(SAMPLE.length + 2);
  });

  it("renders numeric and string columns", () => {
    const csv = toCsv(SAMPLE);
    expect(csv).toContain("alpha,acme,alpha,1.25,5,0.5,,2026-01-01,");
    expect(csv).toContain("beta-1,acme,beta,0,0,,,2026-01-01,");
  });

  it("escapes cells containing commas, quotes, or newlines", () => {
    const tricky: ModelPricing[] = [
      {
        id: "x",
        vendor: "acme, inc",
        family: 'has "quotes"',
        inputUsdPerMillion: 1,
        outputUsdPerMillion: 1,
        asOf: "2026-01-01",
        source: "line1\nline2",
      },
    ];
    const csv = toCsv(tricky, { header: false });
    expect(csv).toContain('"acme, inc"');
    expect(csv).toContain('"has ""quotes"""');
    expect(csv).toContain('"line1\nline2"');
  });

  it("respects header: false", () => {
    const csv = toCsv(SAMPLE, { header: false });
    expect(csv.startsWith("alpha,")).toBe(true);
  });

  it("respects custom column subset", () => {
    const csv = toCsv(SAMPLE, { columns: ["id", "outputUsdPerMillion"] });
    const lines = csv.split("\r\n");
    expect(lines[0]).toBe("id,outputUsdPerMillion");
    expect(lines[1]).toBe("alpha,5");
    expect(lines[2]).toBe("beta-1,0");
  });

  it("round-trips the full catalog without throwing", () => {
    const csv = toCsv(listModels());
    expect(csv.split("\r\n").length).toBeGreaterThan(listModels().length);
  });

  it("emits only a header for an empty catalog", () => {
    const csv = toCsv([]);
    expect(csv.split("\r\n").length).toBe(2);
  });
});

describe("fmtCurrency", () => {
  it("converts USD by a user-supplied rate and prefixes the symbol", () => {
    expect(fmtCurrency(0.005, { rate: 1320, symbol: "KRW" })).toBe("KRW 6.60");
    expect(fmtCurrency(1, { rate: 150, symbol: "JPY", fractionDigits: 0 })).toBe(
      "JPY 150",
    );
  });

  it("formats without a symbol when omitted", () => {
    expect(fmtCurrency(2, { rate: 0.92 })).toBe("1.84");
  });

  it("rejects non-positive or non-finite rates", () => {
    expect(() => fmtCurrency(1, { rate: 0 })).toThrow(/positive finite/);
    expect(() => fmtCurrency(1, { rate: -1 })).toThrow(/positive finite/);
    expect(() => fmtCurrency(1, { rate: Number.NaN })).toThrow(/positive finite/);
  });
});
