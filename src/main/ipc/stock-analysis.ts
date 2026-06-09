/**
 * src/main/ipc/stock-analysis.ts — 주식 멀티 에이전트 분석 IPC 핸들러
 *
 * 담당 채널:
 *   - run-stock-analysis    : 주식 분석 실행 (단방향)
 *   - cancel-stock-analysis : 진행 중인 분석 취소 (단방향)
 *
 * 모델별 실행 방식이 완전히 다르므로 GPT/Claude 분기로 나뉜다.
 *
 * GPT 분석 흐름:
 *   analyze-stock.mjs 스크립트를 Node.js(process.execPath)로 직접 실행한다.
 *   스크립트 내부에서 Codex CLI를 순차적으로 호출해 4개 에이전트를 실행한다.
 *   스크립트는 stdout에 구조화된 텍스트 라인을 출력한다:
 *     [start] <에이전트명>             → 에이전트 시작 알림
 *     [done] <에이전트명>              → 에이전트 완료 알림
 *     최종 리포트 저장 완료: <파일경로> → 분석 완료, 파일 경로 알림
 *   최종 보고서는 파일로 저장되며, 경로를 받아 readFileSync로 읽어 renderer에 전달한다.
 *
 * Claude 분석 흐름:
 *   GPT와 동일한 방식으로 analyze-stock.mjs 스크립트를 Node.js로 실행한다.
 *   스크립트 내부에서 Claude CLI를 순차·병렬로 호출해 9개 에이전트를 실행한다.
 *   스크립트는 stdout에 GPT와 동일한 구조화된 텍스트 라인을 출력한다:
 *     [start] <에이전트명>             → 에이전트 시작 알림
 *     [done] <에이전트명>              → 에이전트 완료 알림
 *     최종 리포트 저장 완료: <파일경로> → 분석 완료, 파일 경로 알림
 */

import { ipcMain, type BrowserWindow } from 'electron'
import { join } from 'path'
import { spawn, type ChildProcess } from 'child_process'
import { readFileSync, mkdirSync, writeFileSync } from 'fs'
import { homedir } from 'os'
import { IPC } from '../../shared/ipcChannels'
import { STOCK_CLAUDE_DIR, STOCK_GPT_DIR } from '../constants'
import { writeTerminalError, writeTerminalLine, writeTerminalLog, safeSend } from '../utils/spawn'
import { resolveCliCommand, getEnhancedPath } from '../utils/cli'
import { isCodexAuthErrorOutput } from '../utils/auth'

/** 에러 로그 저장 디렉토리: ~/.ai-cli-launcher/logs */
const LOG_DIR = join(homedir(), '.ai-cli-launcher', 'logs')

/**
 * 에러 로그를 파일로 저장하고 파일 경로를 반환한다.
 * 파일명: error-{model}-{timestamp}.log
 */
function saveErrorLog(model: string, logLines: string[]): string {
  try {
    mkdirSync(LOG_DIR, { recursive: true })
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `error-${model}-${timestamp}.log`
    const filepath = join(LOG_DIR, filename)
    writeFileSync(filepath, logLines.join('\n'), 'utf-8')
    return filepath
  } catch (err) {
    writeTerminalError(`[stock-analysis] 에러 로그 파일 저장 실패: ${err instanceof Error ? err.message : String(err)}`)
    return ''
  }
}

/**
 * 분석 시작 시 환경 진단 정보를 수집해 반환한다.
 * 플랫폼, CLI 경로, PATH 등 디버깅에 필수적인 정보를 포함한다.
 */
function collectEnvironmentInfo(model: string, cliCommand: string | null, cliSource: string): string[] {
  const lines: string[] = []
  const now = new Date().toISOString()
  lines.push(`[env] 분석 시작: ${now}`)
  lines.push(`[env] 모델: ${model}`)
  lines.push(`[env] 플랫폼: ${process.platform} (${process.arch})`)
  lines.push(`[env] Node 버전: ${process.version}`)
  lines.push(`[env] Electron: ${process.versions['electron'] ?? 'unknown'}`)
  lines.push(`[env] CLI 경로: ${cliCommand ?? '(없음)'} (${cliSource})`)
  lines.push(`[env] CWD: ${model === 'gpt' ? STOCK_GPT_DIR : STOCK_CLAUDE_DIR}`)
  lines.push(`[env] PATH (앞 300자): ${(getEnhancedPath() ?? '').slice(0, 300)}`)
  return lines
}

/**
 * 에이전트 내부 식별자 → UI 표시용 한글 레이블 매핑
 * 분석 진행 상황을 사용자에게 알릴 때 사용한다.
 */
const STOCK_AGENT_LABELS: Record<string, string> = {
  'financial-analyst-kr': '재무 분석',
  'news-sentiment-analyst': '뉴스 분석',
  'sector-researcher': '섹터 분석',
  'price-analyst': '기술적 분석',
  'valuation-analyst': '밸류에이션 분석',
  'invest-type-classifier': '투자 유형 분류',
  'aggressive-investment-strategist': '투자 전략'
}

/** 에이전트 식별자를 한글 레이블로 변환. 매핑에 없으면 식별자 그대로 반환 */
function getStockAgentLabel(name: string): string {
  return STOCK_AGENT_LABELS[name] ?? name
}

/**
 * 주식 분석 IPC 핸들러를 등록한다.
 *
 * @param win - IPC 이벤트를 push할 BrowserWindow 인스턴스
 */
export function registerStockAnalysisHandlers(win: BrowserWindow): void {

  /**
   * 현재 실행 중인 분석 child_process 참조
   * 취소 요청 시 이 참조로 프로세스를 종료한다.
   * null이면 실행 중인 분석이 없음을 의미한다.
   */
  let activeAnalysisChild: ChildProcess | null = null

  /** 주식 분석 상태 메시지를 Electron 실행 콘솔에 기록하는 헬퍼 */
  function sendLog(message: string): void {
    writeTerminalLine(`[stock-analysis] ${message}`)
  }

  /**
   * IPC 채널: 'cancel-stock-analysis'
   * 방향: renderer → main (on = 단방향)
   * 용도: 분석 진행 중 사용자가 취소 버튼을 클릭했을 때 호출
   *
   * 프로세스 종료 방식:
   *   macOS/Linux: process.kill(-pid, 'SIGKILL')
   *     — 음수 PID(-pid)는 해당 프로세스 그룹 전체를 의미한다.
   *       detached: true로 실행했기 때문에 CLI가 생성한 하위 에이전트 프로세스까지 모두 종료된다.
   *   Windows: taskkill /pid <pid> /T /F
   *     — /T: 자식 프로세스 포함, /F: 강제 종료
   *
   * activeAnalysisChild를 null로 먼저 설정하는 이유:
   *   child.on('close') 핸들러에서 wasCancelled 플래그로 사용하기 위해서다.
   *   null이면 취소에 의한 종료로 간주하고 에러 이벤트를 renderer에 보내지 않는다.
   */
  ipcMain.on(IPC.CANCEL_STOCK_ANALYSIS, () => {
    writeTerminalLog('[cancel-stock-analysis] 주식 분석 취소 요청')
    if (activeAnalysisChild) {
      const pid = activeAnalysisChild.pid
      activeAnalysisChild = null   // 먼저 null로 설정 → close 핸들러에서 취소 여부 판단
      if (pid !== undefined) {
        if (process.platform === 'win32') {
          spawn('taskkill', ['/pid', String(pid), '/T', '/F'])
        } else {
          try {
            process.kill(-pid, 'SIGKILL')   // 프로세스 그룹 전체 종료
          } catch {
            // 이미 종료된 경우 무시
          }
        }
      }
    }
  })

  /**
   * IPC 채널: 'run-stock-analysis'
   * 방향: renderer → main (on = 단방향)
   * 용도: 사용자가 종목명/분석 요청을 입력하고 분석 시작 버튼을 클릭했을 때 호출
   */
  ipcMain.on(
    IPC.RUN_STOCK_ANALYSIS,
    (_event, { model, prompt, market }: { model: string; prompt: string; market?: string }) => {
      writeTerminalLog(`[run-stock-analysis] 주식 분석 실행 시작: 모델=${model}, 시장=${market ?? 'auto'}`)
      const env: NodeJS.ProcessEnv = { ...process.env, PATH: getEnhancedPath() }

      if (model === 'gpt') {
        runGptAnalysis({ win, env, prompt, market, sendLog, getActiveChild: () => activeAnalysisChild, setActiveChild: (c) => { activeAnalysisChild = c } })
      } else {
        runClaudeAnalysis({ win, env, prompt, market, sendLog, getActiveChild: () => activeAnalysisChild, setActiveChild: (c) => { activeAnalysisChild = c } })
      }
    }
  )
}

/** market 값을 프롬프트용 태그 문자열로 변환한다. 'auto'이거나 미지정이면 빈 문자열 반환. */
function marketToTag(market?: string): string {
  if (market === 'kr') return '[한국주식]'
  if (market === 'us') return '[미국주식]'
  return ''
}

interface AnalysisContext {
  win: BrowserWindow
  env: NodeJS.ProcessEnv
  prompt: string
  market?: string
  sendLog: (msg: string) => void
  getActiveChild: () => ChildProcess | null
  setActiveChild: (child: ChildProcess | null) => void
}

/**
 * GPT(Codex) 기반 주식 분석을 실행한다.
 *
 * analyze-stock.mjs 스크립트를 Node.js로 실행하고,
 * 스크립트의 stdout 텍스트 라인을 파싱해 진행 상황과 최종 보고서를 renderer에 전달한다.
 */
function runGptAnalysis({ win, env, prompt, market, sendLog, setActiveChild, getActiveChild }: AnalysisContext): void {
  const resolvedCodex = resolveCliCommand('codex')
  if (!resolvedCodex.command) {
    writeTerminalError('[stock-analysis:gpt] Codex CLI를 찾을 수 없음')
    const envLines = collectEnvironmentInfo('gpt', null, 'missing')
    envLines.push('[error] Codex CLI를 찾을 수 없음')
    const logPath = saveErrorLog('gpt', envLines)
    if (logPath) envLines.push(`[info] 로그 저장 위치: ${logPath}`)
    safeSend(win,IPC.STOCK_ANALYSIS_DONE, {
      success: false,
      error: '분석에 실패하였습니다. AI 도구가 설치되어 있지 않습니다. 설치 화면에서 다시 설치해 주세요.',
      errorLog: envLines.join('\n')
    })
    return
  }

  // 스크립트가 codex 경로를 환경변수로 받아 사용
  env['CODEX_BIN'] = resolvedCodex.command
  // 패키징된 앱에서 process.execPath는 앱 실행 파일을 가리킨다.
  // ELECTRON_RUN_AS_NODE=1을 설정하면 Electron 바이너리가 순수 Node.js처럼 동작해
  // .mjs 스크립트를 실행할 수 있다. (이 설정 없이는 앱이 새 창으로 다시 열림)
  env['ELECTRON_RUN_AS_NODE'] = '1'

  // 실행 명령: node <STOCK_GPT_DIR>/scripts/analyze-stock.mjs --request <prompt> [--market <market>]
  const scriptArgs = [join(STOCK_GPT_DIR, 'scripts', 'analyze-stock.mjs'), '--request', prompt]
  const tag = marketToTag(market)
  if (tag) scriptArgs.push('--market', tag)

  const child = spawn(
    process.execPath,
    scriptArgs,
    {
      env,
      cwd: STOCK_GPT_DIR,
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: process.platform !== 'win32'   // Unix: 프로세스 그룹 분리 → 취소 시 그룹 전체 종료 가능
    }
  )
  setActiveChild(child)
  sendLog('투자 리포트 생성을 시작했습니다.')

  let buf = ''              // 줄 단위 파싱을 위한 버퍼 (data 이벤트가 줄 중간에 끊길 수 있음)
  let finalReportPath = '' // 최종 보고서 파일 경로 (스크립트 stdout에서 파싱)
  let analysisCompleted = false  // 중복 완료 처리 방지 플래그
  let lastUserErrorMsg = ''      // 스크립트가 [error]로 출력한 유저 친화적 메시지
  const errorLogLines: string[] = collectEnvironmentInfo('gpt', resolvedCodex.command, resolvedCodex.source)
  const stdoutLogLines: string[] = []  // 전체 stdout 기록 (디버깅용)

  /**
   * 최종 보고서 파일을 읽어 renderer에 전달하는 헬퍼
   * analysisCompleted 플래그로 close 이벤트와의 중복 처리를 방지한다.
   */
  function finishSuccess(reportPath: string): void {
    if (analysisCompleted) return
    analysisCompleted = true
    try {
      const reportContent = readFileSync(reportPath, 'utf-8')
      safeSend(win,IPC.STOCK_ANALYSIS_CHUNK, reportContent)
      safeSend(win,IPC.STOCK_ANALYSIS_DONE, { success: true })
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error)
      writeTerminalError(`[stock-analysis:gpt] 리포트 파일 읽기 실패: path=${reportPath}, error=${detail}`)
      errorLogLines.push(`[error] 리포트 파일 읽기 실패: ${detail}`)
      safeSend(win,IPC.STOCK_ANALYSIS_DONE, {
        success: false,
        error: '분석에 실패하였습니다. 리포트 파일을 읽을 수 없습니다. 잠시 후 다시 시도해 주세요.',
        errorLog: errorLogLines.join('\n')
      })
    }
  }

  child.stdout!.on('data', (data: Buffer) => {
    buf += data.toString()
    const lines = buf.split('\n')
    buf = lines.pop() ?? ''   // 마지막 불완전한 줄은 다음 data 이벤트까지 버퍼에 유지

    for (const rawLine of lines) {
      const line = rawLine.trim()
      if (!line) continue
      stdoutLogLines.push(line)
      writeTerminalLine(`[stock-analysis:gpt:stdout] ${line}`)

      // 시스템 PATH 폴백 사용 알림 (스크립트가 bootstrap 시 출력하는 특수 라인)
      if (resolvedCodex.source === 'path' && line === '[bootstrap] codex-fallback:path') {
        safeSend(win,IPC.STOCK_ANALYSIS_CHUNK, '> 시스템 PATH의 `codex` 실행 파일을 사용합니다.\n\n')
        continue
      }

      // [start] <에이전트명> → 에이전트 시작 이벤트
      const startMatch = line.match(/^\[start\]\s+(.+)$/)
      if (startMatch) {
        sendLog(`${getStockAgentLabel(startMatch[1])}을 시작했습니다.`)
        safeSend(win,IPC.STOCK_ANALYSIS_AGENT, { name: startMatch[1], status: 'running' })
        continue
      }

      // [done] <에이전트명> → 에이전트 완료 이벤트
      const doneMatch = line.match(/^\[done\]\s+(.+)$/)
      if (doneMatch) {
        sendLog(`${getStockAgentLabel(doneMatch[1])}을 완료했습니다.`)
        safeSend(win,IPC.STOCK_ANALYSIS_AGENT, { name: doneMatch[1], status: 'done' })
        continue
      }

      // [실패], [경고], [error] 라인 → 에러 로그로 수집
      if (/^\[(실패|경고|error)\]/.test(line)) {
        errorLogLines.push(line)
      }

      // [error] <유저 친화적 메시지> → 스크립트에서 출력한 에러 메시지 캡처
      const errorMatch = line.match(/^\[error\]\s+(.+)$/)
      if (errorMatch) {
        lastUserErrorMsg = errorMatch[1]
        continue
      }

      // 최종 리포트 저장 완료: <경로> → 분석 완료 이벤트
      const reportMatch = line.match(/^최종 리포트 저장 완료:\s+(.+)$/)
      if (reportMatch) {
        finalReportPath = reportMatch[1]
        sendLog('최종 투자 리포트를 저장했습니다.')
        finishSuccess(finalReportPath)
      }
    }
  })

  /** stderr에서 프롬프트 본문 영역을 감지해 에러 로그 노출을 방지하는 플래그 */
  let stderrInPrompt = false

  child.stderr!.on('data', (data: Buffer) => {
    const text = data.toString().trim()
    if (!text) return
    writeTerminalLine(`[stock-analysis:gpt] ${text}`, true)

    // codex stderr에서 프롬프트 본문 필터링:
    // "user" 라인이 오면 프롬프트 시작, "codex" 라인이 오면 응답 시작(프롬프트 끝)
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed) continue
      if (trimmed === 'user') { stderrInPrompt = true; continue }
      if (stderrInPrompt && trimmed === 'codex') { stderrInPrompt = false; continue }
      if (stderrInPrompt) continue
      errorLogLines.push(`[stderr] ${trimmed}`)
    }

    sendLog(`Codex CLI: ${text.split(/\r?\n/).at(-1) ?? text}`)
  })

  /**
   * 에러 로그를 파일로 저장하고, stdout 전체 기록을 포함한 최종 로그 문자열을 반환한다.
   * 모든 실패 경로에서 이 함수를 호출해 일관된 형식의 에러 로그를 생성한다.
   */
  function buildAndSaveErrorLog(): string {
    // stdout 전체 기록을 에러 로그 끝에 첨부
    if (stdoutLogLines.length > 0) {
      errorLogLines.push('')
      errorLogLines.push('--- stdout 전체 기록 ---')
      errorLogLines.push(...stdoutLogLines)
    }
    const logPath = saveErrorLog('gpt', errorLogLines)
    if (logPath) {
      errorLogLines.push('')
      errorLogLines.push(`[info] 로그 저장 위치: ${logPath}`)
    }
    return errorLogLines.join('\n')
  }

  child.on('close', (code) => {
    const wasCancelled = getActiveChild() === null   // 취소로 인한 종료인지 확인
    setActiveChild(null)

    if (analysisCompleted) return   // stdout에서 이미 완료 처리됨

    if (code === 0) {
      if (!finalReportPath) {
        writeTerminalError('[stock-analysis:gpt] 프로세스 정상 종료했으나 리포트 경로 미확인')
        errorLogLines.push('[error] 프로세스 정상 종료했으나 리포트 경로 미확인')
        safeSend(win,IPC.STOCK_ANALYSIS_DONE, {
          success: false,
          error: '분석에 실패하였습니다. 리포트 생성 결과를 확인할 수 없습니다. 잠시 후 다시 시도해 주세요.',
          errorLog: buildAndSaveErrorLog()
        })
        return
      }
      try {
        const report = readFileSync(finalReportPath, 'utf-8')
        safeSend(win,IPC.STOCK_ANALYSIS_CHUNK, report)
        safeSend(win,IPC.STOCK_ANALYSIS_DONE, { success: true })
      } catch (error) {
        const detail = error instanceof Error ? error.message : String(error)
        writeTerminalError(`[stock-analysis:gpt] 리포트 파일 읽기 실패: path=${finalReportPath}, error=${detail}`)
        errorLogLines.push(`[error] 리포트 파일 읽기 실패: ${detail}`)
        safeSend(win,IPC.STOCK_ANALYSIS_DONE, {
          success: false,
          error: '분석에 실패하였습니다. 리포트 파일을 읽을 수 없습니다. 잠시 후 다시 시도해 주세요.',
          errorLog: buildAndSaveErrorLog()
        })
      }
      return
    }

    // 취소가 아닌 오류 종료일 때만 에러 이벤트 전송
    if (!wasCancelled) {
      writeTerminalError(`[stock-analysis:gpt] 프로세스 비정상 종료: exit code=${code}`)
      errorLogLines.push(`[error] 프로세스 비정상 종료 (exit code: ${code})`)
      const errorLog = buildAndSaveErrorLog()
      const authRequired = isCodexAuthErrorOutput(`${lastUserErrorMsg}\n${errorLog}`)
      safeSend(win,IPC.STOCK_ANALYSIS_DONE, {
        success: false,
        error: authRequired
          ? 'Codex 인증이 만료되었거나 유효하지 않습니다. 다시 인증해 주세요.'
          : lastUserErrorMsg || '분석에 실패하였습니다. 잠시 후 다시 시도해 주세요.',
        errorLog,
        authRequired
      })
    }
  })

  child.on('error', (err) => {
    setActiveChild(null)
    writeTerminalError(`[stock-analysis:gpt] CLI 실행 오류: ${err.message}`)
    errorLogLines.push(`[error] CLI 실행 오류: ${err.message}`)
    safeSend(win,IPC.STOCK_ANALYSIS_DONE, {
      success: false,
      error: '분석에 실패하였습니다. AI 도구를 실행할 수 없습니다. 설치 상태를 확인해 주세요.',
      errorLog: buildAndSaveErrorLog()
    })
  })
}

/**
 * Claude 기반 주식 분석을 실행한다.
 *
 * GPT와 동일한 방식으로 analyze-stock.mjs 스크립트를 Node.js로 실행하고,
 * 스크립트의 stdout 텍스트 라인을 파싱해 진행 상황과 최종 보고서를 renderer에 전달한다.
 *
 * 스크립트 내부에서 claude CLI를 순차·병렬로 호출해 9개 에이전트를 실행한다.
 */
function runClaudeAnalysis({ win, env, prompt, market, sendLog, setActiveChild, getActiveChild }: AnalysisContext): void {
  const resolvedClaude = resolveCliCommand('claude')
  if (!resolvedClaude.command) {
    writeTerminalError('[stock-analysis:claude] Claude CLI를 찾을 수 없음')
    const envLines = collectEnvironmentInfo('claude', null, 'missing')
    envLines.push('[error] Claude CLI를 찾을 수 없음')
    const logPath = saveErrorLog('claude', envLines)
    if (logPath) envLines.push(`[info] 로그 저장 위치: ${logPath}`)
    safeSend(win, IPC.STOCK_ANALYSIS_DONE, {
      success: false,
      error: '분석에 실패하였습니다. AI 도구가 설치되어 있지 않습니다. 설치 화면에서 다시 설치해 주세요.',
      errorLog: envLines.join('\n')
    })
    return
  }

  // 스크립트가 claude 경로를 환경변수로 받아 사용
  env['CLAUDE_BIN'] = resolvedClaude.command
  env['ELECTRON_RUN_AS_NODE'] = '1'

  // 실행 명령: node <STOCK_CLAUDE_DIR>/scripts/analyze-stock.mjs --request <prompt> [--market <market>]
  const scriptArgs = [join(STOCK_CLAUDE_DIR, 'scripts', 'analyze-stock.mjs'), '--request', prompt]
  const tag = marketToTag(market)
  if (tag) scriptArgs.push('--market', tag)

  const child = spawn(
    process.execPath,
    scriptArgs,
    {
      env,
      cwd: STOCK_CLAUDE_DIR,
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: process.platform !== 'win32'
    }
  )
  setActiveChild(child)
  sendLog('투자 리포트 생성을 시작했습니다.')

  let buf = ''
  let finalReportPath = ''
  let analysisCompleted = false
  let lastUserErrorMsg = ''
  const errorLogLines: string[] = collectEnvironmentInfo('claude', resolvedClaude.command, resolvedClaude.source)
  const stdoutLogLines: string[] = []

  /**
   * 최종 보고서 파일을 읽어 renderer에 전달하는 헬퍼
   */
  function finishSuccess(reportPath: string): void {
    if (analysisCompleted) return
    analysisCompleted = true
    try {
      const reportContent = readFileSync(reportPath, 'utf-8')
      safeSend(win, IPC.STOCK_ANALYSIS_CHUNK, reportContent)
      safeSend(win, IPC.STOCK_ANALYSIS_DONE, { success: true })
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error)
      writeTerminalError(`[stock-analysis:claude] 리포트 파일 읽기 실패: path=${reportPath}, error=${detail}`)
      errorLogLines.push(`[error] 리포트 파일 읽기 실패: ${detail}`)
      safeSend(win, IPC.STOCK_ANALYSIS_DONE, {
        success: false,
        error: '분석에 실패하였습니다. 리포트 파일을 읽을 수 없습니다. 잠시 후 다시 시도해 주세요.',
        errorLog: errorLogLines.join('\n')
      })
    }
  }

  child.stdout!.on('data', (data: Buffer) => {
    buf += data.toString()
    const lines = buf.split('\n')
    buf = lines.pop() ?? ''

    for (const rawLine of lines) {
      const line = rawLine.trim()
      if (!line) continue
      stdoutLogLines.push(line)
      writeTerminalLine(`[stock-analysis:claude:stdout] ${line}`)

      // [start] <에이전트명> → 에이전트 시작 이벤트
      const startMatch = line.match(/^\[start\]\s+(.+)$/)
      if (startMatch) {
        sendLog(`${getStockAgentLabel(startMatch[1])}을 시작했습니다.`)
        safeSend(win, IPC.STOCK_ANALYSIS_AGENT, { name: startMatch[1], status: 'running' })
        continue
      }

      // [done] <에이전트명> → 에이전트 완료 이벤트
      const doneMatch = line.match(/^\[done\]\s+(.+)$/)
      if (doneMatch) {
        sendLog(`${getStockAgentLabel(doneMatch[1])}을 완료했습니다.`)
        safeSend(win, IPC.STOCK_ANALYSIS_AGENT, { name: doneMatch[1], status: 'done' })
        continue
      }

      // [실패], [경고], [error] 라인 → 에러 로그로 수집
      if (/^\[(실패|경고|error)\]/.test(line)) {
        errorLogLines.push(line)
      }

      // [error] <유저 친화적 메시지> → 스크립트에서 출력한 에러 메시지 캡처
      const errorMatch = line.match(/^\[error\]\s+(.+)$/)
      if (errorMatch) {
        lastUserErrorMsg = errorMatch[1]
        continue
      }

      // 최종 리포트 저장 완료: <경로> → 분석 완료 이벤트
      const reportMatch = line.match(/^최종 리포트 저장 완료:\s+(.+)$/)
      if (reportMatch) {
        finalReportPath = reportMatch[1]
        sendLog('최종 투자 리포트를 저장했습니다.')
        finishSuccess(finalReportPath)
      }
    }
  })

  child.stderr!.on('data', (data: Buffer) => {
    const text = data.toString().trim()
    if (!text) return
    writeTerminalLine(`[stock-analysis:claude] ${text}`, true)

    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed) continue
      errorLogLines.push(`[stderr] ${trimmed}`)
    }

    sendLog(`Claude CLI: ${text.split(/\r?\n/).at(-1) ?? text}`)
  })

  /**
   * 에러 로그를 파일로 저장하고, stdout 전체 기록을 포함한 최종 로그 문자열을 반환한다.
   */
  function buildAndSaveErrorLog(): string {
    if (stdoutLogLines.length > 0) {
      errorLogLines.push('')
      errorLogLines.push('--- stdout 전체 기록 ---')
      errorLogLines.push(...stdoutLogLines)
    }
    const logPath = saveErrorLog('claude', errorLogLines)
    if (logPath) {
      errorLogLines.push('')
      errorLogLines.push(`[info] 로그 저장 위치: ${logPath}`)
    }
    return errorLogLines.join('\n')
  }

  child.on('close', (code) => {
    const wasCancelled = getActiveChild() === null
    setActiveChild(null)

    if (analysisCompleted) return

    if (code === 0) {
      if (!finalReportPath) {
        writeTerminalError('[stock-analysis:claude] 프로세스 정상 종료했으나 리포트 경로 미확인')
        errorLogLines.push('[error] 프로세스 정상 종료했으나 리포트 경로 미확인')
        safeSend(win, IPC.STOCK_ANALYSIS_DONE, {
          success: false,
          error: '분석에 실패하였습니다. 리포트 생성 결과를 확인할 수 없습니다. 잠시 후 다시 시도해 주세요.',
          errorLog: buildAndSaveErrorLog()
        })
        return
      }
      try {
        const report = readFileSync(finalReportPath, 'utf-8')
        safeSend(win, IPC.STOCK_ANALYSIS_CHUNK, report)
        safeSend(win, IPC.STOCK_ANALYSIS_DONE, { success: true })
      } catch (error) {
        const detail = error instanceof Error ? error.message : String(error)
        writeTerminalError(`[stock-analysis:claude] 리포트 파일 읽기 실패: path=${finalReportPath}, error=${detail}`)
        errorLogLines.push(`[error] 리포트 파일 읽기 실패: ${detail}`)
        safeSend(win, IPC.STOCK_ANALYSIS_DONE, {
          success: false,
          error: '분석에 실패하였습니다. 리포트 파일을 읽을 수 없습니다. 잠시 후 다시 시도해 주세요.',
          errorLog: buildAndSaveErrorLog()
        })
      }
      return
    }

    // 취소가 아닌 오류 종료일 때만 에러 이벤트 전송
    if (!wasCancelled) {
      writeTerminalError(`[stock-analysis:claude] 프로세스 비정상 종료: exit code=${code}`)
      errorLogLines.push(`[error] 프로세스 비정상 종료 (exit code: ${code})`)
      safeSend(win, IPC.STOCK_ANALYSIS_DONE, {
        success: false,
        error: lastUserErrorMsg || '분석에 실패하였습니다. 잠시 후 다시 시도해 주세요.',
        errorLog: buildAndSaveErrorLog()
      })
    }
  })

  child.on('error', (err) => {
    setActiveChild(null)
    writeTerminalError(`[stock-analysis:claude] CLI 실행 오류: ${err.message}`)
    errorLogLines.push(`[error] CLI 실행 오류: ${err.message}`)
    safeSend(win, IPC.STOCK_ANALYSIS_DONE, {
      success: false,
      error: '분석에 실패하였습니다. AI 도구를 실행할 수 없습니다. 설치 상태를 확인해 주세요.',
      errorLog: buildAndSaveErrorLog()
    })
  })
}
