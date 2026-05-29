# Stock GPT Working Rules

## Purpose

This workspace runs multi-agent stock analysis on top of Codex.

The execution model mirrors `stock-claude`, but the orchestration is implemented with `codex exec` jobs:

1. run four specialist agents in parallel
2. collect their outputs
3. run `invest-type-classifier` to synthesize investment type from the four specialist outputs
4. run `aggressive-investment-strategist` for the final report
5. save the final report as JSON under `reports/{YYYYMMDD}/{company}/`

## Agent Team

| Agent | Responsibility |
| --- | --- |
| `financial-analyst-kr` | Financial statement analysis: revenue, margins, PER, PBR, ROE, debt ratio, valuation |
| `news-sentiment-analyst` | Recent 1-month news scan, bullish/bearish classification, sentiment read |
| `sector-researcher` | Industry trend, peers, regulation, macro and structural context |
| `price-analyst` | Technical analysis: trend (MA), momentum (RSI, MACD), Bollinger Bands, volume, support/resistance, chart patterns |
| `invest-type-classifier` | Investment type classification using all four specialist outputs |
| `aggressive-investment-strategist` | Final investment call synthesized from all analyses including technical signals |

## Execution Rules

- A stock analysis request must start with the four specialist agents in parallel.
- Do not run the four specialist agents sequentially unless the user explicitly asks for a single-agent mode.
- `invest-type-classifier` runs only after all four specialist outputs are complete.
- `aggressive-investment-strategist` runs only after `invest-type-classifier` is complete.
- Save the final report to `reports/{YYYYMMDD}/{company}/{company}.json`.
- Write all outputs in Korean.

## Project Layout

- `prompts/`: role prompts used by the orchestrator
- `scripts/analyze-stock.mjs`: Codex-based orchestration entrypoint
- `reports/`: final Markdown reports and optional intermediate artifacts

## Safety

- The generated content is for research support, not a guarantee of investment outcome.
- Prompts should ask the model to cite uncertainty and missing data explicitly.
