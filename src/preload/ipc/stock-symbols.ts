/**
 * stock-symbols.ts — 로컬 종목 마스터 검색 preload 브릿지
 *
 * 담당 IPC 채널 (양방향 invoke):
 *   search-stock-symbols : 종목명/코드로 캐시 검색, 자동완성 후보 반환
 */

import { ipcRenderer } from 'electron'
import { IPC } from '../../shared/ipcChannels'

export const stockSymbolsApi = {
  /** 종목명 또는 코드로 로컬 캐시를 검색하여 후보 목록을 반환한다 */
  searchStockSymbols: (query: string, limit?: number) =>
    ipcRenderer.invoke(IPC.SEARCH_STOCK_SYMBOLS, query, limit)
}
