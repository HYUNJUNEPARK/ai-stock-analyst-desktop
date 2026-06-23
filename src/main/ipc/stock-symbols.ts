/**
 * src/main/ipc/stock-symbols.ts — 종목 검색 IPC 핸들러
 *
 * 담당 채널:
 *   - search-stock-symbols : 종목명/코드로 검색하여 후보 목록 반환 (양방향)
 *
 * 검색 소스:
 *   1. 한국 종목: 로컬 캐시 (~/.ai-cli-launcher/stock-symbols/local-symbols.json)
 *   2. 미국 종목: Finnhub API (/search)
 *
 * 한국 종목은 로컬 캐시에서 즉시 검색하고, 영문 입력이면 Finnhub API로
 * 미국 종목을 추가 검색하여 결과를 병합한다.
 */

import { ipcMain } from 'electron'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'
import { IPC } from '../../shared/ipcChannels'

interface SymbolRecord {
  ticker: string
  name: string
  market: string
  isin: string
  corpName: string
}

const symbolCacheDir = process.env.STOCK_SYMBOL_CACHE_DIR || join(homedir(), '.ai-cli-launcher', 'stock-symbols')
const symbolCachePath = join(symbolCacheDir, 'local-symbols.json')

/** 메모리에 올라간 종목 목록 (최초 검색 시 파일에서 로드) */
let cachedSymbols: SymbolRecord[] | null = null
let cacheLoadedAt = 0
const CACHE_RELOAD_INTERVAL_MS = 60 * 60 * 1000 // 1시간마다 파일 재로드

function loadSymbols(): SymbolRecord[] {
  if (cachedSymbols && Date.now() - cacheLoadedAt < CACHE_RELOAD_INTERVAL_MS) {
    return cachedSymbols
  }

  if (!existsSync(symbolCachePath)) return []

  try {
    const parsed = JSON.parse(readFileSync(symbolCachePath, 'utf8'))
    if (!Array.isArray(parsed.symbols)) return []
    const symbols: SymbolRecord[] = parsed.symbols.filter(
      (s: SymbolRecord) => s.ticker && s.name
    )
    cachedSymbols = symbols
    cacheLoadedAt = Date.now()
    return symbols
  } catch {
    return []
  }
}

/**
 * 한국 종목: 로컬 캐시에서 종목명/코드/법인명으로 검색하고 관련도 순으로 정렬한다.
 */
function searchKrSymbols(query: string, limit: number): SymbolRecord[] {
  const symbols = loadSymbols()
  if (!query || symbols.length === 0) return []

  const q = query.toLowerCase().replace(/\s+/g, '')
  const results: Array<{ symbol: SymbolRecord; score: number }> = []

  for (const symbol of symbols) {
    const name = symbol.name.toLowerCase()
    const corp = (symbol.corpName || '').toLowerCase()
    const ticker = symbol.ticker
    let score = 0

    if (ticker.startsWith(q)) {
      score = 200 + (q.length === 6 && ticker === q ? 100 : 0)
    } else if (name === q) {
      score = 150
    } else if (name.startsWith(q)) {
      score = 120 + q.length
    } else if (corp && corp.startsWith(q)) {
      score = 100 + q.length
    } else if (name.includes(q)) {
      score = 70 + q.length
    } else if (corp && corp.includes(q)) {
      score = 50 + q.length
    }

    if (score > 0) {
      results.push({ symbol, score })
    }
  }

  results.sort((a, b) => b.score - a.score || a.symbol.name.length - b.symbol.name.length)
  return results.slice(0, limit).map((r) => r.symbol)
}

// ── Finnhub API (미국 종목) ──────────────────────────────────────────

/** 영문(라틴 알파벳) 입력인지 판별한다. */
function isLatinQuery(query: string): boolean {
  return /^[a-zA-Z]/.test(query)
}

/**
 * 미국 종목: Finnhub /search API로 검색한다.
 * 영문 입력이 아니거나 API 키가 없으면 빈 배열을 반환한다.
 */
async function searchUsSymbols(query: string, limit: number): Promise<SymbolRecord[]> {
  if (!isLatinQuery(query)) return []

  const apiKey = (process.env.FINNHUB_API_KEY || '').trim()
  if (!apiKey) return []

  try {
    const url = `https://finnhub.io/api/v1/search?q=${encodeURIComponent(query)}&token=${apiKey}`
    const response = await fetch(url)
    if (!response.ok) return []

    const data = await response.json()
    const results = (data.result || []) as Array<{
      symbol: string
      description: string
      type: string
    }>

    // 미국 보통주만 필터 (해외 거래소 제외)
    const filtered = results
      .filter((r) => r.type === 'Common Stock' && !r.symbol.includes('.'))
      .map((r) => ({
        ticker: r.symbol,
        name: r.description,
        market: 'US',
        isin: '',
        corpName: ''
      }))

    return filtered.slice(0, limit)
  } catch {
    return []
  }
}

export function registerStockSymbolsHandlers(): void {
  ipcMain.handle(
    IPC.SEARCH_STOCK_SYMBOLS,
    async (_event, query: string, limit = 8, market = 'auto') => {
      // 시장 지정 시 해당 소스만 검색
      if (market === 'kr') return searchKrSymbols(query, limit)
      if (market === 'us') return searchUsSymbols(query, limit)

      // auto: 한국 종목 우선, 부족하면 미국 종목 병합
      const krResults = searchKrSymbols(query, limit)
      if (krResults.length >= limit) return krResults

      const remaining = limit - krResults.length
      const usResults = await searchUsSymbols(query, remaining)

      return [...krResults, ...usResults].slice(0, limit)
    }
  )
}
