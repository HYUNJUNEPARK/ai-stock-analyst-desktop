/**
 * shared/stock-price.mjs — 한국 주식 시세 조회 모듈 (AI 모델 공통)
 *
 * 공공데이터포털 "금융위원회_주식시세정보" API를 통해
 * KRX 상장 종목의 기준일 종가를 조회한다.
 *
 * price-fetcher AI 에이전트를 대체하여 API에서 직접 주가를 가져오며,
 * 실패 시 null을 반환하여 AI fallback으로 넘긴다.
 *
 * 데이터 소스:
 *   공공데이터포털 "금융위원회_주식시세정보" API
 *   https://www.data.go.kr/data/15094808/openapi.do
 *
 * API 응답 필드:
 *   basDt    : 기준일자 (YYYYMMDD)
 *   srtnCd   : 단축코드 (A005930)
 *   itmsNm   : 종목명
 *   mrktCtg  : 시장구분 (KOSPI/KOSDAQ)
 *   clpr     : 종가
 *   mkp      : 시가
 *   hipr     : 고가
 *   lopr     : 저가
 *   trqu     : 거래량
 *   trPrc    : 거래대금
 *   lstgStCnt: 상장주식수
 *   mrktTotAmt: 시가총액
 *   vs       : 전일대비
 *   fltRt    : 등락률
 */

import {
  buildPublicDataUrl,
  fetchPublicDataPage,
  toArray
} from './public-data-api.mjs'
import { PUBLIC_DATA_API } from './constants.mjs'

// =====================================================================
//  공개 API
// =====================================================================

/**
 * 공공데이터포털에서 한국 주식 종가를 조회한다.
 *
 * @param {object} params
 * @param {string} params.ticker   - 종목코드 (6자리, 예: "005930")
 * @param {string} params.company  - 회사명 (결과 객체에 포함)
 * @param {string} params.market   - 시장 구분 (예: "KOSPI")
 * @returns {object|null} 조회 성공 시 시세 객체, 실패 시 null
 *
 * 반환 객체:
 *   {
 *     company, ticker, asOfDate, tradingDate,
 *     price, priceFormatted, currency,
 *     sources: [{ name, price }],
 *     note, source
 *   }
 */
export async function fetchStockPrice({ ticker, company, market }) {
  try {
    // 한국 종목만 지원
    if (!ticker || !/^\d{6}$/.test(ticker)) return null

    const serviceKey = (
      process.env.DATA_GO_KR_SERVICE_KEY ||
      process.env.PUBLIC_DATA_SERVICE_KEY ||
      ''
    ).trim()
    if (!serviceKey) {
      console.warn('[price] DATA_GO_KR_SERVICE_KEY 미설정. AI 주가 조회를 사용합니다.')
      return null
    }

    // 최근 7일 내 해당 종목의 시세 데이터를 찾는다
    const priceData = await findLatestPrice(serviceKey, ticker)
    if (!priceData) return null

    const price = Number(priceData.clpr)
    if (!price || isNaN(price)) return null

    const tradingDate = formatDateDisplay(priceData.basDt)
    const priceFormatted = `${price.toLocaleString('ko-KR')}원`

    return {
      company: company || priceData.itmsNm || '',
      ticker,
      asOfDate: tradingDate,
      tradingDate,
      price: String(price),
      priceFormatted,
      currency: 'KRW',
      sources: [{ name: '금융위원회_주식시세정보', price: String(price) }],
      note: `공공데이터포털 API 기준 (${priceData.basDt})`,
      source: 'public-data-api'
    }
  } catch (err) {
    console.warn(
      `[price] 공공데이터 주가 조회 실패. AI 주가 조회로 대체합니다. (${err?.message ?? 'unknown'})`
    )
    return null
  }
}

// =====================================================================
//  내부 함수
// =====================================================================

/**
 * 최근 7일 내 해당 종목의 시세 데이터를 찾는다.
 *
 * 주말·공휴일에는 데이터가 없으므로, 오늘부터 역순으로
 * 해당 종목의 시세가 존재하는 첫 번째 날짜를 반환한다.
 *
 * @param {string} serviceKey - 공공데이터포털 서비스키
 * @param {string} ticker     - 종목코드 (6자리)
 * @returns {object|null} API 응답의 item 객체 또는 null
 */
async function findLatestPrice(serviceKey, ticker) {
  // API의 srtnCd는 'A' + 종목코드 형식
  const likeSrtnCd = ticker

  for (let daysAgo = 0; daysAgo < 7; daysAgo += 1) {
    const d = new Date(Date.now() - daysAgo * 86_400_000)
    const basDt = d.toISOString().slice(0, 10).replace(/-/g, '')

    const url = buildPublicDataUrl(PUBLIC_DATA_API.KR_STOCK_PRICE, serviceKey, {
      pageNo: 1,
      numOfRows: 5,
      resultType: 'json',
      basDt,
      likeSrtnCd
    })

    try {
      const { body } = await fetchPublicDataPage(url)
      const items = toArray(body?.items?.item)

      // 종목코드가 정확히 일치하는 항목 찾기
      const match = items.find((item) => {
        const code = String(item.srtnCd || '').replace(/^[A-Za-z]/, '')
        return code === ticker
      })

      if (match) return match
    } catch {
      // 이 날짜는 데이터가 없거나 API 오류 — 다음 날짜 시도
    }
  }

  return null
}

/**
 * YYYYMMDD 형식 날짜를 YYYY-MM-DD로 변환한다.
 * @param {string} basDt - "20260623"
 * @returns {string} "2026-06-23"
 */
function formatDateDisplay(basDt) {
  const s = String(basDt || '')
  if (s.length !== 8) return s
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`
}
