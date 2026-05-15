# Stock Analysis Project

## 에이전트 팀 구성

이 프로젝트에는 4개의 전문 에이전트가 있습니다:

| 에이전트 | 역할 |
|---------|------|
| `financial-analyst-kr` | 재무제표 분석 (매출, 이익률, PER, PBR, ROE, 부채비율 등) |
| `news-sentiment-analyst` | 최근 1개월 뉴스 호재/악재 분류 및 시장 심리 판단 |
| `sector-researcher` | 업종 글로벌 동향, 경쟁사, 규제 환경 분석 |
| `aggressive-investment-strategist` | 위 세 분석을 종합한 최종 투자 판단 |

---

## 종목 분석 요청 시 실행 규칙

사용자가 종목 분석을 요청하면 **반드시 아래 순서**로 에이전트 팀을 운영합니다.

### Step 1 — 3개 에이전트 병렬 실행

`financial-analyst-kr`, `news-sentiment-analyst`, `sector-researcher` 를 **단일 메시지에서 동시에** 실행합니다. 절대 순차 실행하지 않습니다.

```
Agent(financial-analyst-kr)  ──┐
Agent(news-sentiment-analyst) ──┼──▶ 병렬 실행
Agent(sector-researcher)     ──┘
```

### Step 2 — 종합 리포트 작성

세 에이전트의 결과가 모두 반환되면, `aggressive-investment-strategist` 에이전트를 실행하여 최종 투자 판단 리포트를 작성합니다. 세 분석 결과 전문을 프롬프트에 포함해서 전달합니다.

### Step 3 — MD 파일 저장

최종 리포트를 `reports/{ticker}_{YYYYMMDD}.md` 경로에 저장합니다.

---

## 트리거 조건

다음 요청은 모두 에이전트 팀 전체 실행으로 처리합니다:

- "XXX 분석해줘"
- "XXX 투자할 만해?"
- "XXX 종합 분석"
- "XXX 리포트 만들어줘"

단일 분석만 요청하는 경우(예: "XXX 뉴스만 봐줘")는 해당 에이전트만 실행합니다.

---

## 출력 언어

모든 분석 결과와 응답은 **한국어**로 작성합니다.
