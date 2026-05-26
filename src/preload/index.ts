/**
 * preload/index.ts — contextBridge 통합 진입점
 *
 * 역할:
 *   1. 각 기능 모듈의 IPC 이벤트 리스너를 일괄 등록한다 (main → renderer 수신 준비).
 *   2. 각 모듈의 api 객체를 병합해 window.api로 renderer에 안전하게 노출한다.
 *
 * 새 IPC 채널을 추가할 때:
 *   1. preload/ 하위에 새 파일을 만들어 register*Listeners + *Api를 구현한다.
 *   2. 이 파일에서 import 후 리스너 등록 및 api 병합에 추가한다.
 *   3. src/preload/index.d.ts의 window.api 타입도 함께 업데이트한다.
 */
import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { registerCliInstallListeners, cliInstallApi } from './ipc/cli-install'
import { registerCliAuthListeners, cliAuthApi } from './ipc/cli-auth'
import { cliStatsApi } from './ipc/cli-stats'
import { registerPromptListeners, promptApi } from './ipc/prompt'
import { registerStockAnalysisListeners, stockAnalysisApi } from './ipc/stock-analysis'

// main → renderer 방향 IPC 이벤트 수신 등록
// (리스너는 콜백 등록 여부와 무관하게 앱 시작 시 항상 열려 있어야 한다)
registerCliInstallListeners()
registerCliAuthListeners()
registerPromptListeners()
registerStockAnalysisListeners()

if (process.contextIsolated) {
  try {
    // Electron 기본 API (ipcRenderer, shell 등) 노출
    contextBridge.exposeInMainWorld('electron', electronAPI)

    // 기능별 api 객체를 병합해 window.api 단일 네임스페이스로 노출
    contextBridge.exposeInMainWorld('api', {
      ...cliInstallApi,    // CLI 설치 및 상태 확인
      ...cliAuthApi,       // CLI 로그인 인증
      ...cliStatsApi,      // 사용 통계 및 보고서 파일 조회
      ...promptApi,        // 단발 프롬프트 실행
      ...stockAnalysisApi, // 주식 멀티 에이전트 분석
    })
  } catch (error) {
    console.error(error)
  }
} else {
  // contextIsolation 비활성 환경 (개발 디버깅 등 예외 상황)
  // @ts-ignore (define in dts)
  window.electron = electronAPI
}
