/**
 * shared/kr-stock-history.mjs — 한국 주식 일봉 히스토리 조회 모듈
 *
 * 공공데이터포털 "금융위원회_주식시세정보" API를 통해
 * 지정 종목의 일봉 데이터를 가져오고 기술적 지표를 계산한다.
 *
 * price-analyst AI 에이전트에 사전 계산된 지표 데이터를 주입하여
 * "확인 불가" 응답을 제거하는 것이 목적이다.
 */

import {
  buildPublicDataUrl,
  fetchPublicDataPage,
  toArray
} from './public-data-api.mjs'
import { PUBLIC_DATA_API } from './constants.mjs'
import { calculateIndicators } from './technical-indicators.mjs'

// =====================================================================
//  공개 API
// =====================================================================

/**
 * 한국 종목의 일봉 히스토리를 가져와 기술적 지표를 계산한다.
 *
 * @param {object} params
 * @param {string} params.ticker       - 종목코드 (6자리)
 * @param {string} params.company      - 회사명
 * @param {number} [params.currentPrice] - 기준 주가 (없으면 최신 종가 사용)
 * @param {number} [params.days=250]   - 조회할 거래일 수
 * @returns {object|null} 기술적 지표 객체 또는 null
 */
export async function fetchKrTechnicalData({ ticker, company, currentPrice, days = 250 }) {
  try {
    if (!ticker || !/^\d{6}$/.test(ticker)) return null

    const serviceKey = (
      process.env.DATA_GO_KR_SERVICE_KEY ||
      process.env.PUBLIC_DATA_SERVICE_KEY ||
      ''
    ).trim()
    if (!serviceKey) return null

    const candles = await fetchDailyCandles(serviceKey, ticker, days)
    if (candles.length < 20) {
      console.warn(`[technical] ${company}(${ticker}) 일봉 데이터 부족: ${candles.length}개`)
      return null
    }

    const indicators = calculateIndicators(candles, currentPrice, 'KRW')
    if (!indicators) return null

    console.log(
      `[technical] ${company}(${ticker}) 기술적 지표 계산 완료 (${candles.length}일)`
    )
    return indicators
  } catch (err) {
    console.warn(
      `[technical] 기술적 지표 계산 실패. AI가 직접 조회합니다. (${err?.message ?? 'unknown'})`
    )
    return null
  }
}

// =====================================================================
//  내부 함수
// =====================================================================

/**
 * 공공데이터포털에서 종목의 일봉 데이터를 조회한다.
 *
 * beginBasDt/endBasDt 파라미터로 날짜 범위를 지정하여
 * 1회 호출로 최대 300건의 일봉을 가져온다.
 *
 * @param {string} serviceKey - 서비스 키
 * @param {string} ticker     - 종목코드
 * @param {number} days       - 조회할 캘린더 일수
 * @returns {Array<{ date, open, high, low, close, volume }>} 날짜 오름차순
 */
async function fetchDailyCandles(serviceKey, ticker, days) {
  const endDate = new Date()
  const beginDate = new Date(Date.now() - days * 1.5 * 86_400_000) // 휴일 감안 1.5배
  const endBasDt = formatDate(endDate)
  const beginBasDt = formatDate(beginDate)

  const allItems = []
  const numOfRows = 300

  // 페이지네이션 (대부분 1페이지로 충분)
  for (let pageNo = 1; pageNo <= 3; pageNo += 1) {
    const url = buildPublicDataUrl(PUBLIC_DATA_API.KR_STOCK_PRICE, serviceKey, {
      pageNo,
      numOfRows,
      resultType: 'json',
      beginBasDt,
      endBasDt,
      likeSrtnCd: ticker
    })

    const { body } = await fetchPublicDataPage(url)
    const items = toArray(body?.items?.item).filter((item) => {
      const code = String(item.srtnCd || '').replace(/^[A-Za-z]/, '')
      return code === ticker
    })

    allItems.push(...items)

    const totalCount = Number(body?.totalCount || allItems.length)
    if (allItems.length >= totalCount || items.length === 0) break
  }

  // API 응답 → 표준 캔들 형식, 날짜 오름차순 정렬
  return allItems
    .map((item) => ({
      date: String(item.basDt),
      open: Number(item.mkp) || 0,
      high: Number(item.hipr) || 0,
      low: Number(item.lopr) || 0,
      close: Number(item.clpr) || 0,
      volume: Number(item.trqu) || 0
    }))
    .filter((c) => c.close > 0)
    .sort((a, b) => a.date.localeCompare(b.date))
}

/** Date → 'YYYYMMDD' */
function formatDate(d) {
  return d.toISOString().slice(0, 10).replace(/-/g, '')
}
