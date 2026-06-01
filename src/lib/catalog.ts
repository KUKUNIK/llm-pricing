import type { ModelPricing } from "./types.js";

const AS_OF = "2026-01-15";

const RAW: ModelPricing[] = [
  // OpenAI
  {
    id: "gpt-4o",
    vendor: "openai",
    family: "gpt-4o",
    inputUsdPerMillion: 2.5,
    outputUsdPerMillion: 10,
    cachedInputUsdPerMillion: 1.25,
    asOf: AS_OF,
    source: "https://openai.com/api/pricing/",
  },
  {
    id: "gpt-4o-mini",
    vendor: "openai",
    family: "gpt-4o",
    inputUsdPerMillion: 0.15,
    outputUsdPerMillion: 0.6,
    cachedInputUsdPerMillion: 0.075,
    asOf: AS_OF,
    source: "https://openai.com/api/pricing/",
  },
  {
    id: "gpt-4-turbo",
    vendor: "openai",
    family: "gpt-4",
    inputUsdPerMillion: 10,
    outputUsdPerMillion: 30,
    asOf: AS_OF,
    source: "https://openai.com/api/pricing/",
  },
  {
    id: "o1",
    vendor: "openai",
    family: "reasoning",
    inputUsdPerMillion: 15,
    outputUsdPerMillion: 60,
    cachedInputUsdPerMillion: 7.5,
    asOf: AS_OF,
    source: "https://openai.com/api/pricing/",
  },
  {
    id: "o1-mini",
    vendor: "openai",
    family: "reasoning",
    inputUsdPerMillion: 3,
    outputUsdPerMillion: 12,
    asOf: AS_OF,
    source: "https://openai.com/api/pricing/",
  },

  // Anthropic
  {
    id: "claude-3-5-sonnet",
    vendor: "anthropic",
    family: "claude-3.5",
    inputUsdPerMillion: 3,
    outputUsdPerMillion: 15,
    cachedInputUsdPerMillion: 0.3,
    cacheWriteUsdPerMillion: 3.75,
    asOf: AS_OF,
    source: "https://www.anthropic.com/pricing",
  },
  {
    id: "claude-3-5-haiku",
    vendor: "anthropic",
    family: "claude-3.5",
    inputUsdPerMillion: 0.8,
    outputUsdPerMillion: 4,
    cachedInputUsdPerMillion: 0.08,
    cacheWriteUsdPerMillion: 1,
    asOf: AS_OF,
    source: "https://www.anthropic.com/pricing",
  },
  {
    id: "claude-3-opus",
    vendor: "anthropic",
    family: "claude-3",
    inputUsdPerMillion: 15,
    outputUsdPerMillion: 75,
    cachedInputUsdPerMillion: 1.5,
    cacheWriteUsdPerMillion: 18.75,
    asOf: AS_OF,
    source: "https://www.anthropic.com/pricing",
  },
  {
    id: "claude-3-haiku",
    vendor: "anthropic",
    family: "claude-3",
    inputUsdPerMillion: 0.25,
    outputUsdPerMillion: 1.25,
    asOf: AS_OF,
    source: "https://www.anthropic.com/pricing",
  },

  // Google
  {
    id: "gemini-1.5-pro",
    vendor: "google",
    family: "gemini-1.5",
    inputUsdPerMillion: 1.25,
    outputUsdPerMillion: 5,
    asOf: AS_OF,
    source: "https://ai.google.dev/pricing",
  },
  {
    id: "gemini-1.5-flash",
    vendor: "google",
    family: "gemini-1.5",
    inputUsdPerMillion: 0.075,
    outputUsdPerMillion: 0.3,
    asOf: AS_OF,
    source: "https://ai.google.dev/pricing",
  },
  {
    id: "gemini-2.0-flash",
    vendor: "google",
    family: "gemini-2.0",
    inputUsdPerMillion: 0.1,
    outputUsdPerMillion: 0.4,
    asOf: AS_OF,
    source: "https://ai.google.dev/pricing",
  },

  // xAI
  {
    id: "grok-2",
    vendor: "xai",
    family: "grok",
    inputUsdPerMillion: 2,
    outputUsdPerMillion: 10,
    asOf: AS_OF,
    source: "https://docs.x.ai/docs#pricing",
  },
];

const BY_ID = new Map<string, ModelPricing>(RAW.map((m) => [m.id, m]));

export function listModels(): ModelPricing[] {
  return [...RAW];
}

export function getPricing(modelId: string): ModelPricing | null {
  return BY_ID.get(modelId) ?? null;
}

export function findByVendor(vendor: string): ModelPricing[] {
  return RAW.filter((m) => m.vendor === vendor);
}

export function findByFamily(family: string): ModelPricing[] {
  return RAW.filter((m) => m.family === family);
}
