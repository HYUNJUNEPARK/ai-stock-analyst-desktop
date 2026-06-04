/**
 * windows.ts — 보조 창(BrowserWindow) 열기 및 외부 URL 관련 preload 브릿지
 *
 * 담당 IPC 채널 (모두 양방향 invoke — 결과를 Promise로 반환):
 *   open-external-url        : 시스템 기본 브라우저로 URL 열기
 *   open-reports-window      : 보고서 목록 새 창 열기
 *   open-report-detail-window: 보고서 상세 새 창 열기
 *   open-guide-window        : 투자 가이드 새 창 열기
 *
 * ※ main → renderer 방향 이벤트가 없으므로 리스너 등록 함수는 없다.
 */

import { ipcRenderer } from 'electron'
import { IPC } from '../../shared/ipcChannels'

/**
 * renderer(React)에서 window.api.xxx() 형태로 호출할 수 있는 창 관련 함수 모음.
 * index.ts에서 contextBridge를 통해 window.api에 병합된다.
 */
export const windowsApi = {
  /** 지정한 URL을 시스템 기본 브라우저로 연다 (http/https만 허용) */
  openExternalUrl: (url: string) => ipcRenderer.invoke(IPC.OPEN_EXTERNAL_URL, url),

  /** 보고서 목록 페이지를 별도 창(BrowserWindow)으로 연다 */
  openReportsWindow: () => ipcRenderer.invoke(IPC.OPEN_REPORTS_WINDOW),

  /** 지정한 보고서를 별도 창(BrowserWindow)으로 열어 상세 보기를 제공한다 */
  openReportDetailWindow: (name: string, model: string) => ipcRenderer.invoke(IPC.OPEN_REPORT_DETAIL_WINDOW, name, model),

  /** 에러 로그를 별도 창(BrowserWindow)으로 연다 */
  openErrorLogWindow: (errorLog: string) => ipcRenderer.invoke(IPC.OPEN_ERROR_LOG_WINDOW, errorLog),

  /** 투자 가이드 페이지를 별도 창(BrowserWindow)으로 연다 */
  openGuideWindow: (guide: string) => ipcRenderer.invoke(IPC.OPEN_GUIDE_WINDOW, guide),
}
