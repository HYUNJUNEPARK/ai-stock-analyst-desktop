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
 *   claude CLI를 --output-format stream-json --verbose 옵션으로 실행한다.
 *   Claude가 stdout에 JSON Lines(줄마다 JSON 1개) 형식으로 이벤트를 출력한다.
 *   각 JSON 이벤트 타입:
 *     'assistant' + tool_use : 에이전트 서브태스크 시작 (subagent_type으로 에이전트 식별)
 *     'user' + tool_result   : 에이전트 서브태스크 완료
 *     'result'               : 전체 분석 완료, result 필드에 최종 보고서 텍스트 포함
 *   agentToolMap: tool_use id → 에이전트명 매핑 (시작~완료 이벤트 연결에 사용)
 */

import { ipcMain, type BrowserWindow } from 'electron'
import { join } from 'path'
import { spawn, type ChildProcess } from 'child_process'
import { readFileSync, mkdirSync, writeFileSync } from 'fs'
import { homedir } from 'os'
import { IPC } from '../../shared/ipcChannels'
import { STOCK_CLAUDE_DIR, STOCK_GPT_DIR } from '../constants'
import { spawnCommand, writeTerminalLine, safeSend } from '../utils/spawn'
import { getCliCommand, resolveCliCommand, getEnhancedPath } from '../utils/cli'

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
    console.error(`[stock-analysis] 에러 로그 파일 저장 실패: ${err instanceof Error ? err.message : String(err)}`)
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
    console.log('[cancel-stock-analysis] 주식 분석 취소 요청')
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
    (_event, { model, prompt }: { model: string; prompt: string }) => {
      console.log(`[run-stock-analysis] 주식 분석 실행 시작: 모델=${model}`)
      const env: NodeJS.ProcessEnv = { ...process.env, PATH: getEnhancedPath() }

      if (model === 'gpt') {
        runGptAnalysis({ win, env, prompt, sendLog, getActiveChild: () => activeAnalysisChild, setActiveChild: (c) => { activeAnalysisChild = c } })
      } else {
        runClaudeAnalysis({ win, env, prompt, sendLog, getActiveChild: () => activeAnalysisChild, setActiveChild: (c) => { activeAnalysisChild = c } })
      }
    }
  )
}

interface AnalysisContext {
  win: BrowserWindow
  env: NodeJS.ProcessEnv
  prompt: string
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
function runGptAnalysis({ win, env, prompt, sendLog, setActiveChild, getActiveChild }: AnalysisContext): void {
  const resolvedCodex = resolveCliCommand('codex')
  if (!resolvedCodex.command) {
    console.error('[stock-analysis:gpt] Codex CLI를 찾을 수 없음')
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

  // 실행 명령: node <STOCK_GPT_DIR>/scripts/analyze-stock.mjs --request <prompt>
  const child = spawn(
    process.execPath,
    [join(STOCK_GPT_DIR, 'scripts', 'analyze-stock.mjs'), '--request', prompt],
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
      console.error(`[stock-analysis:gpt] 리포트 파일 읽기 실패: path=${reportPath}, error=${detail}`)
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

  child.stderr!.on('data', (data: Buffer) => {
    const text = data.toString().trim()
    if (text) {
      writeTerminalLine(`[stock-analysis:gpt] ${text}`, true)
      errorLogLines.push(`[stderr] ${text}`)
      // stderr의 마지막 줄만 UI에 표시 (중간 진행 출력이 많을 수 있으므로)
      sendLog(`Codex CLI: ${text.split(/\r?\n/).at(-1) ?? text}`)
    }
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
        console.error('[stock-analysis:gpt] 프로세스 정상 종료했으나 리포트 경로 미확인')
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
        console.error(`[stock-analysis:gpt] 리포트 파일 읽기 실패: path=${finalReportPath}, error=${detail}`)
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
      console.error(`[stock-analysis:gpt] 프로세스 비정상 종료: exit code=${code}`)
      errorLogLines.push(`[error] 프로세스 비정상 종료 (exit code: ${code})`)
      safeSend(win,IPC.STOCK_ANALYSIS_DONE, {
        success: false,
        error: lastUserErrorMsg || '분석에 실패하였습니다. 잠시 후 다시 시도해 주세요.',
        errorLog: buildAndSaveErrorLog()
      })
    }
  })

  child.on('error', (err) => {
    setActiveChild(null)
    console.error(`[stock-analysis:gpt] CLI 실행 오류: ${err.message}`)
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
 * claude CLI를 stream-json 모드로 실행하고 JSON Lines 이벤트 스트림을 파싱해
 * 에이전트 진행 상황과 최종 보고서를 renderer에 전달한다.
 */
function runClaudeAnalysis({ win, env, prompt, sendLog, setActiveChild, getActiveChild }: AnalysisContext): void {
  // --output-format stream-json: 이벤트를 JSON Lines 형식으로 스트리밍 출력
  // --verbose: tool_use / tool_result 이벤트를 포함한 전체 이벤트 스트림 출력
  // 실행 명령: claude -p <prompt> --output-format stream-json --verbose
  const claudeCmd = getCliCommand('claude')
  const args = ['-p', prompt, '--output-format', 'stream-json', '--verbose']

  // detached: true — Unix에서 별도 프로세스 그룹 생성, 취소 시 그룹 전체 종료 가능
  const child = spawnCommand(claudeCmd, args, {
    env,
    cwd: STOCK_CLAUDE_DIR,   // 이 디렉토리의 CLAUDE.md와 .claude/agents/ 설정이 자동 적용됨
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: process.platform !== 'win32'
  })
  setActiveChild(child)
  sendLog('투자 리포트 생성을 시작했습니다.')

  let buf = ''
  let analysisCompleted = false
  const errorLogLines: string[] = collectEnvironmentInfo('claude', claudeCmd, 'local')
  const stdoutLogLines: string[] = []  // 전체 stdout 기록 (디버깅용)

  /**
   * tool_use id → 에이전트명(subagent_type) 매핑
   * Claude는 에이전트 시작(tool_use)과 완료(tool_result)를 id로 연결하므로
   * 시작 시 id를 저장하고, 완료 시 해당 id로 에이전트명을 조회한다.
   */
  const agentToolMap = new Map<string, string>()

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

  /**
   * Claude JSON Lines 스트림의 'result' 타입 이벤트를 처리한다.
   * subtype이 'success'면 result 필드에 최종 보고서 텍스트가 포함되어 있다.
   */
  function handleResultEvent(ev: Record<string, unknown>): void {
    if (analysisCompleted) return
    analysisCompleted = true
    if (ev.subtype === 'success') {
      sendLog('최종 투자 리포트를 생성했습니다.')
      safeSend(win,IPC.STOCK_ANALYSIS_CHUNK, ev.result ?? '')
      safeSend(win,IPC.STOCK_ANALYSIS_DONE, { success: true })
    } else {
      const detail = (ev.error as string) ?? 'unknown'
      console.error(`[stock-analysis:claude] result 이벤트 실패: ${detail}`)
      errorLogLines.push(`[error] Claude result 실패: ${detail}`)
      safeSend(win,IPC.STOCK_ANALYSIS_DONE, {
        success: false,
        error: '분석에 실패하였습니다. AI 모델 응답에 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
        errorLog: buildAndSaveErrorLog()
      })
    }
  }

  child.stdout.on('data', (data: Buffer) => {
    buf += data.toString()
    const lines = buf.split('\n')
    buf = lines.pop() ?? ''   // 불완전한 마지막 줄은 버퍼에 유지

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue
      stdoutLogLines.push(trimmed)
      try {
        const ev = JSON.parse(trimmed) as Record<string, unknown>

        // 'assistant' 이벤트: Claude가 tool_use(에이전트 호출)를 시작할 때 발생
        if (ev.type === 'assistant') {
          const content = (ev.message as { content?: unknown[] } | undefined)?.content ?? []
          for (const block of content) {
            const b = block as Record<string, unknown>
            if (b.type === 'tool_use') {
              const input = b.input as Record<string, unknown> | undefined
              const agentType = input?.subagent_type as string | undefined
              if (agentType) {
                agentToolMap.set(b.id as string, agentType)   // id → 에이전트명 저장
                sendLog(`${getStockAgentLabel(agentType)}을 시작했습니다.`)
                safeSend(win,IPC.STOCK_ANALYSIS_AGENT, { name: agentType, status: 'running' })
              }
            }
          }
        }

        // 'user' 이벤트: tool_result(에이전트 응답 반환)가 포함될 때 발생
        if (ev.type === 'user') {
          const content = (ev.message as { content?: unknown[] } | undefined)?.content ?? []
          for (const block of content) {
            const b = block as Record<string, unknown>
            if (b.type === 'tool_result') {
              const agentType = agentToolMap.get(b.tool_use_id as string)
              if (agentType) {
                sendLog(`${getStockAgentLabel(agentType)}을 완료했습니다.`)
                safeSend(win,IPC.STOCK_ANALYSIS_AGENT, { name: agentType, status: 'done' })
                agentToolMap.delete(b.tool_use_id as string)   // 완료된 매핑 제거
              }
            }
          }
        }

        // 'result' 이벤트: 전체 분석 완료
        if (ev.type === 'result') {
          handleResultEvent(ev)
        }
      } catch {
        // JSON 파싱 실패 시 원본 라인을 에러 로그에 기록
        errorLogLines.push(`[warn] JSON 파싱 실패: ${trimmed.slice(0, 200)}`)
      }
    }
  })

  child.stderr.on('data', (data: Buffer) => {
    const text = data.toString().trim()
    if (!text) return
    writeTerminalLine(`[stock-analysis:claude] ${text}`, true)
    // 모든 stderr를 수집하되, error 키워드 포함 시 [stderr:error]로 표시
    if (text.toLowerCase().includes('error')) {
      errorLogLines.push(`[stderr:error] ${text}`)
      sendLog(`Claude CLI: ${text.split(/\r?\n/).at(-1) ?? text}`)
    } else {
      errorLogLines.push(`[stderr] ${text}`)
    }
  })

  child.on('close', (code) => {
    const wasCancelled = getActiveChild() === null
    setActiveChild(null)

    // 마지막 줄이 \n 없이 끝나면 buf에 남아있을 수 있음 — 여기서 처리
    if (!analysisCompleted && buf.trim()) {
      try {
        const ev = JSON.parse(buf.trim()) as Record<string, unknown>
        if (ev.type === 'result') {
          handleResultEvent(ev)
          return
        }
      } catch {
        errorLogLines.push(`[warn] 마지막 버퍼 JSON 파싱 실패: ${buf.trim().slice(0, 200)}`)
      }
    }

    if (analysisCompleted || wasCancelled) return

    console.error(`[stock-analysis:claude] 프로세스 종료: exit code=${code}, analysisCompleted=${analysisCompleted}`)
    errorLogLines.push(`[error] 프로세스 종료 (exit code: ${code})`)
    safeSend(win,IPC.STOCK_ANALYSIS_DONE, {
      success: false,
      error: code === 0
        ? '분석에 실패하였습니다. 분석 결과를 가져오지 못했습니다. 잠시 후 다시 시도해 주세요.'
        : '분석에 실패하였습니다. 잠시 후 다시 시도해 주세요.',
      errorLog: buildAndSaveErrorLog()
    })
  })

  child.on('error', (err) => {
    setActiveChild(null)
    console.error(`[stock-analysis:claude] CLI 실행 오류: ${err.message}`)
    errorLogLines.push(`[error] CLI 실행 오류: ${err.message}`)
    safeSend(win,IPC.STOCK_ANALYSIS_DONE, {
      success: false,
      error: '분석에 실패하였습니다. AI 도구를 실행할 수 없습니다. 설치 상태를 확인해 주세요.',
      errorLog: buildAndSaveErrorLog()
    })
  })
}
