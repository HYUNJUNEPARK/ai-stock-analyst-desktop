# Stock GPT Working Rules

## Purpose

This workspace runs multi-agent stock analysis on top of Codex.

The execution model mirrors `stock-claude`, but the orchestration is implemented with `codex exec` jobs:

1. **Wave 0** (sequential): `input-validator` → `price-fetcher` — validate the request and lock the reference price
2. **Wave 1** (4 agents in parallel):
   - Chain A: `financial-analyst-kr` and `sector-researcher` run in parallel
   - Chain B: `news-sentiment-analyst` and `price-analyst` run in parallel
3. **Wave 1b**: `valuation-analyst` runs as soon as Chain A completes, receiving `financial-analyst-kr` and `sector-researcher` outputs as context. Chain B may still be running in parallel.
4. **Wave 2 – Step 1**: `invest-type-classifier` runs after Wave 1b completes, using all 5 specialist outputs as context
5. **Wave 2 – Step 2**: `aggressive-investment-strategist` runs after `invest-type-classifier`, using all prior outputs as context
6. save the final report as JSON under `reports/{YYYYMMDD}/{company}/`

## Agent Team

| Agent | Wave | Responsibility |
| --- | --- | --- |
| `input-validator` | Wave 0 (sequential) | Validates the request and extracts company name/ticker. KR stocks: public data API (local symbol cache). US stocks: Finnhub API (/search). Fallback: AI validation. |
| `price-fetcher` | Wave 0 (sequential) | Locks the reference closing price. KR stocks: public data API (금융위원회_주식시세정보). US stocks: Finnhub API (/quote). Fallback: AI price lookup. |
| `financial-analyst-kr` | Wave 1 – Chain A (parallel) | Financial statement analysis: revenue, margins, PER, PBR, ROE, debt ratio, valuation |
| `sector-researcher` | Wave 1 – Chain A (parallel) | Industry trend, peers, regulation, macro and structural context |
| `news-sentiment-analyst` | Wave 1 – Chain B (parallel) | Recent 1-month news scan, bullish/bearish classification, sentiment read |
| `price-analyst` | Wave 1 – Chain B (parallel) | Technical analysis: trend (MA), momentum (RSI, MACD), Bollinger Bands, volume, support/resistance, chart patterns |
| `valuation-analyst` | Wave 1b (sequential) | Securities firm target prices, proprietary fair value (conservative/base/optimistic scenarios), price-range action guide. Receives financial and sector analysis as context. |
| `invest-type-classifier` | Wave 2 – Step 1 | Investment type classification using all 5 specialist outputs |
| `aggressive-investment-strategist` | Wave 2 – Step 2 | Final investment call synthesized from all analyses including valuation and technical signals |

## External APIs

Wave 0의 `input-validator`와 `price-fetcher`는 외부 API를 사용하여 AI 호출 없이 즉시 처리한다. API 조회 실패 시 AI fallback으로 자동 전환된다.

### 한국 종목 — 공공데이터포털 (data.go.kr)

| API | 용도 | 모듈 |
| --- | --- | --- |
| 금융위원회_KRX상장종목정보 | 종목명/코드 검증 + 자동완성 캐시 | `shared/local-symbols.mjs` |
| 금융위원회_주식시세정보 | 기준일 종가 조회 | `shared/stock-price.mjs` |
| 금융위원회_주식시세정보 | 250일치 일봉 조회 → 기술적 지표 사전 계산 | `shared/kr-stock-history.mjs` |

- 인증키: `.env` 또는 `.env.local`의 `DATA_GO_KR_SERVICE_KEY`

### 미국 종목 — Finnhub (finnhub.io) + FMP (financialmodelingprep.com)

| API | 용도 | 모듈 |
| --- | --- | --- |
| Finnhub /search | 종목 심볼 검색 + 자동완성 | `shared/finnhub.mjs` |
| Finnhub /quote | 실시간 시세 조회 | `shared/finnhub.mjs` |
| FMP /historical-price-eod/full | 일봉 히스토리 조회 → 기술적 지표 사전 계산 | `shared/us-stock-history.mjs` |

- Finnhub 인증키: `.env` 또는 `.env.local`의 `FINNHUB_API_KEY`
- FMP 인증키: `.env` 또는 `.env.local`의 `FMP_API_KEY`

### 공통

- API URL 상수: `shared/constants.mjs`
- API 공통 유틸: `shared/public-data-api.mjs`
- 기술적 지표 계산: `shared/technical-indicators.mjs` (SMA, RSI, MACD, 볼린저밴드, 거래량, 52주, 지지/저항)

## Execution Rules

- Wave 0 runs sequentially: `input-validator` validates the request, then `price-fetcher` locks the reference price (`CURRENT_PRICE`). KR stocks use the public data API, US stocks use Finnhub API, both falling back to AI on failure.
- Wave 1 runs 4 agents in parallel via `Promise.allSettled`: `financial-analyst-kr`, `sector-researcher`, `news-sentiment-analyst`, `price-analyst`. `price-analyst` receives pre-computed technical indicators (`TECHNICAL_DATA`) calculated from daily candle data — KR stocks via public data API (250 days), US stocks via FMP API (251 days) — eliminating "확인 불가" responses. If API fails, AI falls back to web search.
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
- `scripts/lib/`: orchestrator sub-modules (codex.mjs, utils.mjs)
- `reports/`: final Markdown reports and optional intermediate artifacts
- `../../shared/`: modules shared across AI models (constants, public data API, local symbols, stock price, finnhub, kr-stock-history, us-stock-history, technical-indicators)

## Safety

- The generated content is for research support, not a guarantee of investment outcome.
- Prompts should ask the model to cite uncertainty and missing data explicitly.
