# Stock GPT Working Rules

## Purpose

This workspace runs multi-agent stock analysis on top of Codex.

The execution model mirrors `stock-claude`, but the orchestration is implemented with `codex exec` jobs:

1. **Wave 1**: run `financial-analyst-kr`, `sector-researcher`, `news-sentiment-analyst`, `price-analyst`, and `valuation-analyst` in parallel (all 5 are independent and do not depend on each other)
2. **Wave 2 – Step 1**: run `invest-type-classifier` using all Wave 1 outputs as context
3. **Wave 2 – Step 2**: run `aggressive-investment-strategist` using all Wave 1 outputs and `invest-type-classifier` output as context
4. save the final report as JSON under `reports/{YYYYMMDD}/{company}/`

## Agent Team

| Agent | Wave | Responsibility |
| --- | --- | --- |
| `financial-analyst-kr` | Wave 1 (parallel) | Financial statement analysis: revenue, margins, PER, PBR, ROE, debt ratio, valuation |
| `sector-researcher` | Wave 1 (parallel) | Industry trend, peers, regulation, macro and structural context |
| `news-sentiment-analyst` | Wave 1 (parallel) | Recent 1-month news scan, bullish/bearish classification, sentiment read |
| `price-analyst` | Wave 1 (parallel) | Technical analysis: trend (MA), momentum (RSI, MACD), Bollinger Bands, volume, support/resistance, chart patterns |
| `valuation-analyst` | Wave 1 (parallel) | Securities firm target prices, proprietary fair value (conservative/base/optimistic scenarios), price-range action guide |
| `invest-type-classifier` | Wave 2 – Step 1 | Investment type classification using all Wave 1 outputs |
| `aggressive-investment-strategist` | Wave 2 – Step 2 | Final investment call synthesized from all analyses including valuation and technical signals |

## Execution Rules

- All 5 Wave 1 agents run in parallel via `Promise.allSettled`. They are fully independent.
- `invest-type-classifier` runs only after all Wave 1 outputs are complete. It receives all 5 Wave 1 results as context.
- `aggressive-investment-strategist` runs only after `invest-type-classifier` is complete. It receives all Wave 1 results and the classifier output.
- If `financial-analyst-kr` fails, execution logs a warning and continues (financial data will be absent from downstream agents).
- If `valuation-analyst` fails, continue with remaining agents and log a warning. It is non-critical.
- Save the final report to `reports/{YYYYMMDD}/{company}/{company}.json`.
- Write all outputs in Korean.

## Project Layout

- `prompts/`: role prompts used by the orchestrator
- `scripts/analyze-stock.mjs`: Codex-based orchestration entrypoint
- `reports/`: final Markdown reports and optional intermediate artifacts

## Safety

- The generated content is for research support, not a guarantee of investment outcome.
- Prompts should ask the model to cite uncertainty and missing data explicitly.
