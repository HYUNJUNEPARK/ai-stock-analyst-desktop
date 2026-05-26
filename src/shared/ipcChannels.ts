/**
 * IPC 채널명 상수
 * main / preload / renderer 3개 레이어에서 공통으로 사용한다.
 * 채널명을 변경할 때는 이 파일 한 곳만 수정하면 된다.
 */
export const IPC = {
  // CLI 설치 및 상태 확인
  START_CLI_INSTALL: 'start-cli-install',
  INSTALL_PROGRESS: 'install-progress',
  INSTALL_COMPLETE: 'install-complete',
  CHECK_CLI_STATUS: 'check-cli-status',

  // CLI 인증 
  RUN_CLAUDE_LOGIN: 'run-claude-login',
  RUN_GPT_LOGIN: 'run-gpt-login',
  CLI_LOGIN_PROGRESS: 'cli-login-progress',
  CLI_LOGIN_COMPLETE: 'cli-login-complete',

  // 프롬프트
  RUN_PROMPT: 'run-prompt',
  PROMPT_RESPONSE_CHUNK: 'prompt-response-chunk',
  PROMPT_RESPONSE_DONE: 'prompt-response-done',

  // 주식 분석
  RUN_STOCK_ANALYSIS: 'run-stock-analysis',
  CANCEL_STOCK_ANALYSIS: 'cancel-stock-analysis',
  STOCK_ANALYSIS_AGENT: 'stock-analysis-agent',
  STOCK_ANALYSIS_CHUNK: 'stock-analysis-chunk',
  STOCK_ANALYSIS_DONE: 'stock-analysis-done',

  // 통계 / 리포트
  CHECK_CLI_STATS: 'check-cli-stats',
  LIST_GPT_REPORT_FILES: 'list-gpt-report-files',
  READ_GPT_REPORT_FILE: 'read-gpt-report-file',
  OPEN_REPORT_DETAIL_WINDOW: 'open-report-detail-window',
} as const
