/**
 * node-install.ts — Node.js 설치 관련 preload 브릿지
 *
 * 담당 IPC 채널:
 *   renderer → main : check-node-status (Node.js 설치 여부 확인)
 *   renderer → main : install-node (Node.js 설치 시작)
 *   main → renderer : node-install-progress (설치 진행 로그)
 *   main → renderer : node-install-complete (설치 완료/실패)
 */
import { ipcRenderer } from 'electron'
import { IPC } from '../../shared/ipcChannels'

let nodeInstallProgressCb: ((data: string) => void) | null = null
let nodeInstallCompleteCb: ((result: { success: boolean; error?: string }) => void) | null = null

export function registerNodeInstallListeners(): void {
  ipcRenderer.on(IPC.NODE_INSTALL_PROGRESS, (_e, data: string) => nodeInstallProgressCb?.(data))
  ipcRenderer.on(IPC.NODE_INSTALL_COMPLETE, (_e, result: { success: boolean; error?: string }) =>
    nodeInstallCompleteCb?.(result)
  )
}

export const nodeInstallApi = {
  /** Node.js 및 npm 설치 상태를 확인한다 */
  checkNodeStatus: () =>
    ipcRenderer.invoke(IPC.CHECK_NODE_STATUS) as Promise<{
      nodeInstalled: boolean
      nodeVersion: string | null
      npmInstalled: boolean
      npmVersion: string | null
    }>,

  /** Node.js 자동 설치를 시작한다 */
  installNode: () => ipcRenderer.send(IPC.INSTALL_NODE),

  /** 설치 진행 로그 콜백 등록 */
  onNodeInstallProgress: (cb: (data: string) => void) => {
    nodeInstallProgressCb = cb
  },

  /** 설치 완료 콜백 등록 */
  onNodeInstallComplete: (cb: (result: { success: boolean; error?: string }) => void) => {
    nodeInstallCompleteCb = cb
  }
}
