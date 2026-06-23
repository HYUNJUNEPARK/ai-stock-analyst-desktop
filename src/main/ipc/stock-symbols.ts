/**
 * src/main/ipc/stock-symbols.ts — 로컬 종목 마스터 검색 IPC 핸들러
 *
 * 담당 채널:
 *   - search-stock-symbols : 종목명/코드로 로컬 캐시를 검색하여 후보 목록 반환 (양방향)
 *
 * 캐시 파일 위치: ~/.ai-cli-launcher/stock-symbols/local-symbols.json
 * (공공데이터포털 API로 갱신되는 KRX 전체 상장 종목 목록)
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
 * 검색어로 종목 목록을 필터링한다.
 * 종목명, 법인명, 종목코드를 대상으로 매칭하고 관련도 순으로 정렬한다.
 */
function searchSymbols(query: string, limit: number): SymbolRecord[] {
  const symbols = loadSymbols()
  if (!query || symbols.length === 0) return []

  const q = query.toLowerCase().replace(/\s+/g, '')
  const results: Array<{ symbol: SymbolRecord; score: number }> = []

  for (const symbol of symbols) {
    const name = symbol.name.toLowerCase()
    const corp = (symbol.corpName || '').toLowerCase()
    const ticker = symbol.ticker
    let score = 0

    // 종목코드 prefix 매칭 (숫자 입력 시)
    if (ticker.startsWith(q)) {
      score = 200 + (q.length === 6 && ticker === q ? 100 : 0)
    }
    // 종목명 정확 일치
    else if (name === q) {
      score = 150
    }
    // 종목명 prefix 매칭 (가장 자연스러운 자동완성)
    else if (name.startsWith(q)) {
      score = 120 + q.length
    }
    // 법인명 prefix 매칭
    else if (corp && corp.startsWith(q)) {
      score = 100 + q.length
    }
    // 종목명 포함 매칭
    else if (name.includes(q)) {
      score = 70 + q.length
    }
    // 법인명 포함 매칭
    else if (corp && corp.includes(q)) {
      score = 50 + q.length
    }

    if (score > 0) {
      results.push({ symbol, score })
    }
  }

  results.sort((a, b) => b.score - a.score || a.symbol.name.length - b.symbol.name.length)
  return results.slice(0, limit).map((r) => r.symbol)
}

export function registerStockSymbolsHandlers(): void {
  ipcMain.handle(
    IPC.SEARCH_STOCK_SYMBOLS,
    (_event, query: string, limit = 8) => {
      return searchSymbols(query, limit)
    }
  )
}
