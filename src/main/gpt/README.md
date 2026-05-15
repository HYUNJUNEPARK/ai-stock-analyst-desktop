# stock-gpt

`stock-claude`의 운영 규칙을 Codex 실행 구조로 옮긴 워크스페이스입니다.

세 개의 전문 분석을 병렬로 실행한 뒤, 마지막에 종합 투자 리포트를 생성합니다.

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

- 최종 리포트: `reports/{identifier}_{YYYYMMDD}.md`
- 중간 산출물: `reports/.artifacts/{identifier}_{YYYYMMDD}/`

## 동작 방식

1. `financial-analyst-kr`
2. `news-sentiment-analyst`
3. `sector-researcher`

위 세 역할을 병렬 실행합니다.

이후 세 결과를 합쳐 `aggressive-investment-strategist`가 최종 투자 판단 리포트를 작성합니다.

## 주의

- 실제 투자 판단은 본인 책임입니다.
- 상장사 최신 뉴스와 수치 확인을 위해 기본적으로 Codex 웹 검색을 사용합니다.
