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
      validateApiKey: (params: {
        model: string
        apiKey: string
      }) => Promise<{ valid: boolean; error?: string }>
      saveApiKey: (params: { model: string; apiKey: string }) => Promise<void>
      loadApiKey: () => Promise<string | null>

      /* Claude CLI 로그인 */
      runClaudeLogin?: () => void
      onCliLoginProgress?: (callback: (data: string) => void) => void
      onCliLoginComplete?: (callback: (result: { success: boolean }) => void) => void

      /* 프롬프트 실행 */
      runPrompt?: (params: { model: string; prompt: string; apiKey: string }) => void
      onResponseChunk?: (callback: (chunk: string) => void) => void
      onResponseDone?: (callback: (result: { success: boolean; error?: string }) => void) => void

      /* 주식 멀티 에이전트 분석 */
      runStockAnalysis?: (params: { prompt: string; apiKey: string }) => void
      cancelStockAnalysis?: () => void
      onStockAnalysisAgent?: (callback: (event: { name: string; status: 'running' | 'done' }) => void) => void
      onStockAnalysisChunk?: (callback: (chunk: string) => void) => void
      onStockAnalysisDone?: (callback: (result: { success: boolean; error?: string }) => void) => void
    }
  }
}
