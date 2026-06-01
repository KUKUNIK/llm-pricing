import { getPricing } from "./catalog.js";
import type { CostBreakdown, CostInput, ModelPricing } from "./types.js";

const PER_MILLION = 1_000_000;

export interface CalculateOptions {
  pricing?: ModelPricing;
}

export function calculateCost(
  modelId: string,
  input: CostInput,
  options: CalculateOptions = {},
): CostBreakdown {
  const pricing = options.pricing ?? getPricing(modelId);
  if (!pricing) {
    throw new Error(
      `unknown model "${modelId}". Pass a custom pricing object or use a known model id (see listModels()).`,
    );
  }

  const inputTokens = nonNegative(input.inputTokens, "inputTokens");
  const outputTokens = nonNegative(input.outputTokens, "outputTokens");
  const cachedInputTokens = nonNegative(
    input.cachedInputTokens ?? 0,
    "cachedInputTokens",
  );
  const cacheWriteTokens = nonNegative(
    input.cacheWriteTokens ?? 0,
    "cacheWriteTokens",
  );

  const inputUsd = (inputTokens * pricing.inputUsdPerMillion) / PER_MILLION;
  const outputUsd = (outputTokens * pricing.outputUsdPerMillion) / PER_MILLION;
  const cachedInputUsd =
    pricing.cachedInputUsdPerMillion !== undefined
      ? (cachedInputTokens * pricing.cachedInputUsdPerMillion) / PER_MILLION
      : 0;
  const cacheWriteUsd =
    pricing.cacheWriteUsdPerMillion !== undefined
      ? (cacheWriteTokens * pricing.cacheWriteUsdPerMillion) / PER_MILLION
      : 0;

  return {
    modelId: pricing.id,
    inputTokens,
    outputTokens,
    cachedInputTokens,
    cacheWriteTokens,
    inputUsd,
    outputUsd,
    cachedInputUsd,
    cacheWriteUsd,
    totalUsd: inputUsd + outputUsd + cachedInputUsd + cacheWriteUsd,
    pricing,
  };
}

function nonNegative(n: number, label: string): number {
  if (!Number.isFinite(n) || n < 0) {
    throw new Error(`${label} must be a non-negative finite number, got ${n}`);
  }
  return Math.floor(n);
}

/**
 * Rough char-to-token estimate. NOT a real tokenizer — useful for quick
 * back-of-envelope numbers only. For accurate counts use a vendor SDK
 * (tiktoken, @anthropic-ai/tokenizer, etc.).
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
