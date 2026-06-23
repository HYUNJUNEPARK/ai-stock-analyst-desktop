/**
 * shared/us-stock-history.mjs — 미국 주식 일봉 히스토리 조회 모듈
 *
 * FMP (Financial Modeling Prep) API를 통해
 * 미국 종목의 일봉 데이터를 가져오고 기술적 지표를 계산한다.
 *
 * price-analyst AI 에이전트에 사전 계산된 지표 데이터를 주입하여
 * "확인 불가" 응답을 제거하는 것이 목적이다.
 *
 * 데이터 소스:
 *   FMP stable API — /historical-price-eod/full
 *   https://site.financialmodelingprep.com/developer/docs
 *
 * 환경변수:
 *   FMP_API_KEY — FMP 무료 API 키 (250회/일)
 */

import { FMP_API } from './constants.mjs'
import { calculateIndicators } from './technical-indicators.mjs'

// =====================================================================
//  공개 API
// =====================================================================

/**
 * 미국 종목의 일봉 히스토리를 가져와 기술적 지표를 계산한다.
 *
 * @param {object} params
 * @param {string} params.ticker       - 종목 심볼 (예: "AAPL")
 * @param {string} params.company      - 회사명
 * @param {number} [params.currentPrice] - 기준 주가 (없으면 최신 종가 사용)
 * @param {number} [params.days=365]   - 조회할 캘린더 일수
 * @returns {object|null} 기술적 지표 객체 또는 null
 */
export async function fetchUsTechnicalData({ ticker, company, currentPrice, days = 365 }) {
  try {
    // 한국 6자리 코드면 스킵
    if (!ticker || /^\d{6}$/.test(ticker)) return null

    const apiKey = getFmpKey()
    if (!apiKey) return null

    const candles = await fetchDailyCandles(apiKey, ticker, days)
    if (candles.length < 20) {
      console.warn(`[technical] ${company}(${ticker}) 일봉 데이터 부족: ${candles.length}개`)
      return null
    }

    const indicators = calculateIndicators(candles, currentPrice, 'USD')
    if (!indicators) return null

    console.log(
      `[technical] ${company}(${ticker}) 기술적 지표 계산 완료 (${candles.length}일, FMP)`
    )
    return indicators
  } catch (err) {
    console.warn(
      `[technical] FMP 기술적 지표 계산 실패. AI가 직접 조회합니다. (${err?.message ?? 'unknown'})`
    )
    return null
  }
}

// =====================================================================
//  내부 함수
// =====================================================================

/**
 * FMP API에서 종목의 일봉 데이터를 조회한다.
 *
 * from/to 파라미터로 날짜 범위를 지정하여
 * 1회 호출로 최대 1년치 일봉을 가져온다.
 *
 * @param {string} apiKey - FMP API 키
 * @param {string} ticker - 종목 심볼
 * @param {number} days   - 조회할 캘린더 일수
 * @returns {Array<{ date, open, high, low, close, volume }>} 날짜 오름차순
 */
async function fetchDailyCandles(apiKey, ticker, days) {
  const to = new Date()
  const from = new Date(Date.now() - days * 86_400_000)

  const url = `${FMP_API.HISTORICAL_PRICE}?symbol=${encodeURIComponent(ticker)}`
    + `&from=${formatDate(from)}&to=${formatDate(to)}`
    + `&apikey=${apiKey}`

  const response = await fetch(url)
  if (!response.ok) {
    console.warn(`[technical] FMP API 실패: HTTP ${response.status}`)
    return []
  }

  const data = await response.json()
  if (!Array.isArray(data) || data.length === 0) return []

  // FMP 응답은 최신→과거 순이므로 오름차순으로 정렬
  return data
    .map((item) => ({
      date: String(item.date),
      open: Number(item.open) || 0,
      high: Number(item.high) || 0,
      low: Number(item.low) || 0,
      close: Number(item.close) || 0,
      volume: Number(item.volume) || 0
    }))
    .filter((c) => c.close > 0)
    .sort((a, b) => a.date.localeCompare(b.date))
}

/** Date → 'YYYY-MM-DD' */
function formatDate(d) {
  return d.toISOString().slice(0, 10)
}

/** FMP API 키를 환경변수에서 읽는다. */
function getFmpKey() {
  const key = (process.env.FMP_API_KEY || '').trim()
  if (!key) {
    console.warn('[technical] FMP_API_KEY 미설정. AI가 직접 조회합니다.')
    return null
  }
  return key
}
