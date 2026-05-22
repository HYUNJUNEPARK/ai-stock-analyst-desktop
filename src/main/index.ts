/**
 * src/main/index.ts — Electron 메인 프로세스
 *
 * Electron은 세 레이어로 구성된다.
 *   1. renderer  : React UI (브라우저 환경, Node.js API 직접 사용 불가)
 *   2. preload   : contextBridge로 renderer ↔ main 사이의 안전한 통신 채널 정의
 *   3. main (여기): Node.js 환경. 파일 I/O, child_process, 시스템 API를 실제로 실행
 *
 * renderer가 어떤 작업을 요청하면:
 *   renderer → (window.api.xxx) → preload → (ipcRenderer) → main(여기) → 결과 반환
 *
 * IPC 통신 방식 요약:
 *   ipcMain.on     : renderer가 트리거, 응답 없음 (단방향 — 설치 시작, 로그인 시작 등)
 *   ipcMain.handle : renderer가 트리거, return 값이 renderer로 전달 (양방향 — 상태 조회 등)
 *   win.webContents.send : main이 renderer로 데이터를 push (이벤트 스트리밍)
 */

import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { homedir } from 'os'
import { spawn, spawnSync, type ChildProcessByStdio, type SpawnOptions } from 'child_process'
import { readFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import type { Readable } from 'stream'
import iconv from 'iconv-lite'
import icon from '../../resources/icon.png?asset'

// ── 경로 상수 ──────────────────────────────────────────────────────

/**
 * CLI 전용 설치 디렉토리: ~/.ai-cli-launcher
 *
 * npm install -g 대신 --prefix 옵션으로 이 경로에 설치한다.
 * 이유: 전역 설치는 관리자 권한이 필요해 EACCES(exit 243) 오류가 발생할 수 있기 때문.
 * 사용자 홈 하위 경로이므로 권한 문제 없이 설치 가능.
 */
const CLI_PREFIX = join(homedir(), '.ai-cli-launcher')

/**
 * CLI 실행 파일 위치: ~/.ai-cli-launcher/node_modules/.bin
 * npm install --prefix 로 설치하면 실행 파일이 이 경로에 생성된다.
 * (예: ~/.ai-cli-launcher/node_modules/.bin/claude)
 */
const CLI_BIN = join(CLI_PREFIX, 'node_modules', '.bin')

/**
 * Claude 멀티 에이전트 주식 분석 프로젝트 루트 경로
 *
 * 개발 환경(is.dev): 프로젝트 소스 기준 src/main/claude
 * 프로덕션 빌드  : electron-builder의 extraResources로 패키징된 경로
 *
 * 이 디렉토리를 cwd로 설정해 Claude CLI를 실행하면,
 * Claude가 해당 디렉토리의 CLAUDE.md와 .claude/agents/ 설정을 자동으로 읽는다.
 */
const STOCK_CLAUDE_DIR = is.dev
  ? join(app.getAppPath(), 'src', 'main', 'claude')
  : join(process.resourcesPath, 'claude')

/**
 * GPT(Codex) 멀티 에이전트 주식 분석 프로젝트 루트 경로
 * Claude와 동일한 방식으로 개발/프로덕션을 분기한다.
 */
const STOCK_GPT_DIR = is.dev
  ? join(app.getAppPath(), 'src', 'main', 'gpt')
  : join(process.resourcesPath, 'gpt')

/** GPT 분석 결과 마크다운 보고서가 저장되는 디렉토리 */
const STOCK_GPT_REPORTS_DIR = join(STOCK_GPT_DIR, 'reports')

// ── 타입 정의 ──────────────────────────────────────────────────────

/** spawn 옵션 중 stdio가 ['ignore', 'pipe', 'pipe']로 고정된 타입 */
type PipedSpawnOptions = SpawnOptions & { stdio: ['ignore', 'pipe', 'pipe'] }

/** stdout/stderr가 Readable 스트림인 child_process 타입 */
type PipedChildProcess = ChildProcessByStdio<null, Readable, Readable>

// ── 유틸리티 함수 ──────────────────────────────────────────────────

/**
 * 플랫폼을 고려한 child_process.spawn 래퍼
 *
 * 문제 배경:
 *   Windows에서 npm이 설치한 CLI는 실행 파일이 .cmd 확장자(예: claude.cmd)로 생성된다.
 *   .cmd 파일을 spawn()으로 직접 실행하면 EINVAL/ENVAL 오류가 발생한다.
 *
 * 해결 방법:
 *   Windows + .cmd/.bat 파일인 경우, cmd.exe를 통해 간접 실행한다.
 *   ComSpec 환경변수는 시스템의 기본 cmd.exe 경로를 가리킨다.
 *   /d: 레지스트리 AutoRun 무시, /s /c: 명령 실행 후 종료
 */
function spawnCommand(
  command: string,
  args: string[],
  options: PipedSpawnOptions
): PipedChildProcess {
  console.log(`[spawnCommand] command="${command}" args=${JSON.stringify(args)}`)
  if (process.platform === 'win32' && /\.(cmd|bat)$/i.test(command)) {
    return spawn(process.env['ComSpec'] ?? 'cmd.exe', ['/d', '/s', '/c', command, ...args], options)
  }
  return spawn(command, args, options)
}

/**
 * 터미널(Electron 실행 콘솔)에 로그를 출력하는 함수
 *
 * Windows에서 console.log는 UTF-8로 출력하지만,
 * Windows 기본 터미널(CMD)은 CP949(EUC-KR) 인코딩을 사용한다.
 * 한글이 포함된 로그가 깨지는 것을 막기 위해 iconv-lite로 인코딩 변환 후 직접 stream에 쓴다.
 *
 * macOS/Linux는 UTF-8 기본이므로 console.log/error를 그대로 사용한다.
 */
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

// ── 창 생성 ────────────────────────────────────────────────────────

/**
 * Electron 메인 윈도우를 생성하고 초기화한다.
 *
 * 주요 설정:
 * - sandbox: false  → child_process 사용을 위해 필요 (contextIsolation은 유지)
 * - preload         → renderer와 main 사이의 브릿지 스크립트 지정
 * - autoHideMenuBar → 상단 메뉴바 자동 숨김 (앱처럼 보이게)
 *
 * 개발 환경에서는 Vite 개발 서버 URL을 로드하고,
 * 프로덕션에서는 빌드된 index.html 파일을 로드한다.
 */
function createWindow(): void {
  console.log('[createWindow] 메인 윈도우 생성 시작')
  const mainWindow = new BrowserWindow({
    width: 1040,
    height: 780,
    show: false,          // 창이 준비되기 전에 빈 화면이 보이는 것을 방지
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false      // child_process 사용을 위해 허용
    }
  })

  // 창 콘텐츠가 완전히 로드된 후 표시 → 흰 화면 깜빡임 방지
  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  // 앱 내부 링크 클릭 시 새 창 대신 OS 기본 브라우저로 열기
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }   // Electron 내부 새 창 생성은 차단
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])  // Vite HMR 서버
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))  // 빌드 결과물
  }

  registerIpcHandlers(mainWindow)
}

// ── IPC 핸들러 등록 ──────────────────────────────────────────────

/**
 * renderer ↔ main 간 모든 IPC 채널을 등록한다.
 *
 * BrowserWindow 인스턴스(win)를 인자로 받는 이유:
 *   win.webContents.send()로 main → renderer 방향 이벤트를 push하기 위해서다.
 *   ipcMain.on/handle만으로는 renderer → main 단방향 통신만 가능하므로,
 *   역방향(main → renderer) push에는 win 참조가 반드시 필요하다.
 */
function registerIpcHandlers(win: BrowserWindow): void {
  console.log('[registerIpcHandlers] IPC 핸들러 등록 시작')

  /**
   * 모델명 → npm 패키지명 매핑
   * CLI를 설치할 때 어떤 npm 패키지를 설치할지 결정한다.
   */
  const CLI_PACKAGES: Record<string, string> = {
    gpt: '@openai/codex',
    claude: '@anthropic-ai/claude-code'
  }

  /**
   * 앱 전용 설치 경로에서 CLI 실행 파일 경로를 반환한다.
   *
   * Windows는 npm이 .cmd 파일로 래퍼를 생성하므로 확장자를 붙인다.
   * 예) macOS: ~/.ai-cli-launcher/node_modules/.bin/claude
   *     Windows: ~/.ai-cli-launcher/node_modules/.bin/claude.cmd
   */
  function getCliCommand(name: 'claude' | 'codex'): string {
    console.log(`[getCliCommand] name="${name}"`)
    const ext = process.platform === 'win32' ? '.cmd' : ''
    return join(CLI_BIN, `${name}${ext}`)
  }

  /**
   * CLI 실행 파일을 찾아 경로와 출처를 반환한다.
   *
   * 탐색 우선순위:
   *   1. 앱 전용 설치 경로(~/.ai-cli-launcher) — 존재하면 즉시 반환
   *   2. 시스템 PATH — which(macOS/Linux) / where(Windows)로 탐색
   *   3. 없으면 { command: null, source: 'missing' } 반환
   *
   * source 값의 의미:
   *   'local'  : 앱이 설치한 전용 CLI
   *   'path'   : 사용자가 별도로 설치한 시스템 CLI (폴백)
   *   'missing': CLI가 설치되지 않음
   */
  function resolveCliCommand(name: 'claude' | 'codex'): { command: string | null; source: 'local' | 'path' | 'missing' } {
    console.log(`[resolveCliCommand] name="${name}"`)
    const localCommand = getCliCommand(name)
    if (existsSync(localCommand)) {
      return { command: localCommand, source: 'local' }
    }

    // 시스템 PATH에서 탐색 (폴백)
    const fallbackCommand = process.platform === 'win32' ? `${name}.cmd` : name
    const resolver = process.platform === 'win32' ? 'where' : 'which'
    const result = spawnSync(resolver, [fallbackCommand], {
      env: { ...process.env },
      stdio: 'ignore'
    })

    if (result.status === 0) {
      console.log(`[resolveCliCommand] name="${name}" → source=path, command="${fallbackCommand}"`)
      return { command: fallbackCommand, source: 'path' }
    }

    console.log(`[resolveCliCommand] name="${name}" → source=missing`)
    return { command: null, source: 'missing' }
  }

  /**
   * child_process의 stdout 또는 stderr를 줄 단위로 읽어 IPC 채널로 전송한다.
   *
   * 설치 진행 로그나 로그인 진행 메시지처럼 실시간으로 renderer에 스트리밍할 때 사용한다.
   * 빈 줄은 전송하지 않아 UI 노이즈를 줄인다.
   *
   * @param child   - 실행 중인 child_process
   * @param channel - renderer로 보낼 IPC 채널명
   * @param source  - 읽을 스트림 ('stdout' | 'stderr')
   */
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

  /**
   * Claude 또는 Codex CLI의 로그인 명령을 실행한다. (claude/codex 공통 로직)
   *
   * 실행 흐름:
   *   1. resolveCliCommand로 CLI 경로 확인
   *   2. CLI 미설치 시 에러 이벤트 전송 후 종료
   *   3. 시스템 PATH 폴백 사용 시 안내 메시지 전송
   *   4. CLI 실행 → stdout/stderr를 'cli-login-progress' 채널로 실시간 스트리밍
   *   5. 프로세스 종료 시 성공/실패 결과를 'cli-login-complete' 채널로 전송
   *
   * @param name - 'claude' | 'codex'
   * @param args - CLI에 전달할 추가 인수 (예: ['login'])
   */
  function runCliLogin(name: 'claude' | 'codex', args: string[] = []): void {
    console.log(`[runCliLogin] name="${name}" args=${JSON.stringify(args)}`)
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

  // ── [handle] CLI 설치 여부 + 인증 상태 확인 ──────────────────────
  /**
   * IPC 채널: 'check-cli-status'
   * 방향: renderer → main → renderer (handle = 양방향)
   * 용도: 앱 시작 시 또는 화면 진입 시 CLI 설치·인증 상태를 확인해 라우팅에 활용
   *
   * 반환값: { cliInstalled: boolean, authenticated: boolean }
   *
   * 인증 상태 확인 방식:
   *   Claude: ~/.claude/.credentials.json 파일의 OAuth 토큰 및 만료 시각 검사
   *   GPT   : ~/.codex/auth.json 파일의 accessToken / oauthToken / apiKey 존재 여부 검사
   */
  ipcMain.handle('check-cli-status', (_event, model: string) => {
    console.log(`[IPC:handle] check-cli-status model="${model}"`)
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

        // 토큰 만료 여부 확인 (expiresAt이 현재 시각보다 과거이면 만료)
        if (account.expiresAt && Date.now() >= new Date(account.expiresAt).getTime()) {
          return { cliInstalled: true, authenticated: false }
        }

        return { cliInstalled: true, authenticated: true }
      }

      if (model === 'gpt') {
        const authPath = join(homedir(), '.codex', 'auth.json')
        if (!existsSync(authPath)) return { cliInstalled: true, authenticated: false }

        const auth = JSON.parse(readFileSync(authPath, 'utf-8'))
        // 세 가지 토큰 형식 중 하나라도 있으면 인증된 것으로 판단
        const hasToken = Boolean(auth?.accessToken || auth?.oauthToken || auth?.apiKey)
        return { cliInstalled: true, authenticated: hasToken }
      }
    } catch {
      return { cliInstalled: true, authenticated: false }
    }

    return { cliInstalled: true, authenticated: false }
  })

  // ── [on] CLI 설치 ─────────────────────────────────────────────────
  /**
   * IPC 채널: 'start-cli-install'
   * 방향: renderer → main (on = 단방향)
   * 용도: 선택된 모델의 CLI npm 패키지를 앱 전용 경로에 설치
   *
   * 설치 명령: npm install --prefix ~/.ai-cli-launcher <패키지명>
   * 진행 상황: 'install-progress' 채널로 실시간 스트리밍
   * 완료 결과: 'install-complete' 채널로 성공/실패 전송
   *
   * Windows에서는 npm.cmd를 사용해야 실행 가능 (npm은 .cmd 래퍼로 제공됨)
   */
  ipcMain.on('start-cli-install', (_event, model: string) => {
    console.log(`[IPC:on] start-cli-install model="${model}"`)
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

  // ── 날짜 유틸 ─────────────────────────────────────────────────────

  /**
   * 이번 주 월요일 ~ 오늘 날짜 범위를 계산한다.
   *
   * CLI 사용 통계를 '이번 주' 기준으로 집계하기 위해 사용한다.
   * 일요일(getDay() === 0)은 주의 마지막 날이므로 6일 전을 월요일로 계산한다.
   *
   * 반환값:
   *   weekStart  : 'YYYY-MM-DD' 형식의 이번 주 월요일
   *   weekEnd    : 'YYYY-MM-DD' 형식의 오늘
   *   mondayTs   : Unix timestamp(초 단위) — SQLite 쿼리의 WHERE 조건에 사용
   */
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

  // ── [handle] CLI 사용 통계 조회 ───────────────────────────────────
  /**
   * IPC 채널: 'check-cli-stats'
   * 방향: renderer → main → renderer (handle = 양방향)
   * 용도: 설정 화면 등에서 이번 주 CLI 사용량(토큰, 세션 수 등)을 표시
   *
   * 모델별 데이터 소스:
   *   Claude: ~/.claude/stats-cache.json (Claude CLI가 자동 생성·갱신하는 캐시 파일)
   *   GPT   : ~/.codex/state_5.sqlite (Codex CLI가 관리하는 SQLite DB)
   *           — sqlite3 CLI 도구를 spawn해서 쿼리 실행
   *
   * 반환값 예시:
   *   { success: true, weekStart, weekEnd, weekly: { sessions, messages, toolCalls, tokensByModel } }
   */
  ipcMain.handle('check-cli-stats', (_event, model: string) => {
    console.log(`[IPC:handle] check-cli-stats model="${model}"`)
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
        // mondayTs(Unix 초)를 기준으로 이번 주 threads를 모델별로 집계
        const query = `SELECT COALESCE(model,'unknown') as model, COUNT(*) as sessions, SUM(tokens_used) as tokens FROM threads WHERE created_at >= ${mondayTs} GROUP BY model;`
        const result = spawnSync('sqlite3', [dbPath, '-separator', '|', query], { encoding: 'utf-8' })

        if (result.error) throw result.error
        if (result.status !== 0) throw new Error(result.stderr || 'sqlite3 실행 실패')

        const tokensByModel: Record<string, number> = {}
        let sessions = 0

        // sqlite3 출력 형식: "modelName|sessionCount|tokenCount\n..."
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

  // ── [handle] GPT 보고서 파일 목록 조회 ───────────────────────────
  /**
   * IPC 채널: 'list-gpt-report-files'
   * 방향: renderer → main → renderer (handle = 양방향)
   * 용도: GPT 분석으로 생성된 마크다운 보고서 목록을 UI에 표시
   *
   * STOCK_GPT_REPORTS_DIR 내 .md 파일을 스캔하고,
   * 파일 수정 시각(mtime) 기준으로 최신 순으로 정렬해 반환한다.
   *
   * 반환값 예시:
   *   [{ name: '삼성전자_20260101.md', model: 'gpt', updatedAt: '2026-01-01T...' }, ...]
   */
  ipcMain.handle('list-gpt-report-files', () => {
    console.log('[IPC:handle] list-gpt-report-files')
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

  // ── [on] Claude CLI 로그인 ────────────────────────────────────────
  /**
   * IPC 채널: 'run-claude-login'
   * 방향: renderer → main (on = 단방향)
   * 용도: Claude 인증 화면에서 로그인 버튼 클릭 시 'claude login' 실행
   *
   * 진행/완료 이벤트: 'cli-login-progress', 'cli-login-complete' 채널로 전송
   */
  ipcMain.on('run-claude-login', () => {
    console.log('[IPC:on] run-claude-login')
    runCliLogin('claude', ['login'])
  })

  // ── [on] Codex CLI 로그인 ─────────────────────────────────────────
  /**
   * IPC 채널: 'run-gpt-login'
   * 방향: renderer → main (on = 단방향)
   * 용도: GPT 인증 화면에서 로그인 버튼 클릭 시 'codex login' 실행
   *
   * 진행/완료 이벤트: 'cli-login-progress', 'cli-login-complete' 채널로 전송
   */
  ipcMain.on('run-gpt-login', () => {
    console.log('[IPC:on] run-gpt-login')
    runCliLogin('codex', ['login'])
  })

  // ── [on] 단발 프롬프트 실행 ───────────────────────────────────────
  /**
   * IPC 채널: 'run-prompt'
   * 방향: renderer → main (on = 단방향)
   * 용도: 프롬프트 화면에서 사용자가 입력한 질문을 CLI로 실행
   *
   * 모델별 실행 명령:
   *   GPT   : codex exec --skip-git-repo-check --color never <prompt>
   *   Claude: claude -p <prompt> --output-format text
   *
   * 응답 스트리밍: stdout 데이터를 받는 즉시 'prompt-response-chunk' 채널로 전송
   * 완료 결과: 프로세스 종료 시 'prompt-response-done' 채널로 전송
   *
   * stderr 처리:
   *   Claude CLI는 진행 상태를 stderr에도 출력하므로 'error' 키워드가 있을 때만 전달
   */
  ipcMain.on(
    'run-prompt',
    (_event, { model, prompt}: { model: string; prompt: string;}) => {
      console.log(`[IPC:on] run-prompt model="${model}"`)
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
        // Claude CLI는 stderr에 진행 정보를 출력하기도 함 — error 관련 메시지만 전달
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

  // ── 주식 멀티 에이전트 분석 ───────────────────────────────────────

  /**
   * 현재 실행 중인 주식 분석 child_process 참조
   * 취소 요청 시 이 참조로 프로세스를 종료한다.
   * null이면 실행 중인 분석이 없음을 의미한다.
   */
  let activeAnalysisChild: ReturnType<typeof spawn> | null = null

  /**
   * 에이전트 내부 식별자 → UI 표시용 한글 레이블 매핑
   * 분석 진행 상황을 사용자에게 알릴 때 사용한다.
   */
  const stockAgentLabels: Record<string, string> = {
    'financial-analyst-kr': '재무 분석',
    'news-sentiment-analyst': '뉴스 분석',
    'sector-researcher': '섹터 분석',
    'aggressive-investment-strategist': '투자 전략'
  }

  /**
   * 주식 분석 로그를 터미널과 renderer 양쪽에 동시에 전송하는 헬퍼
   * 터미널: Electron 실행 콘솔 (개발자 디버깅용)
   * renderer: 'stock-analysis-log' IPC 채널 → UI 로그 패널에 표시
   */
  function sendStockAnalysisLog(message: string): void {
    writeTerminalLine(`[stock-analysis] ${message}`)
    win.webContents.send('stock-analysis-log', message)
  }

  /** 에이전트 식별자를 한글 레이블로 변환. 매핑에 없으면 식별자 그대로 반환 */
  function getStockAgentLabel(name: string): string {
    return stockAgentLabels[name] ?? name
  }

  // ── [on] 주식 분석 취소 ───────────────────────────────────────────
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
  ipcMain.on('cancel-stock-analysis', () => {
    console.log('[IPC:on] cancel-stock-analysis')
    if (activeAnalysisChild) {
      const pid = activeAnalysisChild.pid
      activeAnalysisChild = null   // 먼저 null로 설정 → close 핸들러에서 취소 여부 판단
      if (pid !== undefined) {
        // 프로세스 그룹 전체 종료 — 에이전트 하위 프로세스까지 모두 제거
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

  // ── [on] 주식 멀티 에이전트 분석 실행 ────────────────────────────
  /**
   * IPC 채널: 'run-stock-analysis'
   * 방향: renderer → main (on = 단방향)
   * 용도: 사용자가 종목명/분석 요청을 입력하고 분석 시작 버튼을 클릭했을 때 호출
   *
   * 모델별 실행 방식이 완전히 다르므로 아래에서 분기한다.
   *
   * ── GPT 분석 흐름 ──
   *   analyze-stock.mjs 스크립트를 Node.js(process.execPath)로 직접 실행한다.
   *   스크립트 내부에서 Codex CLI를 순차적으로 호출해 4개 에이전트를 실행한다.
   *   스크립트는 stdout에 구조화된 텍스트 라인을 출력한다:
   *     [start] <에이전트명>  → 에이전트 시작 알림
   *     [done] <에이전트명>   → 에이전트 완료 알림
   *     최종 리포트 저장 완료: <파일경로>  → 분석 완료, 파일 경로 알림
   *   최종 보고서는 파일로 저장되며, 경로를 받아 readFileSync로 읽어 renderer에 전달한다.
   *
   * ── Claude 분석 흐름 ──
   *   claude CLI를 --output-format stream-json --verbose 옵션으로 실행한다.
   *   Claude가 stdout에 JSON Lines(줄마다 JSON 1개) 형식으로 이벤트를 출력한다.
   *   각 JSON 이벤트 타입:
   *     'assistant' + tool_use: 에이전트 서브태스크 시작 (subagent_type으로 에이전트 식별)
   *     'user' + tool_result : 에이전트 서브태스크 완료
   *     'result'             : 전체 분석 완료, result 필드에 최종 보고서 텍스트 포함
   *   agentToolMap: tool_use id → 에이전트명 매핑 (시작~완료 이벤트 연결에 사용)
   */
  ipcMain.on(
    'run-stock-analysis',
    (_event, { model, prompt }: { model: string; prompt: string; apiKey: string }) => {
      console.log(`[IPC:on] run-stock-analysis model="${model}"`)
    const env: NodeJS.ProcessEnv = { ...process.env }

      // ── GPT 분기 ──
      if (model === 'gpt') {
        const resolvedCodex = resolveCliCommand('codex')
        if (!resolvedCodex.command) {
          win.webContents.send('stock-analysis-done', {
            success: false,
            error: 'Codex CLI가 설치되어 있지 않습니다. /download 화면에서 다시 설치해 주세요.'
          })
          return
        }

        // 스크립트가 codex 경로를 환경변수로 받아 사용
        env['CODEX_BIN'] = resolvedCodex.command

        const child = spawn(
          process.execPath,   // 현재 Electron의 Node.js 실행 파일 경로
          [join(STOCK_GPT_DIR, 'scripts', 'analyze-stock.mjs'), '--request', prompt],
          {
            env,
            cwd: STOCK_GPT_DIR,
            stdio: ['ignore', 'pipe', 'pipe'],
            detached: process.platform !== 'win32'   // Unix: 프로세스 그룹 분리 → 취소 시 그룹 전체 종료 가능
          }
        )
        activeAnalysisChild = child
        sendStockAnalysisLog('투자 리포트 생성을 시작했습니다.')

        let buf = ''              // 줄 단위 파싱을 위한 버퍼 (data 이벤트가 줄 중간에 끊길 수 있음)
        let finalReportPath = '' // 최종 보고서 파일 경로 (스크립트 stdout에서 파싱)
        let analysisCompleted = false  // 중복 완료 처리 방지 플래그

        /**
         * 최종 보고서 파일을 읽어 renderer에 전달하는 헬퍼
         * analysisCompleted 플래그로 close 이벤트와의 중복 처리를 방지한다.
         */
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
          buf = lines.pop() ?? ''   // 마지막 불완전한 줄은 다음 data 이벤트까지 버퍼에 유지

          for (const rawLine of lines) {
            const line = rawLine.trim()
            if (!line) continue
            writeTerminalLine(`[stock-analysis:gpt:stdout] ${line}`)

            // 시스템 PATH 폴백 사용 알림 (스크립트가 bootstrap 시 출력하는 특수 라인)
            if (resolvedCodex.source === 'path' && line === '[bootstrap] codex-fallback:path') {
              win.webContents.send(
                'stock-analysis-chunk',
                '> 시스템 PATH의 `codex` 실행 파일을 사용합니다.\n\n'
              )
              continue
            }

            // [start] <에이전트명> → 에이전트 시작 이벤트
            const startMatch = line.match(/^\[start\]\s+(.+)$/)
            if (startMatch) {
              sendStockAnalysisLog(`${getStockAgentLabel(startMatch[1])}을 시작했습니다.`)
              win.webContents.send('stock-analysis-agent', {
                name: startMatch[1],
                status: 'running'
              })
              continue
            }

            // [done] <에이전트명> → 에이전트 완료 이벤트
            const doneMatch = line.match(/^\[done\]\s+(.+)$/)
            if (doneMatch) {
              sendStockAnalysisLog(`${getStockAgentLabel(doneMatch[1])}을 완료했습니다.`)
              win.webContents.send('stock-analysis-agent', {
                name: doneMatch[1],
                status: 'done'
              })
              continue
            }

            // 최종 리포트 저장 완료: <경로> → 분석 완료 이벤트
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
            // stderr의 마지막 줄만 UI에 표시 (중간 진행 출력이 많을 수 있으므로)
            sendStockAnalysisLog(`Codex CLI: ${text.split(/\r?\n/).at(-1) ?? text}`)
          }
        })

        child.on('close', (code) => {
          const wasCancelled = activeAnalysisChild === null  // 취소로 인한 종료인지 확인
          activeAnalysisChild = null

          if (analysisCompleted) return   // stdout에서 이미 완료 처리됨

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

          // 취소가 아닌 오류 종료일 때만 에러 이벤트 전송
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

      // ── Claude 분기 ──
      // --output-format stream-json: 이벤트를 JSON Lines 형식으로 스트리밍 출력
      // --verbose: tool_use / tool_result 이벤트를 포함한 전체 이벤트 스트림 출력
      const claudeCmd = getCliCommand('claude')
      const args = ['-p', prompt, '--output-format', 'stream-json', '--verbose']

      // detached: true — Unix에서 별도 프로세스 그룹 생성, 취소 시 그룹 전체 종료 가능
      const child = spawnCommand(claudeCmd, args, {
        env,
        cwd: STOCK_CLAUDE_DIR,   // 이 디렉토리의 CLAUDE.md와 .claude/agents/ 설정이 자동 적용됨
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: process.platform !== 'win32'
      })
      activeAnalysisChild = child
      sendStockAnalysisLog('투자 리포트 생성을 시작했습니다.')

      let buf = ''
      let claudeAnalysisCompleted = false

      /**
       * tool_use id → 에이전트명(subagent_type) 매핑
       * Claude는 에이전트 시작(tool_use)과 완료(tool_result)를 id로 연결하므로
       * 시작 시 id를 저장하고, 완료 시 해당 id로 에이전트명을 조회한다.
       */
      const agentToolMap = new Map<string, string>()

      /**
       * Claude JSON Lines 스트림의 'result' 타입 이벤트 처리
       * subtype이 'success'면 result 필드에 최종 보고서 텍스트가 포함되어 있다.
       */
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
        buf = lines.pop() ?? ''   // 불완전한 마지막 줄은 버퍼에 유지

        for (const line of lines) {
          if (!line.trim()) continue
          try {
            const ev = JSON.parse(line) as Record<string, unknown>

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
                    sendStockAnalysisLog(`${getStockAgentLabel(agentType)}을 시작했습니다.`)
                    win.webContents.send('stock-analysis-agent', { name: agentType, status: 'running' })
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
                    sendStockAnalysisLog(`${getStockAgentLabel(agentType)}을 완료했습니다.`)
                    win.webContents.send('stock-analysis-agent', { name: agentType, status: 'done' })
                    agentToolMap.delete(b.tool_use_id as string)   // 완료된 매핑 제거
                  }
                }
              }
            }

            // 'result' 이벤트: 전체 분석 완료
            if (ev.type === 'result') {
              handleClaudeResultEvent(ev)
            }
          } catch {
            // JSON 파싱 실패는 무시 (Claude CLI가 가끔 비JSON 진행 메시지를 출력하기도 함)
          }
        }
      })

      child.stderr.on('data', (data: Buffer) => {
        const text = data.toString()
        // error 키워드가 있을 때만 처리 (Claude CLI가 stderr에 일반 진행 정보도 출력함)
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

// ── 앱 생명주기 ────────────────────────────────────────────────────

app.whenReady().then(() => {
  // macOS 앱 ID 설정 (Dock, 알림 등에 사용)
  electronApp.setAppUserModelId('com.electron')

  // 개발 환경에서 F12로 DevTools 열기 등 단축키 최적화
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  // macOS: Dock 아이콘 클릭 시 창이 없으면 새로 생성 (macOS 관례)
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// 모든 창이 닫히면 앱 종료 (macOS 제외 — macOS는 창 없이 백그라운드 유지가 관례)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
