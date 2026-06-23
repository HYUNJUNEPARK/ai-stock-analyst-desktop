/**
 * shared/finnhub.mjs — Finnhub API를 통한 미국 종목 검증 및 시세 조회 모듈
 *
 * input-validator / price-fetcher AI 에이전트를 대체하여
 * Finnhub API에서 직접 미국 종목을 검증하고 주가를 가져온다.
 * 실패 시 null을 반환하여 AI fallback으로 넘긴다.
 *
 * 데이터 소스:
 *   Finnhub Stock API (https://finnhub.io)
 *   - /search : 심볼/회사명 검색
 *   - /quote  : 실시간 시세 조회
 *
 * 환경변수:
 *   FINNHUB_API_KEY — Finnhub 무료 API 키
 */

import { FINNHUB_API } from './constants.mjs'

// =====================================================================
//  공개 API — 종목 검증
// =====================================================================

/**
 * Finnhub API로 미국 종목을 검증한다.
 *
 * @param {object} params
 * @param {object} params.context    - 분석 컨텍스트 (REQUEST, COMPANY, TICKER, MARKET)
 * @param {string} params.outputPath - 검증 결과를 저장할 파일 경로
 * @returns {object|null} 검증 성공 시 결과 객체, 실패 시 null (AI fallback)
 */
export async function validateWithFinnhub({ context, outputPath }) {
  try {
    if (!isUsMarket(context.MARKET)) return null

    const apiKey = getFinnhubKey()
    if (!apiKey) return null

    // 티커가 있으면 티커로, 없으면 회사명으로 검색
    const query = context.TICKER || context.COMPANY || context.REQUEST
    if (!query) return null

    const match = await searchSymbol(apiKey, query, context.TICKER, context.COMPANY)
    if (!match) return null

    const result = {
      valid: true,
      company: match.description,
      ticker: match.symbol,
      market: 'US',
      source: 'finnhub',
      reason: `${match.description}(${match.symbol}) 종목을 Finnhub API에서 확인했습니다.`
    }

    const { writeFile } = await import('node:fs/promises')
    await writeFile(outputPath, JSON.stringify(result, null, 2), 'utf8')
    console.log(
      `[validator] finnhub matched: ${match.description} (${match.symbol})`
    )
    return result
  } catch (err) {
    console.warn(
      `[경고] Finnhub 종목 검증 실패. AI 입력 검증으로 대체합니다. (${err?.message ?? 'unknown'})`
    )
    return null
  }
}

// =====================================================================
//  공개 API — 주가 조회
// =====================================================================

/**
 * Finnhub API로 미국 주식 시세를 조회한다.
 *
 * @param {object} params
 * @param {string} params.ticker  - 종목 심볼 (예: "AAPL")
 * @param {string} params.company - 회사명 (결과 객체에 포함)
 * @param {string} params.market  - 시장 구분
 * @returns {object|null} 조회 성공 시 시세 객체, 실패 시 null
 */
export async function fetchUsStockPrice({ ticker, company, market }) {
  try {
    if (!ticker || /^\d{6}$/.test(ticker)) return null

    const apiKey = getFinnhubKey()
    if (!apiKey) return null

    const url = `${FINNHUB_API.QUOTE}?symbol=${encodeURIComponent(ticker)}&token=${apiKey}`
    const response = await fetch(url)
    if (!response.ok) {
      console.warn(`[price] Finnhub API 실패: HTTP ${response.status}`)
      return null
    }

    const data = await response.json()

    // c=0, t=0 이면 유효하지 않은 심볼
    if (!data.c || data.c === 0 || !data.t || data.t === 0) return null

    const price = data.c
    const prevClose = data.pc
    const tradingDate = new Date(data.t * 1000).toISOString().slice(0, 10)
    const priceFormatted = `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

    return {
      company: company || ticker,
      ticker,
      asOfDate: tradingDate,
      tradingDate,
      price: String(price),
      priceFormatted,
      currency: 'USD',
      sources: [{ name: 'Finnhub', price: String(price) }],
      note: prevClose
        ? `전일 종가: $${prevClose} | 변동: ${data.dp >= 0 ? '+' : ''}${data.dp?.toFixed(2)}%`
        : '',
      source: 'finnhub'
    }
  } catch (err) {
    console.warn(
      `[price] Finnhub 주가 조회 실패. AI 주가 조회로 대체합니다. (${err?.message ?? 'unknown'})`
    )
    return null
  }
}

// =====================================================================
//  내부 함수
// =====================================================================

/**
 * Finnhub Symbol Search API로 종목을 검색하고 가장 적합한 결과를 반환한다.
 *
 * @param {string} apiKey  - Finnhub API 키
 * @param {string} query   - 검색 쿼리 (티커 또는 회사명)
 * @param {string} ticker  - 컨텍스트에서 파싱된 티커
 * @param {string} company - 컨텍스트에서 파싱된 회사명
 * @returns {{ symbol: string, description: string }|null}
 */
async function searchSymbol(apiKey, query, ticker, company) {
  const url = `${FINNHUB_API.SYMBOL_SEARCH}?q=${encodeURIComponent(query)}&token=${apiKey}`
  const response = await fetch(url)
  if (!response.ok) return null

  const data = await response.json()
  const results = data.result || []
  if (results.length === 0) return null

  // 미국 주식만 필터 (Common Stock)
  const usStocks = results.filter(
    (r) => r.type === 'Common Stock' && !r.symbol.includes('.')
  )
  if (usStocks.length === 0) return null

  // 티커가 정확히 일치하는 항목 우선
  if (ticker) {
    const exactTicker = usStocks.find(
      (r) => r.symbol.toUpperCase() === ticker.toUpperCase()
    )
    if (exactTicker) return exactTicker
  }

  // 회사명이 포함된 항목 (양방향 비교)
  if (company) {
    const companyLower = company.toLowerCase()
    const nameMatch = usStocks.find((r) => {
      const descLower = r.description.toLowerCase()
      return descLower.includes(companyLower) || companyLower.includes(descLower.split(' ')[0])
    })
    if (nameMatch) return nameMatch
  }

  // 첫 번째 결과 반환
  return usStocks[0]
}

/** Finnhub API 키를 환경변수에서 읽는다. */
function getFinnhubKey() {
  const key = (process.env.FINNHUB_API_KEY || '').trim()
  if (!key) {
    console.warn('[finnhub] FINNHUB_API_KEY 미설정. AI 검증/조회를 사용합니다.')
    return null
  }
  return key
}

/** 시장 값에 미국 시장 키워드가 포함되어 있는지 판별한다. */
function isUsMarket(market) {
  return /(^|[\s,])us([\s,]|$)|미국|nasdaq|nyse|amex/i.test(String(market || ''))
}
