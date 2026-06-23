/**
 * shared/technical-indicators.mjs — 일봉 데이터로 기술적 지표를 계산하는 모듈
 *
 * OHLCV 일봉 배열을 받아 이동평균, RSI, MACD, 볼린저밴드 등
 * price-analyst 프롬프트가 요구하는 모든 기술적 지표를 계산한다.
 *
 * 입력 형식 (날짜 오름차순 정렬):
 *   [{ date, open, high, low, close, volume }, ...]
 *
 * 모든 계산은 종가(close) 기준이다.
 */

// =====================================================================
//  공개 API
// =====================================================================

/**
 * 일봉 데이터로 기술적 지표를 계산한다.
 *
 * @param {Array<{ date: string, open: number, high: number, low: number, close: number, volume: number }>} candles
 *   날짜 오름차순 정렬된 일봉 배열 (최소 120개 권장)
 * @param {number} currentPrice - 기준 주가 (없으면 마지막 종가 사용)
 * @param {string} currency - 'KRW' 또는 'USD'
 * @returns {object} 기술적 지표 객체
 */
export function calculateIndicators(candles, currentPrice, currency = 'KRW') {
  if (!candles || candles.length < 20) return null

  const closes = candles.map((c) => c.close)
  const volumes = candles.map((c) => c.volume)
  const price = currentPrice || closes[closes.length - 1]
  const fmt = currency === 'KRW' ? fmtKRW : fmtUSD

  return {
    currentPrice: buildCurrentPrice(candles, price, fmt),
    movingAverages: buildMovingAverages(closes, price, fmt),
    momentum: buildMomentum(closes),
    bollingerBands: buildBollingerBands(closes, price, fmt),
    volume: buildVolume(volumes),
    week52: buildWeek52(candles, price, fmt),
    supportResistance: buildSupportResistance(candles, price, fmt)
  }
}

// =====================================================================
//  현재 주가 및 수익률
// =====================================================================

function buildCurrentPrice(candles, price, fmt) {
  const closes = candles.map((c) => c.close)
  const len = closes.length

  const ret = (daysAgo) => {
    const idx = len - 1 - daysAgo
    if (idx < 0) return '확인 불가'
    const past = closes[idx]
    const pct = ((price - past) / past) * 100
    return `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`
  }

  // YTD: 올해 첫 거래일 찾기
  const currentYear = candles[len - 1].date.slice(0, 4)
  const ytdCandle = candles.find((c) => c.date.startsWith(currentYear))
  const ytdReturn = ytdCandle
    ? `${(((price - ytdCandle.close) / ytdCandle.close) * 100) >= 0 ? '+' : ''}${(((price - ytdCandle.close) / ytdCandle.close) * 100).toFixed(2)}%`
    : '확인 불가'

  return {
    price: fmt(price),
    returns: {
      '1w': ret(5),
      '1m': ret(20),
      '3m': ret(60),
      ytd: ytdReturn
    }
  }
}

// =====================================================================
//  이동평균선
// =====================================================================

function buildMovingAverages(closes, price, fmt) {
  const periods = [5, 20, 60, 120]
  const data = periods.map((p) => {
    const sma = calcSMA(closes, p)
    if (sma === null) return { period: `${p}일`, value: '확인 불가', position: '확인 불가' }
    return {
      period: `${p}일`,
      value: fmt(Math.round(sma)),
      position: price >= sma ? '위' : '아래'
    }
  })

  // 추세 판정: 5일 > 20일 > 60일 → 상승, 반대 → 하락
  const sma5 = calcSMA(closes, 5)
  const sma20 = calcSMA(closes, 20)
  const sma60 = calcSMA(closes, 60)
  let trendVerdict = '횡보'
  if (sma5 !== null && sma20 !== null && sma60 !== null) {
    if (sma5 > sma20 && sma20 > sma60) trendVerdict = '상승 추세'
    else if (sma5 < sma20 && sma20 < sma60) trendVerdict = '하락 추세'
  }

  return { data, trendVerdict, interpretation: '' }
}

// =====================================================================
//  RSI & MACD
// =====================================================================

function buildMomentum(closes) {
  return {
    rsi: buildRSI(closes),
    macd: buildMACD(closes)
  }
}

function buildRSI(closes, period = 14) {
  if (closes.length < period + 1) {
    return { value: '확인 불가', interpretation: '확인 불가' }
  }

  let avgGain = 0
  let avgLoss = 0

  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1]
    if (diff > 0) avgGain += diff
    else avgLoss += Math.abs(diff)
  }

  avgGain /= period
  avgLoss /= period

  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss
  const rsi = 100 - 100 / (1 + rs)
  const rounded = Math.round(rsi * 100) / 100

  let interpretation = '중립'
  if (rsi >= 70) interpretation = '과매수 구간 (70↑)'
  else if (rsi <= 30) interpretation = '과매도 구간 (30↓)'

  return { value: String(rounded), interpretation }
}

function buildMACD(closes) {
  if (closes.length < 35) {
    return { macd: '확인 불가', signal: '확인 불가', histogram: '확인 불가', interpretation: '확인 불가' }
  }

  const ema12 = calcEMA(closes, 12)
  const ema26 = calcEMA(closes, 26)
  if (ema12 === null || ema26 === null) {
    return { macd: '확인 불가', signal: '확인 불가', histogram: '확인 불가', interpretation: '확인 불가' }
  }

  // MACD 라인 시리즈 (최근 9개 이상 필요)
  const macdSeries = []
  const ema12Series = calcEMASeries(closes, 12)
  const ema26Series = calcEMASeries(closes, 26)
  const minLen = Math.min(ema12Series.length, ema26Series.length)
  for (let i = 0; i < minLen; i++) {
    macdSeries.push(ema12Series[ema12Series.length - minLen + i] - ema26Series[ema26Series.length - minLen + i])
  }

  const macdValue = macdSeries[macdSeries.length - 1]
  const signalValue = calcEMAFromArray(macdSeries, 9)
  if (signalValue === null) {
    return { macd: r2(macdValue), signal: '확인 불가', histogram: '확인 불가', interpretation: '확인 불가' }
  }

  const histogram = macdValue - signalValue
  let interpretation = 'MACD 중립'
  if (macdValue > signalValue && histogram > 0) interpretation = '골든크로스 (매수 신호)'
  else if (macdValue < signalValue && histogram < 0) interpretation = '데드크로스 (매도 신호)'

  return {
    macd: r2(macdValue),
    signal: r2(signalValue),
    histogram: r2(histogram),
    interpretation
  }
}

// =====================================================================
//  볼린저밴드
// =====================================================================

function buildBollingerBands(closes, price, fmt) {
  const period = 20
  const multiplier = 2

  if (closes.length < period) {
    return { upper: '확인 불가', middle: '확인 불가', lower: '확인 불가', percentB: '확인 불가', interpretation: '확인 불가' }
  }

  const recent = closes.slice(-period)
  const middle = recent.reduce((a, b) => a + b, 0) / period
  const stddev = Math.sqrt(recent.reduce((sum, v) => sum + (v - middle) ** 2, 0) / period)
  const upper = middle + multiplier * stddev
  const lower = middle - multiplier * stddev
  const percentB = stddev === 0 ? 50 : ((price - lower) / (upper - lower)) * 100

  let interpretation = '밴드 중간 구간'
  if (percentB >= 80) interpretation = '상단 밴드 근접 (과매수 가능성)'
  else if (percentB <= 20) interpretation = '하단 밴드 근접 (과매도 가능성)'

  // 밴드폭으로 수축/확장 판단
  const bandwidth = ((upper - lower) / middle) * 100
  if (bandwidth < 5) interpretation += ', 밴드 수축 (변동성 축소)'
  else if (bandwidth > 15) interpretation += ', 밴드 확장 (변동성 확대)'

  return {
    upper: fmt(Math.round(upper)),
    middle: fmt(Math.round(middle)),
    lower: fmt(Math.round(lower)),
    percentB: `${Math.round(percentB * 100) / 100}%`,
    interpretation
  }
}

// =====================================================================
//  거래량
// =====================================================================

function buildVolume(volumes) {
  const len = volumes.length
  const recent = volumes[len - 1]
  const avg20d = len >= 20
    ? Math.round(volumes.slice(-20).reduce((a, b) => a + b, 0) / 20)
    : null

  if (!avg20d) {
    return { recent: fmtVolume(recent), avg20d: '확인 불가', ratio: '확인 불가', interpretation: '' }
  }

  const ratio = avg20d === 0 ? 0 : recent / avg20d
  let interpretation = '보통 수준의 거래량'
  if (ratio >= 2.0) interpretation = '평균 대비 거래량 급증 (강한 관심)'
  else if (ratio >= 1.3) interpretation = '평균 대비 거래량 증가'
  else if (ratio <= 0.5) interpretation = '평균 대비 거래량 급감 (관심 저하)'
  else if (ratio <= 0.7) interpretation = '평균 대비 거래량 감소'

  return {
    recent: fmtVolume(recent),
    avg20d: fmtVolume(avg20d),
    ratio: `${(ratio * 100).toFixed(0)}%`,
    interpretation
  }
}

// =====================================================================
//  52주 고/저
// =====================================================================

function buildWeek52(candles, price, fmt) {
  // 최근 250거래일 (약 1년), 데이터가 부족하면 있는 만큼 사용
  const recent = candles.slice(-250)
  const high = Math.max(...recent.map((c) => c.high))
  const low = Math.min(...recent.map((c) => c.low))

  const fromHigh = ((price - high) / high) * 100
  const fromLow = ((price - low) / low) * 100

  return {
    high: fmt(high),
    low: fmt(low),
    currentPosition: `저가 대비 ${fromLow >= 0 ? '+' : ''}${fromLow.toFixed(1)}%, 고가 대비 ${fromHigh >= 0 ? '+' : ''}${fromHigh.toFixed(1)}%`,
    interpretation: ''
  }
}

// =====================================================================
//  지지선/저항선 (최근 고점/저점 기반)
// =====================================================================

function buildSupportResistance(candles, price, fmt) {
  const recent60 = candles.slice(-60)
  const highs = recent60.map((c) => c.high).sort((a, b) => b - a)
  const lows = recent60.map((c) => c.low).sort((a, b) => a - b)

  const results = []

  // 저항선: 현재가보다 높은 최근 고점
  const r1 = highs.find((h) => h > price)
  const r2Val = highs.find((h) => h > price && h !== r1)
  if (r1) results.push({ type: '1차 저항선', price: fmt(r1), rationale: '최근 60일 고점' })
  if (r2Val) results.push({ type: '2차 저항선', price: fmt(r2Val), rationale: '최근 60일 차고점' })

  // 지지선: 현재가보다 낮은 최근 저점
  const s1 = lows.find((l) => l < price)
  const s2Val = lows.find((l) => l < price && l !== s1)
  if (s1) results.push({ type: '1차 지지선', price: fmt(s1), rationale: '최근 60일 저점' })
  if (s2Val) results.push({ type: '2차 지지선', price: fmt(s2Val), rationale: '최근 60일 차저점' })

  return results
}

// =====================================================================
//  계산 유틸리티
// =====================================================================

/** 단순이동평균 (SMA) — 최근 period개의 평균 */
function calcSMA(arr, period) {
  if (arr.length < period) return null
  const slice = arr.slice(-period)
  return slice.reduce((a, b) => a + b, 0) / period
}

/** 지수이동평균 (EMA) — 최종값만 반환 */
function calcEMA(arr, period) {
  const series = calcEMASeries(arr, period)
  return series.length > 0 ? series[series.length - 1] : null
}

/** EMA 시리즈 전체 반환 */
function calcEMASeries(arr, period) {
  if (arr.length < period) return []
  const k = 2 / (period + 1)
  const result = [arr.slice(0, period).reduce((a, b) => a + b, 0) / period]
  for (let i = period; i < arr.length; i++) {
    result.push(arr[i] * k + result[result.length - 1] * (1 - k))
  }
  return result
}

/** 임의 배열에서 EMA 최종값 */
function calcEMAFromArray(arr, period) {
  if (arr.length < period) return null
  const k = 2 / (period + 1)
  let ema = arr.slice(0, period).reduce((a, b) => a + b, 0) / period
  for (let i = period; i < arr.length; i++) {
    ema = arr[i] * k + ema * (1 - k)
  }
  return ema
}

// =====================================================================
//  포맷 유틸리티
// =====================================================================

function fmtKRW(val) {
  return `${Number(val).toLocaleString('ko-KR')}원`
}

function fmtUSD(val) {
  return `$${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function fmtVolume(val) {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}백만`
  if (val >= 10_000) return `${(val / 10_000).toFixed(1)}만`
  return String(val)
}

function r2(val) {
  return String(Math.round(val * 100) / 100)
}
