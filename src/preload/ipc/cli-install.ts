/**
 * cli-install.ts — CLI 설치 관련 preload 브릿지
 *
 * 담당 IPC 채널:
 *   renderer → main : start-cli-install (설치 시작), check-cli-status (설치/인증 상태 확인)
 *   main → renderer : install-progress (설치 로그 스트리밍), install-complete (설치 완료/실패)
 */

import { ipcRenderer } from 'electron'
import { IPC } from '../../shared/ipcChannels'

// main → renderer 이벤트를 받아 실행할 콜백 함수 보관소
// renderer에서 onInstallProgress / onInstallComplete를 호출해 콜백을 등록하면 여기에 저장된다
let installProgressCb: ((data: string) => void) | null = null
let installCompleteCb: ((result: { success: boolean; error?: string }) => void) | null = null

/**
 * main → renderer 방향 IPC 이벤트를 리스닝한다.
 * index.ts 최상단에서 한 번만 호출되며, 이후 콜백이 등록되면 자동으로 실행된다.
 */
export function registerCliInstallListeners(): void {
  // 설치 진행 중 로그를 스트리밍으로 수신
  ipcRenderer.on(IPC.INSTALL_PROGRESS, (_e, data: string) => installProgressCb?.(data))
  // 설치 완료(성공 또는 실패) 결과 수신
  ipcRenderer.on(IPC.INSTALL_COMPLETE, (_e, result: { success: boolean; error?: string }) =>
    installCompleteCb?.(result)
  )
}

/**
 * renderer(React)에서 window.api.xxx() 형태로 호출할 수 있는 CLI 설치 관련 함수 모음.
 * index.ts에서 contextBridge를 통해 window.api에 병합된다.
 */
export const cliInstallApi = {
  /** 선택한 model에 맞는 CLI npm 패키지 설치를 시작한다 (단방향, 응답 없음) */
  startCliInstall: (model: string) => ipcRenderer.send(IPC.START_CLI_INSTALL, model),

  /** 설치 로그가 올 때마다 실행할 콜백을 등록한다 */
  onInstallProgress: (cb: (data: string) => void) => {
    installProgressCb = cb
  },

  /** 설치 완료(성공/실패) 시 실행할 콜백을 등록한다 */
  onInstallComplete: (cb: (result: { success: boolean; error?: string }) => void) => {
    installCompleteCb = cb
  },

  /** CLI 설치 여부 및 인증 상태를 조회한다 (양방향, 결과 반환) */
  checkCliStatus: (model: string) => ipcRenderer.invoke(IPC.CHECK_CLI_STATUS, model),
}
