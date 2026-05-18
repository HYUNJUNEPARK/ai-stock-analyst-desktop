import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      /* CLI 설치 */
      startCliInstall: (model: string) => void
      onInstallProgress: (callback: (data: string) => void) => void
      onInstallComplete: (callback: (result: { success: boolean; error?: string }) => void) => void

      /* API 키 관리 */
      // validateApiKey: (params: {
      //   model: string
      //   apiKey: string
      // }) => Promise<{ valid: boolean; error?: string }>
      // saveApiKey: (params: { model: string; apiKey: string }) => Promise<void>
      // loadApiKey: (model: string) => Promise<string | null>

      /* CLI 설치/인증 상태 확인 */
      checkCliStatus: (model: string) => Promise<{ cliInstalled: boolean; authenticated: boolean }>

      /* CLI stats 조회 */
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

      // GPT 리포트 파일 목록 조회
      listGptReportFiles: () => Promise<Array<{ name: string; updatedAt: string; model: string }>>

      /* CLI 로그인 */
      runClaudeLogin: () => void
      runGptLogin: () => void
      onCliLoginProgress: (callback: (data: string) => void) => void
      onCliLoginComplete: (callback: (result: { success: boolean; error?: string }) => void) => void

      /* 프롬프트 실행 */
      runPrompt: (params: { model: string; prompt: string; apiKey: string }) => void
      onResponseChunk: (callback: (chunk: string) => void) => void
      onResponseDone: (callback: (result: { success: boolean; error?: string }) => void) => void

      /* 주식 멀티 에이전트 분석 */
      runStockAnalysis: (params: { model: string; prompt: string; apiKey: string }) => void
      cancelStockAnalysis: () => void
      onStockAnalysisAgent: (callback: (event: { name: string; status: 'running' | 'done' }) => void) => void
      onStockAnalysisLog: (callback: (message: string) => void) => void
      onStockAnalysisChunk: (callback: (chunk: string) => void) => void
      onStockAnalysisDone: (callback: (result: { success: boolean; error?: string }) => void) => void
    }
  }
}
