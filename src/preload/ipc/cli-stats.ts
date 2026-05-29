/**
 * cli-stats.ts — CLI 사용 통계 관련 preload 브릿지
 *
 * 담당 IPC 채널 (모두 양방향 invoke — 결과를 Promise로 반환):
 *   check-cli-stats : 모델별 CLI 사용 통계 조회
 *   get-model-info  : 선택된 모델의 구체적인 모델명 조회
 *
 * ※ main → renderer 방향 이벤트가 없으므로 리스너 등록 함수는 없다.
 */

import { ipcRenderer } from 'electron'
import { IPC } from '../../shared/ipcChannels'

/**
 * renderer(React)에서 window.api.xxx() 형태로 호출할 수 있는 CLI 통계 관련 함수 모음.
 * index.ts에서 contextBridge를 통해 window.api에 병합된다.
 */
export const cliStatsApi = {
  /** 선택한 model의 CLI 사용 통계(토큰, 비용 등)를 조회한다 */
  checkCliStats: (model: string) => ipcRenderer.invoke(IPC.CHECK_CLI_STATS, model),

  /** 선택된 모델의 구체적인 모델명을 반환한다 */
  getModelInfo: (model: string) => ipcRenderer.invoke(IPC.GET_MODEL_INFO, model),
}
