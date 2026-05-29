# stock-gpt

2단계 병렬 파이프라인으로 전문 분석을 실행한 뒤, 투자 유형 분류를 거쳐 최종 투자 리포트를 생성합니다.

## 구조

- `AGENTS.md`: Codex 작업 규칙
- `prompts/`: 역할별 프롬프트 템플릿
- `scripts/analyze-stock.mjs`: `codex exec` 기반 오케스트레이터
- `reports/`: 최종 리포트 저장 경로

## 사용법

사전 조건:

- `codex login` 완료
- 웹 검색이 가능한 Codex 환경

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

## 동작 방식

1. **Phase 1** — 아래 두 역할을 **병렬** 실행합니다. (valuation-analyst 입력 데이터 생성)
   - `financial-analyst-kr`
   - `sector-researcher`

2. **Phase 2** — Phase 1 결과를 컨텍스트로 받아 아래 세 역할을 **병렬** 실행합니다.
   - `news-sentiment-analyst`
   - `price-analyst`
   - `valuation-analyst` — 증권사 목표주가 확인, 자체 적정주가(보수적·기준·낙관 시나리오), 가격대별 대응 전략 산정

3. **Phase 3** — 모든 결과를 합쳐 `invest-type-classifier`가 투자 유형을 분류합니다.

4. **Phase 4** — 모든 분석을 종합해 `aggressive-investment-strategist`가 최종 투자 판단 리포트를 작성합니다.

## 최종 리포트 구조 (JSON)

```json
{
  "verdict": "분할 매수",
  "verdictEmoji": "🔵",
  "summary": "...",
  "investType": { ... },
  "analysis": { ... },
  "strategy": {
    "currentPrice": "...",
    "targetPrice": "...",
    "stopLossPrice": "...",
    "recommendedBuyPrice": "..."
  },
  "valuation": {
    "securitiesTargetRange": "증권사 목표주가 범위",
    "fairValueConservative": "보수적 적정주가",
    "fairValueBase": "기준 적정주가",
    "fairValueOptimistic": "낙관 적정주가",
    "currentPricePosition": "저평가 / 기준 근처 / 과열 등",
    "valuationSummary": "현재 주가 위치 요약"
  },
  "risks": [ ... ],
  "monitoringPoints": [ ... ]
}
```

## 주의

- 실제 투자 판단은 본인 책임입니다.
- 상장사 최신 뉴스와 수치 확인을 위해 기본적으로 Codex 웹 검색을 사용합니다.
