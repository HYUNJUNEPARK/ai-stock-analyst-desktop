# ai-stock-analytics

GPT/Claude 모델 기반 종목 분석 데스크탑 앱.
전문 분석 에이전트 팀이 병렬·순차 파이프라인으로 종목을 분석하고, 투자 유형 분류를 거쳐 최종 투자 리포트를 생성합니다.

**기술 스택**: Electron + React + TypeScript + electron-vite

---

## 에이전트 구성

총 7개의 전문 에이전트가 역할을 분담합니다.

| 에이전트 | 역할 |
|---------|------|
| `financial-analyst-kr` | 재무제표 분석 — 매출 추이, 영업이익률, PER, PBR, ROE, 부채비율 등 재무 건전성 등급 산출 |
| `sector-researcher` | 업종 리서치 — 글로벌 시장 흐름, 경쟁사 비교, 정책·규제 변화, 업종 전망 판정 |
| `news-sentiment-analyst` | 뉴스 감성 분석 — 최근 1개월 뉴스 수집, 호재·악재 분류, 시장 심리 판정 |
| `price-analyst` | 기술적 분석 — 이동평균선, RSI, MACD, 볼린저 밴드, 지지·저항선, 진입 가격대 제시 |
| `valuation-analyst` | 밸류에이션 분석 — 증권사 목표주가 수집, 적정주가(보수·기준·낙관 시나리오) 산출 |
| `invest-type-classifier` | 투자 유형 분류 — 5개 분석을 종합해 핵심 투자 아이디어·유형 도출 |
| `aggressive-investment-strategist` | 최종 투자 판단 — 매수·관망·매도 판정, 목표가·손절가·매수 추천가 산출 |

---

## 실행 순서

```
┌─ financial-analyst-kr ──┐
│                         ├──► valuation-analyst ──────────────┐
└─ sector-researcher ─────┘                                    │
                                                               ├──► invest-type-classifier ──► aggressive-investment-strategist
┌─ news-sentiment-analyst ─────────────────────────────────────┤
└─ price-analyst ──────────────────────────────────────────────┘
```

### Wave 1 — 4개 에이전트 병렬 실행

`financial-analyst-kr`, `sector-researcher`, `news-sentiment-analyst`, `price-analyst`가 동시에 실행됩니다.
각 에이전트는 독립적으로 웹 검색을 통해 데이터를 수집하고 분석합니다.

### Wave 1b — valuation-analyst 부분 순차 실행

`financial-analyst-kr` + `sector-researcher` 완료 후 `valuation-analyst`가 즉시 실행됩니다.
두 분석이 정리한 PER, PBR, ROE, 업종 멀티플 등을 재활용하여 수치 일관성을 보장합니다.
이때 `news-sentiment-analyst`, `price-analyst`는 아직 실행 중일 수 있으며 병렬로 진행됩니다.

### Wave 2 — Step 1: invest-type-classifier

5개 에이전트 결과가 모두 모인 뒤 실행됩니다. 6가지 투자 유형(실적 성장형, 저평가 가치형, 턴어라운드형, 모멘텀형, 고위험 테마형, 배당·방어형) 중 하나로 분류합니다.

### Wave 2 — Step 2: aggressive-investment-strategist

모든 분석과 투자 유형 분류 결과를 종합해 최종 투자 판단을 내립니다.
판정 기준 가중치: **재무 건전성 등급 > 업종 구조적 방향성 > 뉴스 심리** 순으로 적용합니다.

| 판정 | 조건 |
|-----|------|
| 적극 매수 | 재무 A~B + 뉴스 긍정 + 업종 긍정 |
| 분할 매수 | 재무 B 이상 + 나머지 신호 중 하나 이상 우호적 |
| 관망 | 재무 C 이하 또는 신호 혼재 |
| 비중 축소 | 재무 C~D + 업종 구조적 하락 |
| 매도 | 재무 D + 뉴스 부정 + 업종 부정 |

---

## Project Setup

### Install

```bash
$ npm install
```

### Development

```bash
$ npm run dev
```

### Build

```bash
# For windows
$ npm run build:win

# For macOS
$ npm run build:mac

# For Linux
$ npm run build:linux
```
