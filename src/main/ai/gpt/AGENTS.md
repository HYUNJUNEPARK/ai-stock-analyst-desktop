# Stock GPT Working Rules

## Purpose

This workspace runs multi-agent stock analysis on top of Codex.

The execution model mirrors `stock-claude`, but the orchestration is implemented with `codex exec` jobs:

1. run three specialist agents in parallel
2. collect their outputs
3. run one strategist agent for the final report
4. save the final report as Markdown under `reports/`

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
- The strategist runs only after all three specialist outputs are complete.
- Save the final report to `reports/{identifier}_{YYYYMMDD}.md`.
- Write all outputs in Korean.

## Project Layout

- `prompts/`: role prompts used by the orchestrator
- `scripts/analyze-stock.mjs`: Codex-based orchestration entrypoint
- `reports/`: final Markdown reports and optional intermediate artifacts

## Safety

- The generated content is for research support, not a guarantee of investment outcome.
- Prompts should ask the model to cite uncertainty and missing data explicitly.
