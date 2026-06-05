import { Command } from "commander";
import { calculateCost, estimateTokens } from "./lib/calculator.js";
import { getPricing, listModels } from "./lib/catalog.js";
import { fmtCurrency, toCsv } from "./lib/format.js";
import type { ModelPricing } from "./lib/types.js";

const VERSION = "0.2.0";

function fmtUsd(n: number): string {
  if (n === 0) return "$0";
  if (n < 0.0001) return `$${n.toExponential(2)}`;
  return `$${n.toFixed(6)}`;
}

async function main(): Promise<void> {
  const program = new Command();
  program
    .name("llm-cost")
    .description("Calculate LLM API costs from token counts or text length")
    .version(VERSION);

  program
    .command("list")
    .description("list all known models in the catalog")
    .option("--vendor <name>", "filter by vendor (openai | anthropic | google | xai)")
    .option("--format <fmt>", "output format: text | json | csv", "text")
    .action((opts: { vendor?: string; format: string }) => {
      const all = listModels();
      const filtered = opts.vendor
        ? all.filter((m) => m.vendor === opts.vendor)
        : all;
      const format = opts.format.toLowerCase();
      if (format === "csv") {
        process.stdout.write(toCsv(filtered));
        return;
      }
      if (format === "json") {
        process.stdout.write(`${JSON.stringify(filtered, null, 2)}\n`);
        return;
      }
      if (format !== "text") {
        process.stderr.write(
          `error: unknown format "${opts.format}". expected text | json | csv\n`,
        );
        process.exitCode = 1;
        return;
      }
      const rows = filtered.map((m) => ({
        id: m.id,
        vendor: m.vendor,
        input: `$${m.inputUsdPerMillion.toFixed(2)}`,
        output: `$${m.outputUsdPerMillion.toFixed(2)}`,
        cachedInput: m.cachedInputUsdPerMillion
          ? `$${m.cachedInputUsdPerMillion.toFixed(2)}`
          : "-",
      }));
      printTable(rows, ["id", "vendor", "input", "output", "cachedInput"]);
    });

  program
    .command("calc <model>")
    .description("calculate cost for a known model")
    .option("--input <n>", "input tokens", "0")
    .option("--output <n>", "output tokens", "0")
    .option("--cached <n>", "cached input tokens", "0")
    .option("--cache-write <n>", "cache write tokens", "0")
    .option("--text <string>", "input text to estimate token count from (overrides --input)")
    .option("--json", "emit machine-readable JSON")
    .option(
      "--currency <code>",
      "also show total in this currency (requires --rate). Display-only code, e.g. KRW",
    )
    .option(
      "--rate <n>",
      "units of --currency per 1 USD (no live FX bundled — provide your own rate)",
    )
    .action(
      (
        modelId: string,
        opts: {
          input: string;
          output: string;
          cached: string;
          cacheWrite: string;
          text?: string;
          json?: boolean;
          currency?: string;
          rate?: string;
        },
      ) => {
        if ((opts.currency && !opts.rate) || (opts.rate && !opts.currency)) {
          process.stderr.write(
            "error: --currency and --rate must be passed together\n",
          );
          process.exitCode = 2;
          return;
        }
        let currency: { code: string; rate: number } | undefined;
        if (opts.currency && opts.rate) {
          const rate = Number.parseFloat(opts.rate);
          if (!Number.isFinite(rate) || rate <= 0) {
            process.stderr.write(
              `error: --rate must be a positive number, got ${opts.rate}\n`,
            );
            process.exitCode = 2;
            return;
          }
          currency = { code: opts.currency, rate };
        }
        const inputTokens = opts.text
          ? estimateTokens(opts.text)
          : Number.parseInt(opts.input, 10);
        const breakdown = calculateCost(modelId, {
          inputTokens,
          outputTokens: Number.parseInt(opts.output, 10),
          cachedInputTokens: Number.parseInt(opts.cached, 10),
          cacheWriteTokens: Number.parseInt(opts.cacheWrite, 10),
        });
        if (opts.json) {
          const payload = currency
            ? {
                ...breakdown,
                currency: {
                  code: currency.code,
                  rate: currency.rate,
                  totalAmount: breakdown.totalUsd * currency.rate,
                },
              }
            : breakdown;
          process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
          return;
        }
        printBreakdown(breakdown, currency);
      },
    );

  program
    .command("compare <models...>")
    .description("compare the same workload across multiple models")
    .option("--input <n>", "input tokens", "0")
    .option("--output <n>", "output tokens", "0")
    .option("--cached <n>", "cached input tokens", "0")
    .option("--cache-write <n>", "cache write tokens", "0")
    .option("--text <string>", "input text to estimate token count from")
    .action(
      (
        models: string[],
        opts: {
          input: string;
          output: string;
          cached: string;
          cacheWrite: string;
          text?: string;
        },
      ) => {
        const inputTokens = opts.text
          ? estimateTokens(opts.text)
          : Number.parseInt(opts.input, 10);
        const rows = models.map((modelId) => {
          const pricing: ModelPricing | null = getPricing(modelId);
          if (!pricing) {
            return {
              model: modelId,
              total: "(unknown model)",
              input: "",
              output: "",
            };
          }
          const b = calculateCost(modelId, {
            inputTokens,
            outputTokens: Number.parseInt(opts.output, 10),
            cachedInputTokens: Number.parseInt(opts.cached, 10),
            cacheWriteTokens: Number.parseInt(opts.cacheWrite, 10),
          });
          return {
            model: modelId,
            input: fmtUsd(b.inputUsd + b.cachedInputUsd + b.cacheWriteUsd),
            output: fmtUsd(b.outputUsd),
            total: fmtUsd(b.totalUsd),
          };
        });
        printTable(rows, ["model", "input", "output", "total"]);
      },
    );

  try {
    await program.parseAsync(process.argv);
  } catch (err) {
    process.stderr.write(
      `error: ${err instanceof Error ? err.message : String(err)}\n`,
    );
    process.exitCode = 1;
  }
}

function printBreakdown(
  b: ReturnType<typeof calculateCost>,
  currency?: { code: string; rate: number },
): void {
  const lines: string[] = [];
  lines.push(`model:      ${b.modelId} (vendor: ${b.pricing.vendor})`);
  lines.push(`pricing:    input $${b.pricing.inputUsdPerMillion}/M  output $${b.pricing.outputUsdPerMillion}/M (as of ${b.pricing.asOf})`);
  lines.push(`tokens:     input ${b.inputTokens.toLocaleString()}  output ${b.outputTokens.toLocaleString()}  cached ${b.cachedInputTokens.toLocaleString()}  cache-write ${b.cacheWriteTokens.toLocaleString()}`);
  lines.push(`input:      ${fmtUsd(b.inputUsd)}`);
  if (b.cachedInputUsd) lines.push(`cached:     ${fmtUsd(b.cachedInputUsd)}`);
  if (b.cacheWriteUsd) lines.push(`cache-write: ${fmtUsd(b.cacheWriteUsd)}`);
  lines.push(`output:     ${fmtUsd(b.outputUsd)}`);
  lines.push(`total:      ${fmtUsd(b.totalUsd)}`);
  if (currency) {
    lines.push(
      `total ${currency.code}: ${fmtCurrency(b.totalUsd, { rate: currency.rate, symbol: currency.code })} (at ${currency.rate} ${currency.code}/USD)`,
    );
  }
  process.stdout.write(`${lines.join("\n")}\n`);
}

function printTable<T extends Record<string, string>>(
  rows: T[],
  columns: (keyof T)[],
): void {
  if (rows.length === 0) {
    process.stdout.write("(empty)\n");
    return;
  }
  const widths: Record<string, number> = {};
  for (const c of columns) {
    widths[c as string] = String(c).length;
    for (const row of rows) {
      const cell = row[c] ?? "";
      widths[c as string] = Math.max(widths[c as string] ?? 0, cell.length);
    }
  }
  const head = columns
    .map((c) => String(c).padEnd(widths[c as string] ?? 0))
    .join("  ");
  process.stdout.write(`${head}\n`);
  process.stdout.write(`${"-".repeat(head.length)}\n`);
  for (const row of rows) {
    const line = columns
      .map((c) => (row[c] ?? "").padEnd(widths[c as string] ?? 0))
      .join("  ");
    process.stdout.write(`${line}\n`);
  }
}

main();
