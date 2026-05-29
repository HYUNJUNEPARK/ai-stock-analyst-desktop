# Stock GPT Working Rules

## Purpose

This workspace runs multi-agent stock analysis on top of Codex.

The execution model mirrors `stock-claude`, but the orchestration is implemented with `codex exec` jobs:

1. **Phase 1**: run `financial-analyst-kr` and `sector-researcher` in parallel
2. **Phase 2**: run `news-sentiment-analyst`, `price-analyst`, and `valuation-analyst` in parallel using Phase 1 outputs as context
3. run `invest-type-classifier` to synthesize investment type from all specialist outputs
4. run `aggressive-investment-strategist` for the final report
5. save the final report as JSON under `reports/{YYYYMMDD}/{company}/`

## Agent Team

| Agent | Phase | Responsibility |
| --- | --- | --- |
| `financial-analyst-kr` | 1 | Financial statement analysis: revenue, margins, PER, PBR, ROE, debt ratio, valuation |
| `sector-researcher` | 1 | Industry trend, peers, regulation, macro and structural context |
| `news-sentiment-analyst` | 2 | Recent 1-month news scan, bullish/bearish classification, sentiment read |
| `price-analyst` | 2 | Technical analysis: trend (MA), momentum (RSI, MACD), Bollinger Bands, volume, support/resistance, chart patterns |
| `valuation-analyst` | 2 | Securities firm target prices, proprietary fair value (conservative/base/optimistic scenarios), price-range action guide |
| `invest-type-classifier` | 3 | Investment type classification using all specialist outputs |
| `aggressive-investment-strategist` | 4 | Final investment call synthesized from all analyses including valuation and technical signals |

## Execution Rules

- Phase 1 must complete before Phase 2 starts. `financial-analyst-kr` and `sector-researcher` outputs are passed as context to `valuation-analyst`.
- Do not run Phase 1 and Phase 2 agents sequentially unless the user explicitly asks for single-agent mode.
- `invest-type-classifier` runs only after all Phase 1 and Phase 2 outputs are complete.
- `aggressive-investment-strategist` runs only after `invest-type-classifier` is complete.
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
