import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

/**
 * contextBridge를 통해 main process의 기능을 renderer(React)에 안전하게 노출하는 실제 구현하기 위해 작성됨
 */

//콜백 변수 선언: main → renderer 방향의 이벤트를 받을 콜백 함수들을 전역 변수로 보관한다.
let installProgressCb: ((data: string) => void) | null = null
let installCompleteCb: ((result: { success: boolean; error?: string }) => void) | null = null
let cliLoginProgressCb: ((data: string) => void) | null = null
let cliLoginCompleteCb: ((result: { success: boolean; error?: string }) => void) | null = null
let responseChunkCb: ((chunk: string) => void) | null = null
let responseDoneCb: ((result: { success: boolean; error?: string }) => void) | null = null
let stockAnalysisAgentCb: ((event: { name: string; status: 'running' | 'done' }) => void) | null = null
let stockAnalysisChunkCb: ((chunk: string) => void) | null = null
let stockAnalysisDoneCb: ((result: { success: boolean; error?: string }) => void) | null = null

/**
 * ipcRenderer.on :이벤트 수신
 * IPC 이벤트 수신 등록: main process가 보내는 이벤트를 항상 리스닝하고, 콜백이 등록되어 있으면 실행한다.
 */
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
ipcRenderer.on('stock-analysis-chunk', (_e, chunk: string) => stockAnalysisChunkCb?.(chunk))
ipcRenderer.on('stock-analysis-done', (_e, result: { success: boolean; error?: string }) =>
  stockAnalysisDoneCb?.(result)
)

/**
 * contextBridge로 API 노출
 * 
 * ipcRenderer.send : 응답을 기다리지 않는 요청, 단방향
 * ipcRenderer.invoke : 응답을 기다리는 요청, 양방향
 * 
 *  
 * window.api 객체에 여러 함수들을 정의하여 renderer에서 사용할 수 있도록 노출한다.
 * 예를 들어, window.api.runPrompt(...) 같은 함수를 renderer에서 호출하면 ipcRenderer.send('run-prompt', params)로 main process에 이벤트가 전달된다.
 * main process에서는 이 이벤트를 받아서 처리하고, 필요하면 다시 renderer로 결과를 보낼 수 있다.
 * 
 * TypeScript 타입 선언은 src/preload/index.d.ts에 정의되어 있다. 이 구현 파일에서는 실제로 함수들이 어떻게 동작하는지만 작성하면 된다.
 */
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

      /* CLI 설치/인증 상태 확인 */
      checkCliStatus: (model: string) => ipcRenderer.invoke('check-cli-status', model),

      /* CLI stats 조회 */
      checkCliStats: (model: string) => ipcRenderer.invoke('check-cli-stats', model),

      /// 보고서 파일 목록 조회
      listGptReportFiles: () => ipcRenderer.invoke('list-gpt-report-files'),

      /// 보고서 파일 내용 읽기
      readGptReportFile: (name: string) => ipcRenderer.invoke('read-gpt-report-file', name),

      /// 보고서 상세 새 창 열기
      openReportDetailWindow: (name: string) => ipcRenderer.invoke('open-report-detail-window', name),

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
