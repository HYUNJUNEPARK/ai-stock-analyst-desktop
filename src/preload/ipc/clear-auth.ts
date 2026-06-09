/**
 * clear-auth.ts — 인증 정보 삭제 관련 preload 브릿지
 *
 * 담당 IPC 채널:
 *   renderer → main : clear-auth (저장된 인증 파일 삭제)
 */

import { ipcRenderer } from 'electron'
import { IPC } from '../../shared/ipcChannels'

/**
 * renderer(React)에서 window.api.clearAuth() 형태로 호출할 수 있는 함수.
 * index.ts에서 contextBridge를 통해 window.api에 병합된다.
 */
export const clearAuthApi = {
  /** 저장된 인증 정보를 삭제한다 ('claude' | 'gpt') */
  clearAuth: (model: string): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke(IPC.CLEAR_AUTH, model),
}
