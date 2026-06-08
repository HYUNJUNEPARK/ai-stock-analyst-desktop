import { ElectronAPI } from '@electron-toolkit/preload'

/**
 *  TypeScript 타입 선언 파일로, renderer(React UI)에서 window.api와 window.electron을 사용할 때 타입 안전성을 보장하기 위해 작성됨
 *  -> TypeScript에게 "window.api에 이런 함수들이 있어" 라고 알려주는 역할
 *  -> 이 파일이 없으면 renderer에서 window.api.runPrompt(...) 호출 시 TypeScript가 오류를 냄. 이 파일이 있어야 자동완성 + 타입 체크가 가능하다.
 */
declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      /* CLI 설치 */
      startCliInstall: (model: string) => void
      onInstallProgress: (callback: (data: string) => void) => void
      onInstallComplete: (callback: (result: { success: boolean; error?: string }) => void) => void

      /* CLI 설치/인증 상태 확인 */
      checkCliStatus: (model: string) => Promise<{ cliInstalled: boolean; authenticated: boolean }>

      /* CLI 사용 통계 */
      checkCliStats: (model: string) => Promise<
        | {
            success: true
            weekStart: string
            weekEnd: string
            weekly: {
              sessions: number
              tokensByModel: Record<string, number>
              messages?: number
              toolCalls?: number
            }
          }
        | { success: false; error: string }
      >

      /* 보고서 파일 CRUD + PDF */
      // GPT 리포트 파일 목록 조회
      listGptReportFiles: () => Promise<Array<{
        name: string
        company: string
        ticker: string
        asOfDate: string
        model: string
        createdAt: string
        updatedAt: string
      }>>

      // GPT 리포트 파일 내용 읽기
      readGptReportFile: (name: string) => Promise<{ success: true; data: unknown } | { success: false; error: string }>

      // 보고서 상세 새 창 열기
      openReportDetailWindow: (name: string, model: string) => Promise<{ success: true } | { success: false; error: string }>

      // artifact 역할별 분석 결과 읽기
      readArtifactFiles: (artifactDir: string) => Promise<{ financial: string; news: string; sector: string; price: string; valuation: string; investType: string }>

      // 선택된 모델의 구체적인 모델명 조회
      getModelInfo: (model: string) => Promise<{ modelName: string | null }>

      // 보고서 화면을 PDF로 저장
      saveReportPdf: (defaultFilename: string) => Promise<
        { success: true; filePath: string } | { success: false; canceled?: boolean; error?: string }
      >

      // 7개 탭을 각각 PDF로 캡처하여 폴더에 저장
      saveReportPdfBundle: (folderName: string) => Promise<
        { success: true; outputDir: string; saved: string[] } | { success: false; canceled?: boolean; error?: string; saved?: string[]; outputDir?: string }
      >

      // 보고서 폴더 삭제
      deleteGptReportFile: (name: string) => Promise<{ success: true } | { success: false; error: string }>

      /* 보조 창 열기 + 외부 URL */
      // 외부 URL을 시스템 기본 브라우저로 열기
      openExternalUrl: (url: string) => Promise<void>

      // 사용 전 준비사항 새 창 열기
      openPrerequisitesWindow: () => Promise<{ success: true } | { success: false; error: string }>

      // 보고서 목록 새 창 열기
      openReportsWindow: () => Promise<{ success: true } | { success: false; error: string }>

      // 에러 로그 새 창 열기
      openErrorLogWindow: (errorLog: string) => Promise<{ success: true } | { success: false; error: string }>

      // 투자 가이드 새 창 열기
      openGuideWindow: (guide: string) => Promise<{ success: true } | { success: false; error: string }>

      /* CLI 로그인 */
      runClaudeLogin: () => void
      runGptLogin: () => void
      onCliLoginProgress: (callback: (data: string) => void) => void
      onCliLoginComplete: (callback: (result: { success: boolean; error?: string }) => void) => void

      /* 프롬프트 실행 */
      runPrompt: (params: { model: string; prompt: string }) => void
      onResponseChunk: (callback: (chunk: string) => void) => void
      onResponseDone: (callback: (result: { success: boolean; error?: string; authRequired?: boolean }) => void) => void

      /* 주식 멀티 에이전트 분석 */
      runStockAnalysis: (params: { model: string; prompt: string; market?: string }) => void
      cancelStockAnalysis: () => void
      onStockAnalysisAgent: (callback: (event: { name: string; status: 'running' | 'done' }) => void) => void
      onStockAnalysisChunk: (callback: (chunk: string) => void) => void
      onStockAnalysisDone: (callback: (result: { success: boolean; error?: string; errorLog?: string; authRequired?: boolean }) => void) => void
    }
  }
}
