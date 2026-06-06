import { ipcMain, type BrowserWindow } from 'electron'
import { IPC } from '../../shared/ipcChannels'
import { getEnhancedPath, resolveCliCommand, streamLines } from '../utils/cli'
import { isCodexAuthenticated } from '../utils/auth'
import { safeSend, spawnCommand, writeTerminalError, writeTerminalLog } from '../utils/spawn'

const CODEX_AUTH_POLL_INTERVAL_MS = 1000
const CODEX_AUTH_POLL_TIMEOUT_MS = 10 * 60 * 1000

type CliName = 'claude' | 'codex'
type LoginResult = { success: boolean; error?: string }

function runCliLogin(win: BrowserWindow, name: CliName, args: string[] = []): void {
  writeTerminalLog(`[${name}] CLI login started`)
  const resolved = resolveCliCommand(name)

  let loginCompleteSent = false
  let authPollTimer: ReturnType<typeof setInterval> | null = null

  function stopAuthPolling(): void {
    if (authPollTimer) {
      clearInterval(authPollTimer)
      authPollTimer = null
    }
  }

  function sendLoginComplete(result: LoginResult): void {
    if (loginCompleteSent) return
    loginCompleteSent = true
    stopAuthPolling()
    safeSend(win, IPC.CLI_LOGIN_COMPLETE, result)
  }

  if (!resolved.command) {
    const label = name === 'codex' ? 'Codex CLI' : 'Claude CLI'
    safeSend(win, IPC.CLI_LOGIN_PROGRESS, `${label} 실행 파일을 찾지 못했습니다.`)
    sendLoginComplete({
      success: false,
      error: `${label}가 설치되어 있지 않습니다. /download 화면에서 다시 설치해 주세요.`
    })
    return
  }

  if (resolved.source === 'path') {
    safeSend(
      win,
      IPC.CLI_LOGIN_PROGRESS,
      `앱 전용 ${name} 설치본이 없어 시스템 PATH의 ${resolved.command}를 사용합니다.`
    )
  }

  const child = spawnCommand(resolved.command, args, {
    env: { ...process.env, PATH: getEnhancedPath() },
    stdio: ['ignore', 'pipe', 'pipe']
  })

  function finishCodexLoginFromAuthFile(): void {
    if (name !== 'codex' || !isCodexAuthenticated()) return

    writeTerminalLog('[codex] auth file detected before login process exit')
    safeSend(win, IPC.CLI_LOGIN_PROGRESS, 'Codex 인증 정보를 감지했습니다.')
    sendLoginComplete({ success: true })

    if (!child.killed && child.exitCode === null) {
      child.kill()
    }
  }

  if (name === 'codex') {
    const startedAt = Date.now()
    authPollTimer = setInterval(() => {
      if (Date.now() - startedAt >= CODEX_AUTH_POLL_TIMEOUT_MS) {
        stopAuthPolling()
        return
      }

      finishCodexLoginFromAuthFile()
    }, CODEX_AUTH_POLL_INTERVAL_MS)

    finishCodexLoginFromAuthFile()
  }

  streamLines(win, child, IPC.CLI_LOGIN_PROGRESS, 'stdout')
  streamLines(win, child, IPC.CLI_LOGIN_PROGRESS, 'stderr')

  child.on('close', (code) => {
    if (code === 0 || (name === 'codex' && isCodexAuthenticated())) {
      writeTerminalLog(`[${name}] CLI login completed`)
      sendLoginComplete({ success: true })
      return
    }

    writeTerminalError(`[${name}] CLI login failed (exit code: ${code})`)
    sendLoginComplete({
      success: false,
      error: `로그인 실패 (exit code: ${code})`
    })
  })

  child.on('error', (err) => {
    safeSend(win, IPC.CLI_LOGIN_PROGRESS, `오류: ${err.message}`)
    sendLoginComplete({
      success: false,
      error: `CLI 실행 오류: ${err.message}`
    })
  })
}

export function registerCliAuthHandlers(win: BrowserWindow): void {
  ipcMain.on(IPC.RUN_CLAUDE_LOGIN, () => {
    writeTerminalLog('[run-claude-login] Claude CLI login requested')
    runCliLogin(win, 'claude', ['login'])
  })

  ipcMain.on(IPC.RUN_GPT_LOGIN, () => {
    writeTerminalLog('[run-gpt-login] GPT CLI login requested')
    runCliLogin(win, 'codex', ['login'])
  })
}
