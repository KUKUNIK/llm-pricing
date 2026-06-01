import { describe, expect, it } from "vitest";
import { calculateCost, estimateTokens } from "../src/lib/calculator.js";
import { findByVendor, getPricing, listModels } from "../src/lib/catalog.js";

describe("catalog", () => {
  it("lists all models", () => {
    const all = listModels();
    expect(all.length).toBeGreaterThan(5);
    expect(all.every((m) => m.inputUsdPerMillion >= 0)).toBe(true);
    expect(all.every((m) => m.outputUsdPerMillion >= 0)).toBe(true);
  });

  it("finds by vendor", () => {
    const openai = findByVendor("openai");
    expect(openai.length).toBeGreaterThan(0);
    expect(openai.every((m) => m.vendor === "openai")).toBe(true);
  });

  it("returns null for unknown model", () => {
    expect(getPricing("does-not-exist")).toBeNull();
  });

  it("includes asOf and source for every entry", () => {
    for (const m of listModels()) {
      expect(m.asOf).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(m.source).toBeTruthy();
    }
  });
});

describe("calculateCost", () => {
  it("multiplies tokens by per-million rate", () => {
    const b = calculateCost("gpt-4o", {
      inputTokens: 1_000_000,
      outputTokens: 500_000,
    });
    expect(b.inputUsd).toBeCloseTo(2.5);
    expect(b.outputUsd).toBeCloseTo(5.0);
    expect(b.totalUsd).toBeCloseTo(7.5);
  });

  it("handles cached input and cache write tokens when supported", () => {
    const b = calculateCost("claude-3-5-sonnet", {
      inputTokens: 100_000,
      outputTokens: 50_000,
      cachedInputTokens: 200_000,
      cacheWriteTokens: 100_000,
    });
    expect(b.inputUsd).toBeCloseTo((100_000 * 3) / 1_000_000);
    expect(b.outputUsd).toBeCloseTo((50_000 * 15) / 1_000_000);
    expect(b.cachedInputUsd).toBeCloseTo((200_000 * 0.3) / 1_000_000);
    expect(b.cacheWriteUsd).toBeCloseTo((100_000 * 3.75) / 1_000_000);
    expect(b.totalUsd).toBeCloseTo(
      b.inputUsd + b.outputUsd + b.cachedInputUsd + b.cacheWriteUsd,
    );
  });

  it("ignores cache columns when model doesn't price them", () => {
    const b = calculateCost("gpt-4-turbo", {
      inputTokens: 1000,
      outputTokens: 1000,
      cachedInputTokens: 99999,
      cacheWriteTokens: 99999,
    });
    expect(b.cachedInputUsd).toBe(0);
    expect(b.cacheWriteUsd).toBe(0);
  });

  it("throws for unknown model", () => {
    expect(() =>
      calculateCost("totally-fake-model", { inputTokens: 1, outputTokens: 1 }),
    ).toThrow(/unknown model/);
  });

  it("accepts a custom pricing override", () => {
    const b = calculateCost(
      "my-private-model",
      { inputTokens: 1_000_000, outputTokens: 1_000_000 },
      {
        pricing: {
          id: "my-private-model",
          vendor: "self",
          family: "custom",
          inputUsdPerMillion: 1,
          outputUsdPerMillion: 2,
          asOf: "2026-01-01",
        },
      },
    );
    expect(b.inputUsd).toBe(1);
    expect(b.outputUsd).toBe(2);
    expect(b.totalUsd).toBe(3);
  });

  it("rejects negative tokens", () => {
    expect(() =>
      calculateCost("gpt-4o", { inputTokens: -1, outputTokens: 0 }),
    ).toThrow(/non-negative/);
  });
});

describe("estimateTokens", () => {
  it("roughly maps 4 chars per token", () => {
    expect(estimateTokens("a".repeat(4))).toBe(1);
    expect(estimateTokens("a".repeat(40))).toBe(10);
    expect(estimateTokens("")).toBe(0);
  });
});
