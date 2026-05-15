import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { homedir } from 'os'
import { spawn } from 'child_process'
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

// CLI를 설치·실행할 앱 전용 경로 (~/.ai-cli-launcher)
// 사용자 홈 디렉토리 하위라서 권한 문제 없음
const CLI_PREFIX = join(homedir(), '.ai-cli-launcher')
const CLI_BIN = join(CLI_PREFIX, 'node_modules', '.bin')

// 멀티 에이전트 주식 분석 프로젝트 경로
// 개발: 프로젝트 루트 기준, 프로덕션: extraResources 기준
const STOCK_CLAUDE_DIR = is.dev
  ? join(app.getAppPath(), 'src', 'main', 'claude', 'stock-claude')
  : join(process.resourcesPath, 'claude', 'stock-claude')

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
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
    gpt: 'openai',
    claude: '@anthropic-ai/claude-code'
  }

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
    const child = spawn(npmCmd, ['install', '--prefix', CLI_PREFIX, pkg], {
      env: { ...process.env },
      stdio: ['ignore', 'pipe', 'pipe']
    })

    child.stdout.on('data', (data: Buffer) => {
      const lines = data.toString().split('\n')
      for (const line of lines) {
        if (line.trim()) {
          win.webContents.send('install-progress', line)
        }
      }
    })

    child.stderr.on('data', (data: Buffer) => {
      const lines = data.toString().split('\n')
      for (const line of lines) {
        if (line.trim()) {
          win.webContents.send('install-progress', line)
        }
      }
    })

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

  // ── API 키 저장 경로 ──
  function getKeyFilePath(): string {
    const dir = join(app.getPath('userData'), 'config')
    mkdirSync(dir, { recursive: true })
    return join(dir, 'apikey.json')
  }

  // ── API 키 검증 ──
  ipcMain.handle('validate-api-key', (_event, { model, apiKey }: { model: string; apiKey: string }) => {
    if (!apiKey || apiKey.trim().length < 8) {
      return { valid: false, error: '유효하지 않은 API 키입니다. 키를 다시 확인해 주세요.' }
    }
    if (model === 'gpt' && !apiKey.startsWith('sk-')) {
      return { valid: false, error: 'OpenAI API 키는 sk- 로 시작해야 합니다.' }
    }
    if (model === 'claude' && !apiKey.startsWith('sk-ant-')) {
      return { valid: false, error: 'Anthropic API 키는 sk-ant- 로 시작해야 합니다.' }
    }
    return { valid: true }
  })

  // ── API 키 저장 ──
  ipcMain.handle('save-api-key', (_event, { model, apiKey }: { model: string; apiKey: string }) => {
    try {
      let stored: Record<string, string> = {}
      try {
        stored = JSON.parse(readFileSync(getKeyFilePath(), 'utf-8'))
      } catch {
        // 파일 없음 — 빈 객체로 시작
      }
      stored[model] = apiKey
      writeFileSync(getKeyFilePath(), JSON.stringify(stored), 'utf-8')
    } catch (err) {
      console.error('API 키 저장 실패:', err)
    }
  })

  // ── API 키 로드 ──
  ipcMain.handle('load-api-key', (_event) => {
    try {
      // model 정보 없이 호출되므로 파일 전체를 반환하지 않고
      // renderer가 model을 넘기지 않는 현재 구조에선 null 반환
      // (AuthPage에서 loadApiKey 호출 시 model 미전달 → 저장된 키를 빈 객체로 읽어 null 반환)
      const stored: Record<string, string> = JSON.parse(readFileSync(getKeyFilePath(), 'utf-8'))
      // 가장 최근 저장된 키를 반환 (단일 모델 사용 가정)
      const values = Object.values(stored)
      return values.length > 0 ? values[values.length - 1] : null
    } catch {
      return null
    }
  })

  // ── Claude CLI 로그인 ──
  ipcMain.on('run-claude-login', (_event) => {
    const claudeCmd = join(CLI_BIN, process.platform === 'win32' ? 'claude.cmd' : 'claude')
    const child = spawn(claudeCmd, ['login'], {
      env: { ...process.env },
      stdio: ['ignore', 'pipe', 'pipe']
    })

    child.stdout.on('data', (data: Buffer) => {
      const lines = data.toString().split('\n')
      for (const line of lines) {
        if (line.trim()) win.webContents.send('cli-login-progress', line)
      }
    })

    child.stderr.on('data', (data: Buffer) => {
      const lines = data.toString().split('\n')
      for (const line of lines) {
        if (line.trim()) win.webContents.send('cli-login-progress', line)
      }
    })

    child.on('close', (code) => {
      win.webContents.send('cli-login-complete', { success: code === 0 })
    })

    child.on('error', (err) => {
      win.webContents.send('cli-login-progress', `오류: ${err.message}`)
      win.webContents.send('cli-login-complete', { success: false })
    })
  })

  // ── 프롬프트 실행 ──
  ipcMain.on(
    'run-prompt',
    (_event, { model, prompt, apiKey }: { model: string; prompt: string; apiKey: string }) => {
      let cmd: string
      let args: string[]

      if (model === 'gpt') {
        // openai CLI: OPENAI_API_KEY 환경변수로 인증
        cmd = join(CLI_BIN, process.platform === 'win32' ? 'openai.cmd' : 'openai')
        args = ['api', 'chat.completions.create', '-m', 'gpt-4o-mini', '-g', `user:${prompt}`]
      } else {
        // claude CLI: ANTHROPIC_API_KEY 환경변수로 인증 (또는 claude login 세션)
        cmd = join(CLI_BIN, process.platform === 'win32' ? 'claude.cmd' : 'claude')
        args = ['-p', prompt, '--output-format', 'text']
      }

      const env: NodeJS.ProcessEnv = { ...process.env }
      if (model === 'gpt' && apiKey) env['OPENAI_API_KEY'] = apiKey
      if (model === 'claude' && apiKey) env['ANTHROPIC_API_KEY'] = apiKey

      const child = spawn(cmd, args, {
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

  ipcMain.on('run-stock-analysis', (_event, { prompt, apiKey }: { prompt: string; apiKey: string }) => {
    const claudeCmd = join(CLI_BIN, process.platform === 'win32' ? 'claude.cmd' : 'claude')
    const args = ['-p', prompt, '--output-format', 'stream-json', '--verbose']

    const env: NodeJS.ProcessEnv = { ...process.env }
    if (apiKey) env['ANTHROPIC_API_KEY'] = apiKey

    // detached: true — Unix에서 별도 프로세스 그룹 생성, 취소 시 그룹 전체 종료 가능
    const child = spawn(claudeCmd, args, {
      env,
      cwd: STOCK_CLAUDE_DIR,
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: process.platform !== 'win32'
    })
    activeAnalysisChild = child

    let buf = ''
    // tool_use_id → 에이전트 key 매핑 (어느 에이전트가 완료됐는지 추적)
    const agentToolMap = new Map<string, string>()

    child.stdout.on('data', (data: Buffer) => {
      buf += data.toString()
      const lines = buf.split('\n')
      buf = lines.pop() ?? ''

      for (const line of lines) {
        if (!line.trim()) continue
        try {
          const ev = JSON.parse(line) as Record<string, unknown>

          // 에이전트 Tool 호출 감지 → running 상태 전송
          if (ev.type === 'assistant') {
            const content = (ev.message as { content?: unknown[] } | undefined)?.content ?? []
            for (const block of content) {
              const b = block as Record<string, unknown>
              if (b.type === 'tool_use') {
                const input = b.input as Record<string, unknown> | undefined
                const agentType = input?.subagent_type as string | undefined
                if (agentType) {
                  agentToolMap.set(b.id as string, agentType)
                  win.webContents.send('stock-analysis-agent', { name: agentType, status: 'running' })
                }
              }
            }
          }

          // Tool 결과 수신 → 해당 에이전트 done 상태 전송
          if (ev.type === 'user') {
            const content = (ev.message as { content?: unknown[] } | undefined)?.content ?? []
            for (const block of content) {
              const b = block as Record<string, unknown>
              if (b.type === 'tool_result') {
                const agentType = agentToolMap.get(b.tool_use_id as string)
                if (agentType) {
                  win.webContents.send('stock-analysis-agent', { name: agentType, status: 'done' })
                  agentToolMap.delete(b.tool_use_id as string)
                }
              }
            }
          }

          // 최종 결과 전송
          if (ev.type === 'result') {
            if (ev.subtype === 'success') {
              win.webContents.send('stock-analysis-chunk', ev.result ?? '')
              win.webContents.send('stock-analysis-done', { success: true })
            } else {
              win.webContents.send('stock-analysis-done', {
                success: false,
                error: (ev.error as string) ?? '분석 실패'
              })
            }
          }
        } catch {
          // JSON이 아닌 출력은 무시
        }
      }
    })

    child.stderr.on('data', (data: Buffer) => {
      const text = data.toString()
      if (text.toLowerCase().includes('error')) {
        console.error('[stock-analysis]', text.trim())
      }
    })

    child.on('close', (code) => {
      const wasCancelled = activeAnalysisChild === null
      activeAnalysisChild = null
      if (code !== 0 && !wasCancelled) {
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
  })
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
