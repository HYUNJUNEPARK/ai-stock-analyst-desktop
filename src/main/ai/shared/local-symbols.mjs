/**
 * shared/local-symbols.mjs — 한국 상장 종목 로컬 검증 모듈 (AI 모델 공통)
 *
 * input-validator AI 에이전트를 대체하여, 공공데이터포털에서 가져온
 * KRX 상장 종목 캐시를 이용해 사용자 입력을 즉시 검증한다.
 *
 * 전체 흐름:
 *   사용자 입력 ("삼성전자 분석해줘")
 *     → validateWithLocalSymbols()
 *       → loadLocalSymbols()     : 캐시 파일 로드 (만료 시 API 갱신)
 *       → resolveKrSymbol()      : 종목명/코드 매칭
 *     → 매칭 성공: { valid: true, company, ticker, market } 반환
 *     → 매칭 실패: null 반환 (AI fallback으로 넘어감)
 *
 * 데이터 소스:
 *   공공데이터포털 "금융위원회_주식기본정보" API
 *   https://www.data.go.kr/data/15094775/openapi.do
 *
 * 캐시 위치:
 *   ~/.ai-cli-launcher/stock-symbols/local-symbols.json (24시간 TTL)
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import path from 'node:path'
import {
  buildPublicDataUrl,
  fetchPublicDataPage,
  toArray
} from './public-data-api.mjs'
import { PUBLIC_DATA_API } from './constants.mjs'

// ── 캐시 설정 ────────────────────────────────────────────────────────
const symbolCacheDir =
  process.env.STOCK_SYMBOL_CACHE_DIR ||
  path.join(homedir(), '.ai-cli-launcher', 'stock-symbols')
const symbolCachePath = path.join(symbolCacheDir, 'local-symbols.json')
/** 캐시 유효 기간: 24시간. 이 시간이 지나면 API에서 새로 가져온다. */
const CACHE_TTL_MS = 24 * 60 * 60 * 1000

// =====================================================================
//  공개 API — analyze-stock.mjs에서 호출하는 함수들
// =====================================================================

/**
 * 한국 상장 종목을 로컬 종목 마스터(공공데이터포털 캐시)로 검증한다.
 *
 * @param {object} params
 * @param {object} params.context   - 분석 컨텍스트 (REQUEST, COMPANY, TICKER, MARKET)
 * @param {string} params.outputPath - 검증 결과를 저장할 파일 경로
 * @returns {object|null} 매칭 성공 시 검증 결과 객체, 실패 시 null
 *
 * null을 반환하는 경우 (= AI fallback 필요):
 *   - 미국 시장 요청
 *   - 캐시가 비어있고 API도 실패
 *   - 종목명 매칭 실패 (약칭, 모호한 입력 등)
 *   - 예외 발생
 */
export async function validateWithLocalSymbols({ context, outputPath }) {
  try {
    // 현재 로컬 마스터는 한국(KRX) 종목만 보유. 미국 시장은 AI에 맡긴다.
    if (isUsMarket(context.MARKET)) return null

    const symbols = await loadLocalSymbols()
    if (symbols.length === 0) return null

    const match = resolveKrSymbol(
      context.REQUEST,
      context.COMPANY,
      context.TICKER,
      symbols
    )
    if (!match) return null

    const result = {
      valid: true,
      company: match.name,
      ticker: match.ticker,
      market: match.market,
      source: 'local-symbols',
      reason: `${match.name}(${match.ticker}) 종목을 로컬 종목 마스터에서 확인했습니다.`
    }
    await writeFile(outputPath, JSON.stringify(result, null, 2), 'utf8')
    console.log(
      `[validator] local-symbols matched: ${match.name} (${match.ticker}, ${match.market})`
    )
    return result
  } catch (err) {
    console.warn(
      `[경고] 로컬 종목 검증 실패. AI 입력 검증으로 대체합니다. (${err?.message ?? 'unknown'})`
    )
    return null
  }
}

// =====================================================================
//  캐시 관리 — 로컬 파일 ↔ 공공데이터포털 API
// =====================================================================

/**
 * 로컬 종목 마스터를 로드한다.
 *
 * 우선순위:
 *   1. 24시간 이내 캐시가 있으면 → 파일에서 로드 (API 호출 없음)
 *   2. 캐시가 없거나 만료 → 공공데이터포털 API로 전체 종목 갱신
 *   3. API도 실패 → 만료된 캐시라도 반환 (오프라인 대응)
 *   4. 캐시도 없고 API도 실패 → 빈 배열
 */
async function loadLocalSymbols() {
  const cached = await readSymbolCache()
  if (cached && Date.now() - cached.updatedAt < CACHE_TTL_MS) {
    return cached.symbols
  }

  const refreshed = await fetchKrStockBasicInfo()
  if (refreshed.length > 0) {
    await writeSymbolCache(refreshed)
    return refreshed
  }

  return cached?.symbols ?? []
}

/**
 * 캐시 파일(local-symbols.json)을 읽어 파싱한다.
 *
 * 파일 구조:
 *   {
 *     "updatedAt": "2026-06-23T03:26:39.738Z",
 *     "source": "금융위원회_주식기본정보",
 *     "symbols": [{ ticker, name, market, isin, corpName }, ...]
 *   }
 *
 * @returns {{ updatedAt: number, symbols: Array }|null} 파일이 없거나 깨졌으면 null
 */
async function readSymbolCache() {
  if (!existsSync(symbolCachePath)) return null

  try {
    const parsed = JSON.parse(await readFile(symbolCachePath, 'utf8'))
    if (!Array.isArray(parsed.symbols)) return null

    return {
      updatedAt: Date.parse(parsed.updatedAt || '') || 0,
      symbols: parsed.symbols.map(normalizeSymbolRecord).filter(Boolean)
    }
  } catch {
    return null
  }
}

/** 종목 목록을 캐시 파일에 저장한다. */
async function writeSymbolCache(symbols) {
  await mkdir(symbolCacheDir, { recursive: true })
  await writeFile(
    symbolCachePath,
    JSON.stringify(
      {
        updatedAt: new Date().toISOString(),
        source: '금융위원회_주식기본정보',
        symbols
      },
      null,
      2
    ),
    'utf8'
  )
}

// =====================================================================
//  공공데이터포털 API 호출
// =====================================================================

/**
 * 공공데이터포털 "금융위원회_주식기본정보" API로 KRX 전체 상장 종목을 가져온다.
 *
 * 주요 동작:
 *   1. DATA_GO_KR_SERVICE_KEY 환경변수에서 인증키 확인
 *   2. findLatestBasDt()로 데이터가 존재하는 최신 거래일 탐색
 *   3. 해당 날짜의 전체 종목을 페이지네이션으로 수집 (~2,700개)
 *   4. 종목코드 기준 중복 제거 후 반환
 *
 * 중요: basDt(기준일자)를 지정하지 않으면 API가 모든 날짜의 히스토리(400만건+)를
 * 반환하므로, 반드시 특정 날짜를 지정해야 한다.
 */
async function fetchKrStockBasicInfo() {
  const serviceKey = (
    process.env.DATA_GO_KR_SERVICE_KEY ||
    process.env.PUBLIC_DATA_SERVICE_KEY ||
    ''
  ).trim()
  if (!serviceKey) {
    console.warn(
      '[validator] DATA_GO_KR_SERVICE_KEY 미설정. 로컬 캐시가 없으면 AI 입력 검증을 사용합니다.'
    )
    return []
  }

  const basDt = await findLatestBasDt(serviceKey)
  if (!basDt) {
    console.warn('[validator] 최근 7일 내 주식기본정보를 찾을 수 없습니다.')
    return []
  }

  const symbols = []
  const numOfRows = 3000
  let totalCount = 0

  for (let pageNo = 1; pageNo <= 5; pageNo += 1) {
    const url = buildPublicDataUrl(PUBLIC_DATA_API.KR_STOCK_BASIC_INFO, serviceKey, {
      pageNo,
      numOfRows,
      basDt,
      resultType: 'json'
    })
    const { body } = await fetchPublicDataPage(url)
    const items = toArray(body?.items?.item)
      .map(normalizeSymbolRecord)
      .filter(Boolean)

    symbols.push(...items)
    totalCount = Number(body?.totalCount || symbols.length)
    if (symbols.length >= totalCount || items.length === 0) break
  }

  // 같은 종목코드가 중복될 경우 마지막 응답 기준으로 하나만 보관
  const deduped = new Map()
  for (const symbol of symbols) {
    if (symbol.ticker) deduped.set(symbol.ticker, symbol)
  }

  console.log(
    `[validator] local-symbols refreshed: ${deduped.size} items (basDt=${basDt})`
  )
  return [...deduped.values()]
}

/**
 * 데이터가 존재하는 가장 최근 거래일(basDt)을 찾는다.
 *
 * 주말·공휴일에는 해당 날짜의 데이터가 없으므로, 오늘부터 7일 전까지
 * 역순으로 시도하여 totalCount > 0인 첫 번째 날짜를 반환한다.
 *
 * 예: 일요일에 실행 → 일(0건) → 토(0건) → 금(2,700건) → '금요일' 반환
 */
async function findLatestBasDt(serviceKey) {
  for (let daysAgo = 0; daysAgo < 7; daysAgo += 1) {
    const d = new Date(Date.now() - daysAgo * 86_400_000)
    const basDt = d.toISOString().slice(0, 10).replace(/-/g, '')
    const url = buildPublicDataUrl(PUBLIC_DATA_API.KR_STOCK_BASIC_INFO, serviceKey, {
      pageNo: 1,
      numOfRows: 1,
      basDt,
      resultType: 'json'
    })
    try {
      const { body } = await fetchPublicDataPage(url)
      if (Number(body?.totalCount) > 0) return basDt
    } catch {
      // 이 날짜는 데이터가 없거나 API 오류 — 다음 날짜 시도
    }
  }
  return null
}

// =====================================================================
//  종목 매칭 — 사용자 입력 → 종목 마스터에서 찾기
// =====================================================================

/**
 * 사용자 입력을 종목 마스터와 매칭하여 가장 적합한 종목을 찾는다.
 *
 * 매칭 전략 (우선순위):
 *   1. 6자리 종목코드가 있으면 → 코드로 직접 매칭 (가장 확실)
 *   2. 종목명/법인명 기반 점수 매칭:
 *      - 120점: 회사명과 종목명 정확 일치       (예: "삼성전자" == "삼성전자")
 *      - 110점: 회사명과 법인명 정확 일치       (예: "삼성전자" == corpName)
 *      -  90+점: 요청문에 종목명 포함           (예: "삼성전자 분석해줘"에 "삼성전자")
 *      -  80+점: 요청문에 법인명 포함
 *      -  50+점: 종목명이 회사명을 부분 포함    (예: "삼성" → "삼성전자")
 *   3. 동점 후보 2개 이상 → null (잘못된 확정보다 AI fallback이 안전)
 *   4. 최고 점수 50 미만 → null (매칭 확신 부족)
 *
 * @param {string} request  - 사용자 원문 입력 (예: "삼성전자 분석해줘")
 * @param {string} company  - 파싱된 회사명 (예: "삼성전자")
 * @param {string} ticker   - 파싱된 종목코드 (예: "005930" 또는 빈 문자열)
 * @param {Array}  symbols  - 종목 마스터 배열
 * @returns {object|null}   - 매칭된 종목 객체 또는 null
 */
function resolveKrSymbol(request, company, ticker, symbols) {
  // 6자리 종목코드가 명시된 경우 → 코드 매칭 우선
  const requestedTicker = /^\d{6}$/.test(String(ticker || ''))
    ? String(ticker)
    : extractKrTicker(request)
  if (requestedTicker && /^\d{6}$/.test(requestedTicker)) {
    return symbols.find((s) => s.ticker === requestedTicker) ?? null
  }

  // 이름 기반 점수 매칭
  const requestKey = normalizeSearchText(request)
  const companyKey = normalizeSearchText(company)
  const candidates = []

  for (const symbol of symbols) {
    const nameKey = normalizeSearchText(symbol.name)
    const corpKey = normalizeSearchText(symbol.corpName)
    let score = 0

    if (companyKey && nameKey === companyKey)
      score = Math.max(score, 120)
    if (companyKey && corpKey && corpKey === companyKey)
      score = Math.max(score, 110)
    if (requestKey.includes(nameKey))
      score = Math.max(score, 90 + nameKey.length)
    if (corpKey && requestKey.includes(corpKey))
      score = Math.max(score, 80 + corpKey.length)
    if (companyKey && nameKey.includes(companyKey) && companyKey.length >= 2)
      score = Math.max(score, 50 + companyKey.length)

    if (score > 0) candidates.push({ symbol, score })
  }

  candidates.sort(
    (a, b) => b.score - a.score || b.symbol.name.length - a.symbol.name.length
  )
  if (candidates.length === 0) return null

  const [best, second] = candidates
  if (second && best.score === second.score) {
    console.warn(
      `[validator] 종목명이 모호합니다: ${best.symbol.name}, ${second.symbol.name}`
    )
    return null
  }

  return best.score >= 50 ? best.symbol : null
}

// =====================================================================
//  유틸리티 (내부용)
// =====================================================================

/**
 * 공공데이터포털 API 응답의 종목 레코드를 앱 내부 형식으로 변환한다.
 *
 * API 응답 필드 → 내부 필드:
 *   srtnCd  (A005930) → ticker (005930)  — 앞의 시장 접두어 'A' 제거
 *   itmsNm  (삼성전자) → name
 *   mrktCtg (KOSPI)   → market
 *   isinCd            → isin
 *   corpNm            → corpName
 *
 * @returns {object|null} 유효하지 않으면 null (필터 대상)
 */
function normalizeSymbolRecord(raw) {
  if (!raw || typeof raw !== 'object') return null

  const rawTicker = String(raw.srtnCd || raw.ticker || '').trim()
  const ticker = rawTicker.replace(/^[A-Za-z]/, '')
  const name = String(raw.itmsNm || raw.name || '').trim()
  if (!/^\d{6}$/.test(ticker) || !name) return null

  return {
    ticker,
    name,
    market: String(raw.mrktCtg || raw.market || 'KR').trim() || 'KR',
    isin: String(raw.isinCd || raw.isin || '').trim(),
    corpName: String(raw.corpNm || raw.corpName || '').trim()
  }
}

/**
 * 검색용 텍스트 정규화.
 * 대소문자·공백·특수문자를 제거하고, "분석해줘" 같은 액션 불용어도 제거한다.
 * 예: "삼성전자 분석해줘!" → "삼성전자"
 */
function normalizeSearchText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[()[\]{}.,·ㆍ/_-]/g, '')
    .replace(
      /주식회사|주식|보통주|우선주|분석|리포트|전망|종목|매수|매도|알려줘|해줘|해주세요/g,
      ''
    )
    .trim()
}

/** 텍스트에서 한국 종목코드(6자리 숫자)를 추출한다. 없으면 null. */
function extractKrTicker(text) {
  const match = String(text || '').match(/\b\d{6}\b/)
  return match?.[0] ?? null
}

/** 시장 값에 미국 시장 키워드가 포함되어 있는지 판별한다. */
function isUsMarket(market) {
  return /(^|[\s,])us([\s,]|$)|미국|nasdaq|nyse|amex/i.test(String(market || ''))
}
