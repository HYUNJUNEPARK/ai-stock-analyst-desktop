# Stock GPT Working Rules

## Purpose

This workspace runs multi-agent stock analysis on top of Codex.

The execution model mirrors `stock-claude`, but the orchestration is implemented with `codex exec` jobs:

1. **Wave 1** (4 agents in parallel):
   - Chain A: `financial-analyst-kr` and `sector-researcher` run in parallel
   - Chain B: `news-sentiment-analyst` and `price-analyst` run in parallel
2. **Wave 1b**: `valuation-analyst` runs as soon as Chain A completes, receiving `financial-analyst-kr` and `sector-researcher` outputs as context. Chain B may still be running in parallel.
3. **Wave 2 – Step 1**: `invest-type-classifier` runs after Wave 1b completes, using all 5 specialist outputs as context
4. **Wave 2 – Step 2**: `aggressive-investment-strategist` runs after `invest-type-classifier`, using all prior outputs as context
5. save the final report as JSON under `reports/{YYYYMMDD}/{company}/`

## Agent Team

| Agent | Wave | Responsibility |
| --- | --- | --- |
| `financial-analyst-kr` | Wave 1 – Chain A (parallel) | Financial statement analysis: revenue, margins, PER, PBR, ROE, debt ratio, valuation |
| `sector-researcher` | Wave 1 – Chain A (parallel) | Industry trend, peers, regulation, macro and structural context |
| `news-sentiment-analyst` | Wave 1 – Chain B (parallel) | Recent 1-month news scan, bullish/bearish classification, sentiment read |
| `price-analyst` | Wave 1 – Chain B (parallel) | Technical analysis: trend (MA), momentum (RSI, MACD), Bollinger Bands, volume, support/resistance, chart patterns |
| `valuation-analyst` | Wave 1b (sequential) | Securities firm target prices, proprietary fair value (conservative/base/optimistic scenarios), price-range action guide. Receives financial and sector analysis as context. |
| `invest-type-classifier` | Wave 2 – Step 1 | Investment type classification using all 5 specialist outputs |
| `aggressive-investment-strategist` | Wave 2 – Step 2 | Final investment call synthesized from all analyses including valuation and technical signals |

## Execution Rules

- Wave 1 runs 4 agents in parallel via `Promise.allSettled`: `financial-analyst-kr`, `sector-researcher`, `news-sentiment-analyst`, `price-analyst`.
- `valuation-analyst` runs after Chain A (`financial-analyst-kr` + `sector-researcher`) completes. It receives those two outputs as context and may run in parallel with Chain B (`news-sentiment-analyst` + `price-analyst`).
- `invest-type-classifier` runs only after `valuation-analyst` completes. It receives all 5 specialist outputs as context.
- `aggressive-investment-strategist` runs only after `invest-type-classifier` is complete.
- If `financial-analyst-kr` or `sector-researcher` fails, `valuation-analyst` continues with the available data and logs a warning.
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
