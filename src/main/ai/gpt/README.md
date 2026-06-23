# stock-gpt

전문 분석 에이전트 팀이 병렬·순차 파이프라인으로 종목을 분석하고, 투자 유형 분류를 거쳐 최종 투자 리포트를 생성합니다.

## 구조

- `AGENTS.md`: Codex 작업 규칙 (에이전트가 참조)
- `prompts/`: 역할별 프롬프트 템플릿
- `scripts/analyze-stock.mjs`: `codex exec` 기반 오케스트레이터
- `scripts/lib/`: 오케스트레이터 하위 모듈 (codex.mjs, utils.mjs)
- `reports/`: 최종 리포트 저장 경로
- `../../shared/`: AI 모델 공통 모듈 (공공데이터 API, Finnhub API, 종목 검증, 주가 조회, 일봉 히스토리, 기술적 지표 계산, 상수)

## 사용법

사전 조건:

- `codex login` 완료
- 웹 검색이 가능한 Codex 환경
- `.env` 또는 `.env.local`에 `DATA_GO_KR_SERVICE_KEY` 설정 (한국 종목 검증/주가 조회, 없으면 AI fallback)
- `.env` 또는 `.env.local`에 `FINNHUB_API_KEY` 설정 (미국 종목 검증/주가 조회, 없으면 AI fallback)

실행 예시:

```bash
node scripts/analyze-stock.mjs --company "삼성전자" --ticker "005930" --request "삼성전자 투자할 만해?"
```

또는:

```bash
node scripts/analyze-stock.mjs "하이브 352820 종합 분석 리포트 만들어줘"
```

드라이런:

```bash
node scripts/analyze-stock.mjs --company "삼성전자" --ticker "005930" --request "삼성전자 투자할 만해?" --dry-run
```

출력:

- 최종 리포트: `reports/{YYYYMMDD}/{company}/{company}.json`
- 중간 산출물: `reports/{YYYYMMDD}/{company}/`

---

## 에이전트 구성

총 9개의 전문 에이전트로 구성됩니다.

| 에이전트 | 역할 |
|---------|------|
| `input-validator` | 입력 검증 — 유효한 종목 요청인지 판단, 정식 기업명·티커 추출. 한국 종목: 공공데이터 API, 미국 종목: Finnhub API |
| `price-fetcher` | 기준 주가 확정 — 모든 에이전트가 사용할 기준 종가 조회. 한국 종목: 공공데이터 API, 미국 종목: Finnhub API |
| `financial-analyst-kr` | 재무제표 분석 — 매출 추이, 영업이익률, 순이익률, PER, PBR, ROE, 부채비율, 유동비율, 재무 건전성 등급 산출 |
| `sector-researcher` | 업종 리서치 — 글로벌 시장 흐름, 주요 경쟁사 실적 비교, 정책·규제 변화, 업종 전망 판정 |
| `news-sentiment-analyst` | 뉴스 감성 분석 — 최근 1개월 뉴스 수집, 호재·악재·미확인 분류, 시장 심리 판정 |
| `price-analyst` | 기술적 분석 — 이동평균선, RSI, MACD, 볼린저 밴드, 지지·저항선, 차트 패턴, 기술적 진입 가격대 제시 |
| `valuation-analyst` | 밸류에이션 분석 — 증권사 목표주가 수집, 자체 적정주가(보수·기준·낙관 시나리오), 가격대별 대응 전략 |
| `invest-type-classifier` | 투자 유형 분류 — 5개 분석을 종합해 핵심 투자 아이디어와 투자 유형 도출 |
| `aggressive-investment-strategist` | 최종 투자 판단 — 모든 분석을 종합해 매수·관망·매도 판정, 목표가·손절가·매수 추천가 산출 |

---

## 실행 순서

```
input-validator ──► price-fetcher ──┐
  (종목 검증)        (기준 주가)      │
                                     ▼
                    ┌─ financial-analyst-kr ──┐
                    │                         ├──► valuation-analyst ──────────────┐
                    └─ sector-researcher ─────┘    (financial + sector 결과 주입)   │
                                                                                    ├──► invest-type-classifier ──► aggressive-investment-strategist
                    ┌─ news-sentiment-analyst ──────────────────────────────────────┤
                    └─ price-analyst ───────────────────────────────────────────────┘
```

### Wave 0 — 입력 검증 + 기준 주가 확정 (순차)

`input-validator`가 사용자 입력을 검증하고 정식 기업명/티커를 추출합니다.
이어서 `price-fetcher`가 기준 종가(`CURRENT_PRICE`)를 확정합니다.
한국 종목은 공공데이터포털 API로, 미국 종목은 Finnhub API로 즉시 처리됩니다 (AI 호출 없음). API 실패 시 AI fallback으로 전환됩니다.

### Wave 1 — 4개 에이전트 병렬 실행

`financial-analyst-kr`, `sector-researcher`, `news-sentiment-analyst`, `price-analyst`가 동시에 실행됩니다.
한국 종목의 `price-analyst`는 실행 전에 공공데이터포털에서 250일치 일봉 데이터를 조회하여 이동평균, RSI, MACD, 볼린저밴드, 거래량, 52주 고/저, 지지/저항선을 사전 계산합니다 (`TECHNICAL_DATA`로 주입). AI는 이 수치를 그대로 사용하고 해석/판정만 담당합니다.
나머지 에이전트는 서로 독립적으로 웹 검색을 통해 데이터를 수집하고 분석합니다.

### Wave 1b — valuation-analyst 부분 순차 실행

Chain A(`financial-analyst-kr`, `sector-researcher`) 완료 후 `valuation-analyst`가 즉시 실행됩니다.
이때 Chain B(`news-sentiment-analyst`, `price-analyst`)는 아직 실행 중일 수 있으며, `valuation-analyst`와 병렬로 진행될 수 있습니다.
`financial-analyst-kr`과 `sector-researcher`의 결과를 컨텍스트로 받아 적정주가를 산출합니다.
두 분석이 이미 정리한 PER, PBR, ROE, 업종 멀티플 등을 재활용하므로 수치 일관성이 보장됩니다.

### Wave 2 – Step 1 — invest-type-classifier 실행

5개 에이전트의 결과가 모두 모인 뒤 실행됩니다.
"이 종목을 왜 사는가?"에 대한 핵심 투자 아이디어를 도출하고 아래 6가지 유형 중 하나로 분류합니다.

- 실적 성장형
- 저평가 가치형
- 턴어라운드형
- 모멘텀형
- 고위험 테마형
- 배당·방어형

### Wave 2 – Step 2 — aggressive-investment-strategist 실행

모든 분석과 투자 유형 분류 결과를 종합해 최종 투자 판단을 내립니다.
판정 기준 가중치: **재무 건전성 등급 > 업종 구조적 방향성 > 뉴스 심리** 순으로 적용합니다.

| 판정 | 이모지 | 조건 |
|-----|--------|------|
| 적극 매수 | 🟢 | 재무 A~B + 뉴스 긍정 + 업종 긍정 |
| 분할 매수 | 🔵 | 재무 B 이상 + 나머지 신호 중 하나 이상 우호적 |
| 관망 | 🟡 | 재무 C 이하 또는 신호 혼재 |
| 비중 축소 | 🟠 | 재무 C~D + 업종 구조적 하락 |
| 매도 | 🔴 | 재무 D + 뉴스 부정 + 업종 부정 |
