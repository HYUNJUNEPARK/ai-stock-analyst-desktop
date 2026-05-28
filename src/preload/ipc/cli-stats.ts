/**
 * cli-stats.ts — CLI 사용 통계 및 GPT 보고서 파일 관련 preload 브릿지
 *
 * 담당 IPC 채널 (모두 양방향 invoke — 결과를 Promise로 반환):
 *   check-cli-stats        : 모델별 CLI 사용 통계 조회
 *   list-gpt-report-files  : 저장된 GPT 보고서 파일 목록 조회
 *   read-gpt-report-file   : 특정 보고서 파일 내용 읽기
 *   open-report-detail-window : 보고서 상세 새 창 열기
 *
 * ※ main → renderer 방향 이벤트가 없으므로 리스너 등록 함수는 없다.
 */

import { ipcRenderer } from 'electron'
import { IPC } from '../../shared/ipcChannels'

/**
 * renderer(React)에서 window.api.xxx() 형태로 호출할 수 있는 통계/보고서 관련 함수 모음.
 * index.ts에서 contextBridge를 통해 window.api에 병합된다.
 */
export const cliStatsApi = {
  /** 선택한 model의 CLI 사용 통계(토큰, 비용 등)를 조회한다 */
  checkCliStats: (model: string) => ipcRenderer.invoke(IPC.CHECK_CLI_STATS, model),

  /** 로컬에 저장된 GPT 분석 보고서 파일 목록을 반환한다 */
  listGptReportFiles: () => ipcRenderer.invoke(IPC.LIST_GPT_REPORT_FILES),

  /** 지정한 보고서 파일의 내용을 문자열로 읽어 반환한다 */
  readGptReportFile: (name: string) => ipcRenderer.invoke(IPC.READ_GPT_REPORT_FILE, name),

  /** 지정한 보고서를 별도 창(BrowserWindow)으로 열어 상세 보기를 제공한다 */
  openReportDetailWindow: (name: string, model: string) => ipcRenderer.invoke(IPC.OPEN_REPORT_DETAIL_WINDOW, name, model),

  /** 분석 artifact 디렉토리에서 역할별 중간 분석 결과(MD)를 읽어 반환한다 */
  readArtifactFiles: (artifactDir: string) => ipcRenderer.invoke(IPC.READ_ARTIFACT_FILES, artifactDir),

  /** 지정한 URL을 시스템 기본 브라우저로 연다 (http/https만 허용) */
  openExternalUrl: (url: string) => ipcRenderer.invoke(IPC.OPEN_EXTERNAL_URL, url),

  /** 선택된 모델의 구체적인 모델명을 반환한다 */
  getModelInfo: (model: string) => ipcRenderer.invoke(IPC.GET_MODEL_INFO, model),

  /** 현재 보고서 화면을 PDF로 캡처하여 로컬 파일로 저장한다 */
  saveReportPdf: (defaultFilename: string) => ipcRenderer.invoke(IPC.SAVE_REPORT_PDF, defaultFilename),
}
