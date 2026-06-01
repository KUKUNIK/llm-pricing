export interface ModelPricing {
  id: string;
  vendor: string;
  family: string;
  inputUsdPerMillion: number;
  outputUsdPerMillion: number;
  cachedInputUsdPerMillion?: number;
  cacheWriteUsdPerMillion?: number;
  asOf: string;
  source?: string;
}

export interface CostInput {
  inputTokens: number;
  outputTokens: number;
  cachedInputTokens?: number;
  cacheWriteTokens?: number;
}

export interface CostBreakdown {
  modelId: string;
  inputTokens: number;
  outputTokens: number;
  cachedInputTokens: number;
  cacheWriteTokens: number;
  inputUsd: number;
  outputUsd: number;
  cachedInputUsd: number;
  cacheWriteUsd: number;
  totalUsd: number;
  pricing: ModelPricing;
}
