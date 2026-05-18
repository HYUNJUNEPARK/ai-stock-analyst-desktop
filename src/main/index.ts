import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { homedir } from 'os'
import { spawn, spawnSync, type ChildProcessByStdio, type SpawnOptions } from 'child_process'
import { readFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import type { Readable } from 'stream'
import iconv from 'iconv-lite'
import icon from '../../resources/icon.png?asset'

// CLI를 설치·실행할 앱 전용 경로 (~/.ai-cli-launcher)
// 사용자 홈 디렉토리 하위라서 권한 문제 없음
const CLI_PREFIX = join(homedir(), '.ai-cli-launcher')
const CLI_BIN = join(CLI_PREFIX, 'node_modules', '.bin')

// 멀티 에이전트 주식 분석 프로젝트 경로
// 개발: 프로젝트 루트 기준, 프로덕션: extraResources 기준
const STOCK_CLAUDE_DIR = is.dev
  ? join(app.getAppPath(), 'src', 'main', 'claude')
  : join(process.resourcesPath, 'claude')
const STOCK_GPT_DIR = is.dev
  ? join(app.getAppPath(), 'src', 'main', 'gpt')
  : join(process.resourcesPath, 'gpt')
const STOCK_GPT_REPORTS_DIR = join(STOCK_GPT_DIR, 'reports')

type PipedSpawnOptions = SpawnOptions & { stdio: ['ignore', 'pipe', 'pipe'] }
type PipedChildProcess = ChildProcessByStdio<null, Readable, Readable>

// Windows/Electron에서 .cmd/.bat 파일을 직접 실행하면 spawn EINVAL/ENVAL 오류가 날 수 있어서 추가한 코드.
function spawnCommand(
  command: string,
  args: string[],
  options: PipedSpawnOptions
): PipedChildProcess {
  if (process.platform === 'win32' && /\.(cmd|bat)$/i.test(command)) {
    return spawn(process.env['ComSpec'] ?? 'cmd.exe', ['/d', '/s', '/c', command, ...args], options)
  }

  return spawn(command, args, options)
}

function writeTerminalLine(message: string, isError = false): void {
  if (process.platform === 'win32') {
    const stream = isError ? process.stderr : process.stdout
    stream.write(iconv.encode(`${message}\n`, 'cp949'))
    return
  }

  if (isError) {
    console.error(message)
    return
  }

  console.log(message)
}

function createWindow(): void {
  // 메인 창 생성(프로그램 시작 시 기본 창 크기 설정)
  const mainWindow = new BrowserWindow({
    width: 1040,
    height: 780,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  registerIpcHandlers(mainWindow)
}

// ── IPC 핸들러 등록 ──────────────────────────────────────────────

function registerIpcHandlers(win: BrowserWindow): void {
  // CLI 패키지 매핑
  const CLI_PACKAGES: Record<string, string> = {
    gpt: '@openai/codex',
    claude: '@anthropic-ai/claude-code'
  }

  function getCliCommand(name: 'claude' | 'codex'): string {
    const ext = process.platform === 'win32' ? '.cmd' : ''
    return join(CLI_BIN, `${name}${ext}`)
  }

  function resolveCliCommand(name: 'claude' | 'codex'): { command: string | null; source: 'local' | 'path' | 'missing' } {
    const localCommand = getCliCommand(name)
    if (existsSync(localCommand)) {
      return { command: localCommand, source: 'local' }
    }

    const fallbackCommand = process.platform === 'win32' ? `${name}.cmd` : name
    const resolver = process.platform === 'win32' ? 'where' : 'which'
    const result = spawnSync(resolver, [fallbackCommand], {
      env: { ...process.env },
      stdio: 'ignore'
    })

    if (result.status === 0) {
      return { command: fallbackCommand, source: 'path' }
    }

    return { command: null, source: 'missing' }
  }

  function streamLines(
    child: ReturnType<typeof spawn>,
    channel: 'install-progress' | 'cli-login-progress',
    source: 'stdout' | 'stderr'
  ): void {
    const stream = child[source]
    if (!stream) return

    stream.on('data', (data: Buffer) => {
      const lines = data.toString().split('\n')
      for (const line of lines) {
        if (line.trim()) {
          win.webContents.send(channel, line)
        }
      }
    })
  }

  // CLI 로그인 실행 함수 (Codex, Claude 공통)
  function runCliLogin(name: 'claude' | 'codex', args: string[] = []): void {
    const resolved = resolveCliCommand(name)
    if (!resolved.command) {
      const label = name === 'codex' ? 'Codex CLI' : 'Claude CLI'
      win.webContents.send('cli-login-progress', `${label} 실행 파일을 찾지 못했습니다.`)
      win.webContents.send('cli-login-complete', {
        success: false,
        error: `${label}가 설치되어 있지 않습니다. /download 화면에서 다시 설치해 주세요.`
      })
      return
    }

    if (resolved.source === 'path') {
      win.webContents.send(
        'cli-login-progress',
        `앱 전용 ${name} 설치본이 없어 시스템 PATH의 ${resolved.command}를 사용합니다.`
      )
    }

    const child = spawnCommand(resolved.command, args, {
      env: { ...process.env },
      stdio: ['ignore', 'pipe', 'pipe']
    })

    streamLines(child, 'cli-login-progress', 'stdout')
    streamLines(child, 'cli-login-progress', 'stderr')

    child.on('close', (code) => {
      win.webContents.send('cli-login-complete', {
        success: code === 0,
        error: code === 0 ? undefined : `로그인 실패 (exit code: ${code})`
      })
    })

    child.on('error', (err) => {
      win.webContents.send('cli-login-progress', `오류: ${err.message}`)
      win.webContents.send('cli-login-complete', {
        success: false,
        error: `CLI 실행 오류: ${err.message}`
      })
    })
  }

  // ── CLI 설치 여부 + 인증 상태 확인 ──
  ipcMain.handle('check-cli-status', (_event, model: string) => {
    const cliName = model === 'claude' ? 'claude' : 'codex'
    const resolved = resolveCliCommand(cliName)

    if (!resolved.command) {
      return { cliInstalled: false, authenticated: false }
    }

    try {
      if (model === 'claude') {
        const credPath = join(homedir(), '.claude', '.credentials.json')
        if (!existsSync(credPath)) return { cliInstalled: true, authenticated: false }

        const creds = JSON.parse(readFileSync(credPath, 'utf-8'))
        const account = creds?.claudeAiOauthAccount
        if (!account) return { cliInstalled: true, authenticated: false }

        if (account.expiresAt && Date.now() >= new Date(account.expiresAt).getTime()) {
          return { cliInstalled: true, authenticated: false }
        }

        return { cliInstalled: true, authenticated: true }
      }

      if (model === 'gpt') {
        const authPath = join(homedir(), '.codex', 'auth.json')
        if (!existsSync(authPath)) return { cliInstalled: true, authenticated: false }

        const auth = JSON.parse(readFileSync(authPath, 'utf-8'))
        const hasToken = Boolean(auth?.accessToken || auth?.oauthToken || auth?.apiKey)
        return { cliInstalled: true, authenticated: hasToken }
      }
    } catch {
      return { cliInstalled: true, authenticated: false }
    }

    return { cliInstalled: true, authenticated: false }
  })

  // ── CLI 설치 ──
  ipcMain.on('start-cli-install', (_event, model: string) => {
    const pkg = CLI_PACKAGES[model]
    if (!pkg) {
      win.webContents.send('install-complete', {
        success: false,
        error: `알 수 없는 모델: ${model}`
      })
      return
    }

    // npm 경로: 플랫폼별 처리
    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm'
    // -g 대신 --prefix로 사용자 홈 하위 경로에 설치 → EACCES(exit 243) 방지
    mkdirSync(CLI_PREFIX, { recursive: true })
    const child = spawnCommand(npmCmd, ['install', '--prefix', CLI_PREFIX, pkg], {
      env: { ...process.env },
      stdio: ['ignore', 'pipe', 'pipe']
    })

    streamLines(child, 'install-progress', 'stdout')
    streamLines(child, 'install-progress', 'stderr')

    child.on('close', (code) => {
      if (code === 0) {
        win.webContents.send('install-complete', { success: true })
      } else {
        win.webContents.send('install-complete', {
          success: false,
          error: `설치 중 오류가 발생했습니다. (exit code: ${code})`
        })
      }
    })

    child.on('error', (err) => {
      win.webContents.send('install-complete', {
        success: false,
        error: `npm 실행 실패: ${err.message}`
      })
    })
  })

  // ── 이번 주 월요일 날짜 계산 (로컬 시간 기준) ──
  function getWeekRange(): { weekStart: string; weekEnd: string; mondayTs: number } {
    const today = new Date()
    const dow = today.getDay()
    const daysFromMon = dow === 0 ? 6 : dow - 1
    const monday = new Date(today)
    monday.setDate(today.getDate() - daysFromMon)
    monday.setHours(0, 0, 0, 0)

    function fmt(d: Date): string {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    }
    return { weekStart: fmt(monday), weekEnd: fmt(today), mondayTs: Math.floor(monday.getTime() / 1000) }
  }

  ipcMain.handle('check-cli-stats', (_event, model: string) => {
    const { weekStart, weekEnd, mondayTs } = getWeekRange()

    // ── Claude: stats-cache.json ──
    if (model === 'claude') {
      try {
        interface DailyActivity { date: string; messageCount: number; sessionCount: number; toolCallCount: number }
        interface DailyModelTokens { date: string; tokensByModel: Record<string, number> }
        interface StatsCache { dailyActivity: DailyActivity[]; dailyModelTokens: DailyModelTokens[] }

        const raw = readFileSync(join(homedir(), '.claude', 'stats-cache.json'), 'utf-8')
        const stats: StatsCache = JSON.parse(raw)
        const inWeek = (d: string): boolean => d >= weekStart && d <= weekEnd

        let messages = 0, sessions = 0, toolCalls = 0
        const tokensByModel: Record<string, number> = {}

        for (const d of stats.dailyActivity) {
          if (inWeek(d.date)) {
            messages += d.messageCount
            sessions += d.sessionCount
            toolCalls += d.toolCallCount
          }
        }
        for (const d of stats.dailyModelTokens) {
          if (inWeek(d.date)) {
            for (const [m, t] of Object.entries(d.tokensByModel)) {
              tokensByModel[m] = (tokensByModel[m] ?? 0) + t
            }
          }
        }
        return { success: true, weekStart, weekEnd, weekly: { sessions, messages, toolCalls, tokensByModel } }
      } catch (err) {
        return { success: false, error: `stats-cache.json 읽기 실패: ${(err as Error).message}` }
      }
    }

    // ── GPT: ~/.codex/state_5.sqlite ──
    if (model === 'gpt') {
      try {
        const dbPath = join(homedir(), '.codex', 'state_5.sqlite')
        const query = `SELECT COALESCE(model,'unknown') as model, COUNT(*) as sessions, SUM(tokens_used) as tokens FROM threads WHERE created_at >= ${mondayTs} GROUP BY model;`
        const result = spawnSync('sqlite3', [dbPath, '-separator', '|', query], { encoding: 'utf-8' })

        if (result.error) throw result.error
        if (result.status !== 0) throw new Error(result.stderr || 'sqlite3 실행 실패')

        const tokensByModel: Record<string, number> = {}
        let sessions = 0

        for (const line of result.stdout.trim().split('\n').filter(Boolean)) {
          const [modelName, sessionCount, tokenCount] = line.split('|')
          if (modelName) tokensByModel[modelName] = (tokensByModel[modelName] ?? 0) + Number(tokenCount ?? 0)
          sessions += Number(sessionCount ?? 0)
        }
        return { success: true, weekStart, weekEnd, weekly: { sessions, tokensByModel } }
      } catch (err) {
        return { success: false, error: `state_5.sqlite 읽기 실패: ${(err as Error).message}` }
      }
    }

    return { success: false, error: '지원하지 않는 모델입니다.' }
  })

  // GPT 보고서 파일 목록 조회
  ipcMain.handle('list-gpt-report-files', () => {
    try {
      if (!existsSync(STOCK_GPT_REPORTS_DIR)) return []

      return readdirSync(STOCK_GPT_REPORTS_DIR)
        .filter((name) => name.endsWith('.md'))
        .map((name) => {
          const path = join(STOCK_GPT_REPORTS_DIR, name)
          const stats = statSync(path)

          return {
            name,
            model: 'gpt',
            updatedAt: stats.mtime.toISOString()
          }
        })
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    } catch (error) {
      console.error('GPT 리포트 목록 조회 실패:', error)
      return []
    }
  })

  // ── Claude CLI 로그인 ──
  ipcMain.on('run-claude-login', () => {
    runCliLogin('claude', ['login'])
  })

  // ── Codex CLI 로그인 ──
  ipcMain.on('run-gpt-login', () => {
    runCliLogin('codex', ['login'])
  })

  // ── 프롬프트 실행 ──
  ipcMain.on(
    'run-prompt',
    (_event, { model, prompt}: { model: string; prompt: string;}) => {
      let cmd: string
      let args: string[]

      if (model === 'gpt') {
        cmd = getCliCommand('codex')
        args = ['exec', '--skip-git-repo-check', '--color', 'never', prompt]
      } else {
        // claude CLI: ANTHROPIC_API_KEY 환경변수로 인증 (또는 claude login 세션)
        cmd = getCliCommand('claude')
        args = ['-p', prompt, '--output-format', 'text']
      }

      const env: NodeJS.ProcessEnv = { ...process.env }

      const child = spawnCommand(cmd, args, {
        env,
        stdio: ['ignore', 'pipe', 'pipe']
      })

      child.stdout.on('data', (data: Buffer) => {
        win.webContents.send('prompt-response-chunk', data.toString())
      })

      child.stderr.on('data', (data: Buffer) => {
        // claude CLI는 stderr에 진행 정보를 출력하기도 함 — 무시
        const text = data.toString()
        if (text.toLowerCase().includes('error')) {
          win.webContents.send('prompt-response-chunk', text)
        }
      })

      child.on('close', (code) => {
        if (code === 0) {
          win.webContents.send('prompt-response-done', { success: true })
        } else {
          win.webContents.send('prompt-response-done', {
            success: false,
            error: `CLI 실행 실패 (exit code: ${code})`
          })
        }
      })

      child.on('error', (err) => {
        win.webContents.send('prompt-response-done', {
          success: false,
          error: `CLI 실행 오류: ${err.message}`
        })
      })
    }
  )

  // ── 주식 멀티 에이전트 분석 ──
  let activeAnalysisChild: ReturnType<typeof spawn> | null = null
  const stockAgentLabels: Record<string, string> = {
    'financial-analyst-kr': '재무 분석',
    'news-sentiment-analyst': '뉴스 분석',
    'sector-researcher': '섹터 분석',
    'aggressive-investment-strategist': '투자 전략'
  }

  function sendStockAnalysisLog(message: string): void {
    writeTerminalLine(`[stock-analysis] ${message}`)
    win.webContents.send('stock-analysis-log', message)
  }

  function getStockAgentLabel(name: string): string {
    return stockAgentLabels[name] ?? name
  }

  ipcMain.on('cancel-stock-analysis', () => {
    if (activeAnalysisChild) {
      const pid = activeAnalysisChild.pid
      activeAnalysisChild = null
      if (pid !== undefined) {
        // 프로세스 그룹 전체 종료 — 에이전트 하위 프로세스까지 모두 제거
        if (process.platform === 'win32') {
          spawn('taskkill', ['/pid', String(pid), '/T', '/F'])
        } else {
          try {
            process.kill(-pid, 'SIGKILL')
          } catch {
            // 이미 종료된 경우 무시
          }
        }
      }
    }
  })

  ipcMain.on(
    'run-stock-analysis',
    (_event, { model, prompt }: { model: string; prompt: string; apiKey: string }) => {
    const env: NodeJS.ProcessEnv = { ...process.env }

      if (model === 'gpt') {
        const resolvedCodex = resolveCliCommand('codex')
        if (!resolvedCodex.command) {
          win.webContents.send('stock-analysis-done', {
            success: false,
            error: 'Codex CLI가 설치되어 있지 않습니다. /download 화면에서 다시 설치해 주세요.'
          })
          return
        }

        env['CODEX_BIN'] = resolvedCodex.command

        const child = spawn(
          process.execPath,
          [join(STOCK_GPT_DIR, 'scripts', 'analyze-stock.mjs'), '--request', prompt],
          {
            env,
            cwd: STOCK_GPT_DIR,
            stdio: ['ignore', 'pipe', 'pipe'],
            detached: process.platform !== 'win32'
          }
        )
        activeAnalysisChild = child
        sendStockAnalysisLog('투자 리포트 생성을 시작했습니다.')

        let buf = ''
        let finalReportPath = ''
        let analysisCompleted = false

        function finishStockAnalysisSuccess(reportPath: string): void {
          if (analysisCompleted) return
          analysisCompleted = true

          try {
            const report = readFileSync(reportPath, 'utf-8')
            win.webContents.send('stock-analysis-chunk', report)
            win.webContents.send('stock-analysis-done', { success: true })
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error)
            win.webContents.send('stock-analysis-done', {
              success: false,
              error: `리포트 읽기 실패: ${message}`
            })
          }
        }

        child.stdout.on('data', (data: Buffer) => {
          buf += data.toString()
          const lines = buf.split('\n')
          buf = lines.pop() ?? ''

          for (const rawLine of lines) {
            const line = rawLine.trim()
            if (!line) continue
            writeTerminalLine(`[stock-analysis:gpt:stdout] ${line}`)

            if (resolvedCodex.source === 'path' && line === '[bootstrap] codex-fallback:path') {
              win.webContents.send(
                'stock-analysis-chunk',
                '> 시스템 PATH의 `codex` 실행 파일을 사용합니다.\n\n'
              )
              continue
            }

            const startMatch = line.match(/^\[start\]\s+(.+)$/)
            if (startMatch) {
              sendStockAnalysisLog(`${getStockAgentLabel(startMatch[1])}을 시작했습니다.`)
              win.webContents.send('stock-analysis-agent', {
                name: startMatch[1],
                status: 'running'
              })
              continue
            }

            const doneMatch = line.match(/^\[done\]\s+(.+)$/)
            if (doneMatch) {
              sendStockAnalysisLog(`${getStockAgentLabel(doneMatch[1])}을 완료했습니다.`)
              win.webContents.send('stock-analysis-agent', {
                name: doneMatch[1],
                status: 'done'
              })
              continue
            }

            const reportMatch = line.match(/^최종 리포트 저장 완료:\s+(.+)$/)
            if (reportMatch) {
              finalReportPath = reportMatch[1]
              sendStockAnalysisLog('최종 투자 리포트를 저장했습니다.')
              finishStockAnalysisSuccess(finalReportPath)
            }
          }
        })

        child.stderr.on('data', (data: Buffer) => {
          const text = data.toString().trim()
          if (text) {
            writeTerminalLine(`[stock-analysis:gpt] ${text}`, true)
            sendStockAnalysisLog(`Codex CLI: ${text.split(/\r?\n/).at(-1) ?? text}`)
          }
        })

        child.on('close', (code) => {
          const wasCancelled = activeAnalysisChild === null
          activeAnalysisChild = null

          if (analysisCompleted) {
            return
          }

          if (code === 0) {
            if (!finalReportPath) {
              win.webContents.send('stock-analysis-done', {
                success: false,
                error: '최종 리포트 경로를 확인하지 못했습니다.'
              })
              return
            }

            try {
              const report = readFileSync(finalReportPath, 'utf-8')
              win.webContents.send('stock-analysis-chunk', report)
              win.webContents.send('stock-analysis-done', { success: true })
            } catch (error) {
              const message = error instanceof Error ? error.message : String(error)
              win.webContents.send('stock-analysis-done', {
                success: false,
                error: `리포트 읽기 실패: ${message}`
              })
            }
            return
          }

          if (!wasCancelled) {
            win.webContents.send('stock-analysis-done', {
              success: false,
              error: `분석 실패 (exit code: ${code})`
            })
          }
        })

        child.on('error', (err) => {
          activeAnalysisChild = null
          win.webContents.send('stock-analysis-done', {
            success: false,
            error: `CLI 실행 오류: ${err.message}`
          })
        })
        return
      }

      const claudeCmd = getCliCommand('claude')
      const args = ['-p', prompt, '--output-format', 'stream-json', '--verbose']

      // detached: true — Unix에서 별도 프로세스 그룹 생성, 취소 시 그룹 전체 종료 가능
      const child = spawnCommand(claudeCmd, args, {
        env,
        cwd: STOCK_CLAUDE_DIR,
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: process.platform !== 'win32'
      })
      activeAnalysisChild = child
      sendStockAnalysisLog('투자 리포트 생성을 시작했습니다.')

      let buf = ''
      let claudeAnalysisCompleted = false
      const agentToolMap = new Map<string, string>()

      function handleClaudeResultEvent(ev: Record<string, unknown>): void {
        if (claudeAnalysisCompleted) return
        claudeAnalysisCompleted = true
        if (ev.subtype === 'success') {
          sendStockAnalysisLog('최종 투자 리포트를 생성했습니다.')
          win.webContents.send('stock-analysis-chunk', ev.result ?? '')
          win.webContents.send('stock-analysis-done', { success: true })
        } else {
          win.webContents.send('stock-analysis-done', {
            success: false,
            error: (ev.error as string) ?? '분석 실패'
          })
        }
      }

      child.stdout.on('data', (data: Buffer) => {
        buf += data.toString()
        const lines = buf.split('\n')
        buf = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.trim()) continue
          try {
            const ev = JSON.parse(line) as Record<string, unknown>

            if (ev.type === 'assistant') {
              const content = (ev.message as { content?: unknown[] } | undefined)?.content ?? []
              for (const block of content) {
                const b = block as Record<string, unknown>
                if (b.type === 'tool_use') {
                  const input = b.input as Record<string, unknown> | undefined
                  const agentType = input?.subagent_type as string | undefined
                  if (agentType) {
                    agentToolMap.set(b.id as string, agentType)
                    sendStockAnalysisLog(`${getStockAgentLabel(agentType)}을 시작했습니다.`)
                    win.webContents.send('stock-analysis-agent', { name: agentType, status: 'running' })
                  }
                }
              }
            }

            if (ev.type === 'user') {
              const content = (ev.message as { content?: unknown[] } | undefined)?.content ?? []
              for (const block of content) {
                const b = block as Record<string, unknown>
                if (b.type === 'tool_result') {
                  const agentType = agentToolMap.get(b.tool_use_id as string)
                  if (agentType) {
                    sendStockAnalysisLog(`${getStockAgentLabel(agentType)}을 완료했습니다.`)
                    win.webContents.send('stock-analysis-agent', { name: agentType, status: 'done' })
                    agentToolMap.delete(b.tool_use_id as string)
                  }
                }
              }
            }

            if (ev.type === 'result') {
              handleClaudeResultEvent(ev)
            }
          } catch {
            // JSON이 아닌 출력은 무시
          }
        }
      })

      child.stderr.on('data', (data: Buffer) => {
        const text = data.toString()
        if (text.toLowerCase().includes('error')) {
          writeTerminalLine(`[stock-analysis:claude] ${text.trim()}`, true)
          sendStockAnalysisLog(`Claude CLI: ${text.trim().split(/\r?\n/).at(-1) ?? text.trim()}`)
        }
      })

      child.on('close', (code) => {
        const wasCancelled = activeAnalysisChild === null
        activeAnalysisChild = null

        // 마지막 줄이 \n 없이 끝나면 buf에 남아있을 수 있음 — 여기서 처리
        if (!claudeAnalysisCompleted && buf.trim()) {
          try {
            const ev = JSON.parse(buf.trim()) as Record<string, unknown>
            if (ev.type === 'result') {
              handleClaudeResultEvent(ev)
              return
            }
          } catch {
            // JSON이 아닌 경우 무시
          }
        }

        if (claudeAnalysisCompleted || wasCancelled) return

        win.webContents.send('stock-analysis-done', {
          success: false,
          error: code === 0
            ? '분석이 완료되었지만 결과를 가져오지 못했습니다.'
            : `분석 실패 (exit code: ${code})`
        })
      })

      child.on('error', (err) => {
        activeAnalysisChild = null
        win.webContents.send('stock-analysis-done', {
          success: false,
          error: `CLI 실행 오류: ${err.message}`
        })
      })
    }
  )
}

// ─────────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
