import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// ── IPC 이벤트 → 콜백 라우팅 ──
let installProgressCb: ((data: string) => void) | null = null
let installCompleteCb: ((result: { success: boolean; error?: string }) => void) | null = null
let cliLoginProgressCb: ((data: string) => void) | null = null
let cliLoginCompleteCb: ((result: { success: boolean; error?: string }) => void) | null = null
let responseChunkCb: ((chunk: string) => void) | null = null
let responseDoneCb: ((result: { success: boolean; error?: string }) => void) | null = null
let stockAnalysisAgentCb: ((event: { name: string; status: 'running' | 'done' }) => void) | null = null
let stockAnalysisLogCb: ((message: string) => void) | null = null
let stockAnalysisChunkCb: ((chunk: string) => void) | null = null
let stockAnalysisDoneCb: ((result: { success: boolean; error?: string }) => void) | null = null

ipcRenderer.on('install-progress', (_e, data: string) => installProgressCb?.(data))
ipcRenderer.on('install-complete', (_e, result: { success: boolean; error?: string }) =>
  installCompleteCb?.(result)
)
ipcRenderer.on('cli-login-progress', (_e, data: string) => cliLoginProgressCb?.(data))
ipcRenderer.on('cli-login-complete', (_e, result: { success: boolean; error?: string }) =>
  cliLoginCompleteCb?.(result)
)
ipcRenderer.on('prompt-response-chunk', (_e, chunk: string) => responseChunkCb?.(chunk))
ipcRenderer.on('prompt-response-done', (_e, result: { success: boolean; error?: string }) =>
  responseDoneCb?.(result)
)
ipcRenderer.on('stock-analysis-agent', (_e, event: { name: string; status: 'running' | 'done' }) =>
  stockAnalysisAgentCb?.(event)
)
ipcRenderer.on('stock-analysis-log', (_e, message: string) => stockAnalysisLogCb?.(message))
ipcRenderer.on('stock-analysis-chunk', (_e, chunk: string) => stockAnalysisChunkCb?.(chunk))
ipcRenderer.on('stock-analysis-done', (_e, result: { success: boolean; error?: string }) =>
  stockAnalysisDoneCb?.(result)
)

// contextBridge로 API 노출
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', {
      /* CLI 설치 */
      startCliInstall: (model: string) => ipcRenderer.send('start-cli-install', model),
      onInstallProgress: (cb: (data: string) => void) => {
        installProgressCb = cb
      },
      onInstallComplete: (cb: (result: { success: boolean; error?: string }) => void) => {
        installCompleteCb = cb
      },

      /* API 키 관리 */
      // validateApiKey: (params: { model: string; apiKey: string }) =>
      //   ipcRenderer.invoke('validate-api-key', params),
      // saveApiKey: (params: { model: string; apiKey: string }) =>
      //   ipcRenderer.invoke('save-api-key', params),
      // loadApiKey: (model: string) => ipcRenderer.invoke('load-api-key', model),

      /// 보고서 파일 목록 조회
      listGptReportFiles: () => ipcRenderer.invoke('list-gpt-report-files'),

      /* CLI 로그인 */
      runClaudeLogin: () => ipcRenderer.send('run-claude-login'),
      runGptLogin: () => ipcRenderer.send('run-gpt-login'),
      onCliLoginProgress: (cb: (data: string) => void) => {
        cliLoginProgressCb = cb
      },
      onCliLoginComplete: (cb: (result: { success: boolean; error?: string }) => void) => {
        cliLoginCompleteCb = cb
      },

      /* 프롬프트 실행 */
      runPrompt: (params: { model: string; prompt: string; }) =>
        ipcRenderer.send('run-prompt', params),
      onResponseChunk: (cb: (chunk: string) => void) => {
        responseChunkCb = cb
      },
      onResponseDone: (cb: (result: { success: boolean; error?: string }) => void) => {
        responseDoneCb = cb
      },

      /* 주식 멀티 에이전트 분석 */
      runStockAnalysis: (params: { model: string; prompt: string; }) => ipcRenderer.send('run-stock-analysis', params),

      // 분석 취소
      cancelStockAnalysis: () => ipcRenderer.send('cancel-stock-analysis'),
      
      // 분석 에이전트 이벤트
      onStockAnalysisAgent: (cb: (event: { name: string; status: 'running' | 'done' }) => void) => {
        stockAnalysisAgentCb = cb
      },

      // 분석 결과 청크
      onStockAnalysisLog: (cb: (message: string) => void) => {
        stockAnalysisLogCb = cb
      },

      onStockAnalysisChunk: (cb: (chunk: string) => void) => {
        stockAnalysisChunkCb = cb
      },

      // 분석 완료
      onStockAnalysisDone: (cb: (result: { success: boolean; error?: string }) => void) => {
        stockAnalysisDoneCb = cb
      }
    })
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
}
