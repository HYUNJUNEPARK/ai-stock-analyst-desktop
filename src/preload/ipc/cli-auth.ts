/**
 * cli-auth.ts — CLI 로그인 인증 관련 preload 브릿지
 *
 * 담당 IPC 채널:
 *   renderer → main : run-claude-login (Claude 로그인 시작), run-gpt-login (GPT 로그인 시작)
 *   main → renderer : cli-login-progress (로그인 진행 로그), cli-login-complete (로그인 완료/실패)
 */

import { ipcRenderer } from 'electron'

// main → renderer 이벤트를 받아 실행할 콜백 함수 보관소
// renderer에서 onCliLoginProgress / onCliLoginComplete를 호출해 콜백을 등록하면 여기에 저장된다
let cliLoginProgressCb: ((data: string) => void) | null = null
let cliLoginCompleteCb: ((result: { success: boolean; error?: string }) => void) | null = null

/**
 * main → renderer 방향 IPC 이벤트를 리스닝한다.
 * index.ts 최상단에서 한 번만 호출되며, 이후 콜백이 등록되면 자동으로 실행된다.
 */
export function registerCliAuthListeners(): void {
  // 로그인 진행 중 터미널 출력 로그를 스트리밍으로 수신
  ipcRenderer.on('cli-login-progress', (_e, data: string) => cliLoginProgressCb?.(data))
  // 로그인 완료(성공 또는 실패) 결과 수신
  ipcRenderer.on('cli-login-complete', (_e, result: { success: boolean; error?: string }) =>
    cliLoginCompleteCb?.(result)
  )
}

/**
 * renderer(React)에서 window.api.xxx() 형태로 호출할 수 있는 CLI 로그인 관련 함수 모음.
 * index.ts에서 contextBridge를 통해 window.api에 병합된다.
 */
export const cliAuthApi = {
  /** Claude CLI 로그인 프로세스를 시작한다 (단방향, 응답 없음) */
  runClaudeLogin: () => ipcRenderer.send('run-claude-login'),

  /** GPT(Codex) CLI 로그인 프로세스를 시작한다 (단방향, 응답 없음) */
  runGptLogin: () => ipcRenderer.send('run-gpt-login'),

  /** 로그인 진행 로그가 올 때마다 실행할 콜백을 등록한다 */
  onCliLoginProgress: (cb: (data: string) => void) => {
    cliLoginProgressCb = cb
  },

  /** 로그인 완료(성공/실패) 시 실행할 콜백을 등록한다 */
  onCliLoginComplete: (cb: (result: { success: boolean; error?: string }) => void) => {
    cliLoginCompleteCb = cb
  },
}
