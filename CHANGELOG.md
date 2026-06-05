# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning: [SemVer](https://semver.org/).

## [Unreleased]

### Added

- `llm-cost calc --currency <code> --rate <n>` shows the breakdown
  total in a second currency at a user-supplied USD-relative rate.
  The package still bundles no live FX data.
- Library: `fmtCurrency(usd, { rate, symbol?, fractionDigits? })` and
  the `CurrencyOptions` type exported from `lib/format.js`.
- JSON output of `calc` gains a `currency: { code, rate, totalAmount }`
  field when both flags are supplied.

## [0.2.0] - 2026-06-03

### Added

- `toCsv(models, options?)` library export — emit the catalog (or any
  subset) as RFC 4180 CSV (CRLF line endings, header row, escaped cells).
- `llm-cost list --format <text|json|csv>` CLI flag. `csv` is suitable for
  piping into spreadsheets or `csvkit`; `json` was already accepted on
  `calc` and is now also available on `list`.
- `CsvColumn` / `ToCsvOptions` types for picking custom column subsets.

### Changed

- CLI version string bumped to `0.2.0`. No breaking changes to the
  library API — `0.1.0` callers continue to work.

## [0.1.0] - 2026-06-01

### Added

- Initial release.
- Pricing catalog snapshot tagged `asOf: 2026-01-15` covering:
  - **OpenAI**: gpt-4o, gpt-4o-mini, gpt-4-turbo, o1, o1-mini
  - **Anthropic**: claude-3-5-sonnet, claude-3-5-haiku, claude-3-opus, claude-3-haiku
  - **Google**: gemini-1.5-pro, gemini-1.5-flash, gemini-2.0-flash
  - **xAI**: grok-2
- `calculateCost(modelId, { inputTokens, outputTokens, cachedInputTokens?, cacheWriteTokens? })` returning a structured breakdown.
- `estimateTokens(text)` — rough char-to-token heuristic for back-of-envelope numbers.
- `llm-cost` CLI: `list`, `calc`, `compare` subcommands.
- Custom pricing override for unlisted models.

### Notes

- Prices are a frozen snapshot. They are not fetched live and will drift from vendor pages over time.
- Cached input pricing is included where the vendor publishes a distinct rate (OpenAI, Anthropic).
