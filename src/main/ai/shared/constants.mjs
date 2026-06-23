/**
 * shared/constants.mjs — AI 모듈 공통 상수
 */

// ── 공공데이터포털 API URLs ─────────────────────────────────────────────
/** @see https://www.data.go.kr/data/15094775/openapi.do */
export const PUBLIC_DATA_API = {
  /** 금융위원회_KRX상장종목정보 -> 국장 종목 검색 자동완성 데이터 구성*/
  //  신청일 2026-06-23 만료예정일 2028-06-23
  KR_STOCK_BASIC_INFO: 'https://apis.data.go.kr/1160100/service/GetKrxListedInfoService/getItemInfo',

  /** 금융위원회_주식시세정보 -> 종목별 시가/고가/저가/종가/거래량 조회 */
  //  신청일 2026-06-23 만료예정일 2028-06-23
  KR_STOCK_PRICE: 'https://apis.data.go.kr/1160100/service/GetStockSecuritiesInfoService/getStockPriceInfo',
}

// ── Finnhub API URLs ────────────────────────────────────────────────────
/** @see https://finnhub.io/docs/api */
export const FINNHUB_API = {
  /** 종목 심볼 검색 */
  SYMBOL_SEARCH: 'https://finnhub.io/api/v1/search',
  /** 실시간 시세 조회 */
  QUOTE: 'https://finnhub.io/api/v1/quote',
}
