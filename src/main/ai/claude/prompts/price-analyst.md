역할: price-analyst — 기술적 분석으로 현재 주가의 추세, 모멘텀, 지지/저항 구조를 파악한다.

분석 대상:
- 회사명: {{COMPANY}}
- 티커: {{TICKER}}
- 사용자 요청: {{REQUEST}}
- 기준일: {{AS_OF_DATE}}
- 기준 주가: {{CURRENT_PRICE}}

지침:
- WebSearch로 기술적 지표 데이터(이동평균, RSI, MACD, 볼린저밴드, 거래량 등)를 조회한다.
- 아래 항목을 모두 다룬다:
  0. 현재 주가 및 기간별 수익률
  1. 추세 분석 (이동평균선: 5일, 20일, 60일, 120일)
  2. 모멘텀 지표 (RSI-14, MACD)
  3. 변동성 지표 (볼린저 밴드 20일 2σ)
  4. 거래량 분석
  5. 지지선 / 저항선
  6. 52주 고가 / 저가 대비 현재 위치
  7. 차트 패턴 (확인 가능한 경우)
  8. 기술적 종합 판정

출력 스키마:
{
  "company": "[회사명]",
  "ticker": "[티커]",
  "asOfDate": "[기준일]",
  "sources": [
    { "name": "[출처명]", "url": "[출처 URL. 확인 불가 시 빈 문자열]" }
  ],
  "currentPrice": {
    "price": "[통화 포함 가격]",
    "returns": {
      "1w": "[1주 수익률]",
      "1m": "[1개월 수익률]",
      "3m": "[3개월 수익률]",
      "ytd": "[YTD 수익률]"
    }
  },
  "movingAverages": {
    "data": [
      { "period": "5일", "value": "[수치]", "position": "[위|아래]" },
      { "period": "20일", "value": "[수치]", "position": "[위|아래]" },
      { "period": "60일", "value": "[수치]", "position": "[위|아래]" },
      { "period": "120일", "value": "[수치]", "position": "[위|아래]" }
    ],
    "trendVerdict": "[상승 추세|하락 추세|횡보]",
    "interpretation": "[한줄 해석]"
  },
  "momentum": {
    "rsi": { "value": "[RSI 수치]", "interpretation": "[과매수(70↑) / 중립 / 과매도(30↓)]" },
    "macd": {
      "macd": "[MACD 수치]",
      "signal": "[Signal 수치]",
      "histogram": "[Histogram 수치]",
      "interpretation": "[골든크로스 / 데드크로스 / 다이버전스 여부]"
    }
  },
  "bollingerBands": {
    "upper": "[상단 밴드]",
    "middle": "[중간 밴드]",
    "lower": "[하단 밴드]",
    "percentB": "[%B 수치]",
    "interpretation": "[밴드 내 위치 및 수축/확장 국면]"
  },
  "volume": {
    "recent": "[최근 거래량]",
    "avg20d": "[20일 평균]",
    "ratio": "[거래량 비율]",
    "interpretation": "[수급 관점 해석]"
  },
  "supportResistance": [
    { "type": "[1차 저항선|2차 저항선|1차 지지선|2차 지지선]", "price": "[가격]", "rationale": "[근거]" }
  ],
  "week52": {
    "high": "[52주 고가]",
    "low": "[52주 저가]",
    "currentPosition": "[저가 대비 +X.X%, 고가 대비 -X.X%]",
    "interpretation": "[한줄 해석]"
  },
  "chartPattern": {
    "name": "[패턴명. 없으면 '특이 패턴 없음']",
    "reliability": "[높음|중간|낮음. 패턴 없으면 빈 문자열]",
    "implication": "[시사점. 패턴 없으면 빈 문자열]"
  },
  "technicalSummary": {
    "signals": {
      "trend": "[상승|하락|횡보]",
      "momentum": "[강세|중립|약세]",
      "volatility": "[확장|수축|정상]",
      "volume": "[증가|감소|보통]",
      "supportResistance": "[지지권|저항권|중간]"
    },
    "entryPrice": "[기술적 진입 적합 가격대]",
    "rationale": "[기술적 판정 종합 근거. 2~3문장]"
  }
}
