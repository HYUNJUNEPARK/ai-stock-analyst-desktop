/**
 * report-files.ts — GPT 보고서 파일 CRUD 및 PDF 저장 관련 preload 브릿지
 *
 * 담당 IPC 채널 (모두 양방향 invoke — 결과를 Promise로 반환):
 *   list-gpt-report-files  : 저장된 GPT 보고서 파일 목록 조회
 *   read-gpt-report-file   : 특정 보고서 파일 내용 읽기
 *   read-artifact-files    : artifact 역할별 중간 분석 결과 읽기
 *   delete-gpt-report-file : 보고서 폴더 삭제
 *   save-report-pdf        : 보고서 화면을 PDF로 저장
 *
 * ※ main → renderer 방향 이벤트가 없으므로 리스너 등록 함수는 없다.
 */

import { ipcRenderer } from 'electron'
import { IPC } from '../../shared/ipcChannels'

/**
 * renderer(React)에서 window.api.xxx() 형태로 호출할 수 있는 보고서 파일 관련 함수 모음.
 * index.ts에서 contextBridge를 통해 window.api에 병합된다.
 */
export const reportFilesApi = {
  /** 로컬에 저장된 GPT 분석 보고서 파일 목록을 반환한다 */
  listGptReportFiles: () => ipcRenderer.invoke(IPC.LIST_GPT_REPORT_FILES),

  /** 지정한 보고서 파일의 내용을 문자열로 읽어 반환한다 */
  readGptReportFile: (name: string) => ipcRenderer.invoke(IPC.READ_GPT_REPORT_FILE, name),

  /** 분석 artifact 디렉토리에서 역할별 중간 분석 결과(MD)를 읽어 반환한다 */
  readArtifactFiles: (artifactDir: string) => ipcRenderer.invoke(IPC.READ_ARTIFACT_FILES, artifactDir),

  /** 지정한 보고서 폴더(dateFolder/stockFolder)를 삭제한다 */
  deleteGptReportFile: (name: string) => ipcRenderer.invoke(IPC.DELETE_GPT_REPORT_FILE, name),

  /** 현재 보고서 화면을 PDF로 캡처하여 로컬 파일로 저장한다 */
  saveReportPdf: (defaultFilename: string) => ipcRenderer.invoke(IPC.SAVE_REPORT_PDF, defaultFilename),
}
