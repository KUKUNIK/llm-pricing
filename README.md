# llm-pricing

[![CI](https://github.com/KUKUNIK/llm-pricing/actions/workflows/ci.yml/badge.svg)](https://github.com/KUKUNIK/llm-pricing/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/llm-pricing.svg)](https://www.npmjs.com/package/llm-pricing)
[![license](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)

A tiny, dependency-light catalog of public per-token prices for popular LLMs, plus a cost calculator. No API calls, no API keys, no surprises.

> Status: `0.2.0` — prices change frequently. Always cross-check against the vendor's pricing page before billing on these numbers.

## What it is

Two things:

1. A **catalog** — a frozen snapshot of `input` / `output` / `cached input` / `cache write` prices for popular models from OpenAI, Anthropic, Google, and xAI, each tagged with an `asOf` date and a `source` URL.
2. A **calculator** — give it a model id and token counts, get back a cost breakdown.

That's the whole library. It is intentionally not:

- A tokenizer (use `tiktoken` / `@anthropic-ai/tokenizer` for real counts).
- A live price scraper (vendors don't expose machine-readable pricing endpoints).
- A billing / metering system.

It's a *calculator* you can plug into your own scripts, dashboards, or CI cost checks.

## Install

```bash
npm install llm-pricing
# or
pnpm add llm-pricing
```

CLI:

```bash
npm install -g llm-pricing
llm-cost --help
```

## Quick start

### Library

```ts
import { calculateCost, getPricing, listModels } from "llm-pricing";

const breakdown = calculateCost("claude-3-5-sonnet", {
  inputTokens: 12_000,
  outputTokens: 4_000,
  cachedInputTokens: 6_000,
});
console.log(breakdown.totalUsd);  // e.g. 0.0978
console.log(breakdown.pricing.asOf);  // e.g. "2026-01-15"

const all = listModels();
const pricing = getPricing("gpt-4o");
```

### CLI

```bash
llm-cost list
llm-cost list --vendor anthropic

llm-cost calc gpt-4o --input 12000 --output 4000

llm-cost compare gpt-4o claude-3-5-sonnet gemini-1.5-pro \
  --input 100000 --output 5000

# JSON for piping
llm-cost calc gpt-4o --input 1000 --output 200 --json | jq .totalUsd

# CSV for spreadsheets
llm-cost list --format csv > prices.csv
llm-cost list --vendor openai --format csv | column -ts,
```

### CSV export

`llm-cost list --format csv` emits an RFC 4180 CSV (CRLF line endings,
double-quoted cells where needed). Drop it straight into Google Sheets,
Excel, or `csvkit` for analysis. The same columns are available
programmatically via the `toCsv()` helper:

```ts
import { listModels, toCsv } from "llm-pricing";
import { writeFileSync } from "node:fs";

writeFileSync("prices.csv", toCsv(listModels()));

// Or pick a subset of columns:
writeFileSync(
  "prices-min.csv",
  toCsv(listModels(), { columns: ["id", "vendor", "inputUsdPerMillion", "outputUsdPerMillion"] }),
);
```

## Output example

```
$ llm-cost calc claude-3-5-sonnet --input 100000 --output 5000 --cached 50000
model:      claude-3-5-sonnet (vendor: anthropic)
pricing:    input $3/M  output $15/M (as of 2026-01-15)
tokens:     input 100,000  output 5,000  cached 50,000  cache-write 0
input:      $0.300000
cached:     $0.015000
output:     $0.075000
total:      $0.390000
```

## Custom pricing override

If a model isn't in the catalog (your private fine-tune, a new release, a self-hosted endpoint), pass a `pricing` object:

```ts
import { calculateCost } from "llm-pricing";

const breakdown = calculateCost(
  "internal-finetune",
  { inputTokens: 1000, outputTokens: 500 },
  {
    pricing: {
      id: "internal-finetune",
      vendor: "self",
      family: "custom",
      inputUsdPerMillion: 1.5,
      outputUsdPerMillion: 6,
      asOf: "2026-06-01",
    },
  },
);
```

## Prices are a snapshot, not a feed

Every entry in the catalog has:

- `asOf` — the date the snapshot was taken.
- `source` — the vendor pricing page URL.

When prices change, this package needs a release. PRs welcome. If you need always-current numbers, scrape the vendor pages on your side and use the calculator with `--pricing`.

## What's tracked

Per model:

- `inputUsdPerMillion` — standard input pricing.
- `outputUsdPerMillion` — standard output pricing.
- `cachedInputUsdPerMillion` — read-from-cache pricing where applicable.
- `cacheWriteUsdPerMillion` — write-to-cache premium where applicable.
- `vendor`, `family`, `asOf`, `source`.

What's **not** tracked (yet): batch API discounts, long-context tier surcharges, image / audio input pricing, embedding pricing, fine-tune training costs. PRs welcome.

## License

MIT
