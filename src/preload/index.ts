import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// ── IPC 이벤트 → 콜백 라우팅 ──
let installProgressCb: ((data: string) => void) | null = null
let installCompleteCb: ((result: { success: boolean; error?: string }) => void) | null = null
let cliLoginProgressCb: ((data: string) => void) | null = null
let cliLoginCompleteCb: ((result: { success: boolean }) => void) | null = null
let responseChunkCb: ((chunk: string) => void) | null = null
let responseDoneCb: ((result: { success: boolean; error?: string }) => void) | null = null

ipcRenderer.on('install-progress', (_e, data: string) => installProgressCb?.(data))
ipcRenderer.on('install-complete', (_e, result: { success: boolean; error?: string }) =>
  installCompleteCb?.(result)
)
ipcRenderer.on('cli-login-progress', (_e, data: string) => cliLoginProgressCb?.(data))
ipcRenderer.on('cli-login-complete', (_e, result: { success: boolean }) =>
  cliLoginCompleteCb?.(result)
)
ipcRenderer.on('prompt-response-chunk', (_e, chunk: string) => responseChunkCb?.(chunk))
ipcRenderer.on('prompt-response-done', (_e, result: { success: boolean; error?: string }) =>
  responseDoneCb?.(result)
)

// ── contextBridge 노출 ──
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
      validateApiKey: (params: { model: string; apiKey: string }) =>
        ipcRenderer.invoke('validate-api-key', params),
      saveApiKey: (params: { model: string; apiKey: string }) =>
        ipcRenderer.invoke('save-api-key', params),
      loadApiKey: () => ipcRenderer.invoke('load-api-key'),

      /* Claude CLI 로그인 */
      runClaudeLogin: () => ipcRenderer.send('run-claude-login'),
      onCliLoginProgress: (cb: (data: string) => void) => {
        cliLoginProgressCb = cb
      },
      onCliLoginComplete: (cb: (result: { success: boolean }) => void) => {
        cliLoginCompleteCb = cb
      },

      /* 프롬프트 실행 */
      runPrompt: (params: { model: string; prompt: string; apiKey: string }) =>
        ipcRenderer.send('run-prompt', params),
      onResponseChunk: (cb: (chunk: string) => void) => {
        responseChunkCb = cb
      },
      onResponseDone: (cb: (result: { success: boolean; error?: string }) => void) => {
        responseDoneCb = cb
      }
    })
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
}
