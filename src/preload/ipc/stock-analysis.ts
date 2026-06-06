/**
 * stock-analysis.ts — 주식 멀티 에이전트 분석 관련 preload 브릿지
 *
 * 담당 IPC 채널:
 *   renderer → main : run-stock-analysis (분석 시작), cancel-stock-analysis (분석 취소)
 *   main → renderer : stock-analysis-agent (에이전트 상태 변경),
 *                     stock-analysis-chunk (분석 결과 텍스트 스트리밍),
 *                     stock-analysis-done  (분석 완료/실패)
 */

import { ipcRenderer } from 'electron'
import { IPC } from '../../shared/ipcChannels'

// main → renderer 이벤트를 받아 실행할 콜백 함수 보관소
// renderer에서 onStockAnalysis* 함수를 호출해 콜백을 등록하면 여기에 저장된다
let stockAnalysisAgentCb: ((event: { name: string; status: 'running' | 'done' }) => void) | null =
  null
let stockAnalysisChunkCb: ((chunk: string) => void) | null = null
let stockAnalysisDoneCb: ((result: {
  success: boolean
  error?: string
  errorLog?: string
  authRequired?: boolean
}) => void) | null = null

/**
 * main → renderer 방향 IPC 이벤트를 리스닝한다.
 * index.ts 최상단에서 한 번만 호출되며, 이후 콜백이 등록되면 자동으로 실행된다.
 */
export function registerStockAnalysisListeners(): void {
  // 개별 에이전트의 실행 상태(running / done) 변경 이벤트 수신
  ipcRenderer.on(
    IPC.STOCK_ANALYSIS_AGENT,
    (_e, event: { name: string; status: 'running' | 'done' }) => stockAnalysisAgentCb?.(event)
  )
  // 분석 결과 텍스트를 청크 단위로 스트리밍 수신
  ipcRenderer.on(IPC.STOCK_ANALYSIS_CHUNK, (_e, chunk: string) => stockAnalysisChunkCb?.(chunk))
  // 전체 분석 완료(성공 또는 오류) 신호 수신
  ipcRenderer.on(
    IPC.STOCK_ANALYSIS_DONE,
    (_e, result: { success: boolean; error?: string; errorLog?: string; authRequired?: boolean }) =>
      stockAnalysisDoneCb?.(result)
  )
}

/**
 * renderer(React)에서 window.api.xxx() 형태로 호출할 수 있는 주식 분석 관련 함수 모음.
 * index.ts에서 contextBridge를 통해 window.api에 병합된다.
 */
export const stockAnalysisApi = {
  /** 선택한 model로 주식 멀티 에이전트 분석을 시작한다 (단방향, 결과는 이벤트로 수신) */
  runStockAnalysis: (params: { model: string; prompt: string }) =>
    ipcRenderer.send(IPC.RUN_STOCK_ANALYSIS, params),

  /** 진행 중인 주식 분석을 취소한다 (단방향) */
  cancelStockAnalysis: () => ipcRenderer.send(IPC.CANCEL_STOCK_ANALYSIS),

  /** 에이전트 상태(running/done)가 변경될 때마다 실행할 콜백을 등록한다 */
  onStockAnalysisAgent: (cb: (event: { name: string; status: 'running' | 'done' }) => void) => {
    stockAnalysisAgentCb = cb
  },

  /** 분석 결과 텍스트 청크가 도착할 때마다 실행할 콜백을 등록한다 */
  onStockAnalysisChunk: (cb: (chunk: string) => void) => {
    stockAnalysisChunkCb = cb
  },

  /** 전체 분석이 완료(성공/실패)됐을 때 실행할 콜백을 등록한다 */
  onStockAnalysisDone: (cb: (result: {
    success: boolean
    error?: string
    errorLog?: string
    authRequired?: boolean
  }) => void) => {
    stockAnalysisDoneCb = cb
  },
}
