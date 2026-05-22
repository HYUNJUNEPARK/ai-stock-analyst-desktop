/**
 * src/main/ipc/index.ts — IPC 핸들러 통합 등록
 *
 * 각 기능별 핸들러 모듈을 조합해 한 번에 등록한다.
 * window.ts에서 BrowserWindow 생성 직후 이 함수를 호출한다.
 *
 * 새 IPC 채널을 추가할 때:
 *   1. ipc/ 하위에 새 파일을 만들어 register*Handlers 함수를 구현한다.
 *   2. 이 파일에서 import 후 registerIpcHandlers 안에서 호출한다.
 *
 * win을 인자로 받는 이유:
 *   main → renderer 방향 이벤트 push(win.webContents.send)에 BrowserWindow 참조가 필요하다.
 *   전역 변수 대신 인자로 주입해 의존성을 명시적으로 관리한다.
 */

import type { BrowserWindow } from 'electron'
import { registerCliInstallHandlers } from './cli-install'
import { registerCliStatsHandlers } from './cli-stats'
import { registerCliAuthHandlers } from './cli-auth'
import { registerPromptHandlers } from './prompt'
import { registerStockAnalysisHandlers } from './stock-analysis'

/**
 * 모든 IPC 핸들러를 등록한다.
 *
 * @param win - IPC 이벤트를 push할 BrowserWindow 인스턴스
 */
export function registerIpcHandlers(win: BrowserWindow): void {
  console.log('[registerIpcHandlers] IPC 핸들러 등록 시작')

  registerCliInstallHandlers(win)    // CLI 설치, 설치/인증 상태 확인
  registerCliStatsHandlers()         // CLI 사용 통계, GPT 보고서 목록 (win 불필요)
  registerCliAuthHandlers(win)       // Claude/GPT 로그인
  registerPromptHandlers(win)        // 단발 프롬프트 실행
  registerStockAnalysisHandlers(win) // 주식 멀티 에이전트 분석
}
