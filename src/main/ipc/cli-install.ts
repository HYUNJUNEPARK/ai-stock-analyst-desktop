import { existsSync, mkdirSync, readFileSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'
import { ipcMain, type BrowserWindow } from 'electron'
import { IPC } from '../../shared/ipcChannels'
import { CLI_PREFIX } from '../constants'
import { decodeProcessOutput, getEnhancedPath, resolveCliCommand, streamLines } from '../utils/cli'
import { isCodexAuthenticated } from '../utils/auth'
import { safeSend, spawnCommand, writeTerminalError, writeTerminalLog } from '../utils/spawn'

const CLI_PACKAGES: Record<string, string> = {
  gpt: '@openai/codex',
  claude: '@anthropic-ai/claude-code'
}

export function registerCliInstallHandlers(win: BrowserWindow): void {
  ipcMain.on(IPC.START_CLI_INSTALL, (_event, model: string) => {
    writeTerminalLog(`[start-cli-install] "${model}" model install started`)
    const pkg = CLI_PACKAGES[model]
    if (!pkg) {
      safeSend(win, IPC.INSTALL_COMPLETE, {
        success: false,
        error: `알 수 없는 모델: ${model}`
      })
      return
    }

    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm'
    mkdirSync(CLI_PREFIX, { recursive: true })

    const child = spawnCommand(npmCmd, ['install', '--prefix', CLI_PREFIX, pkg], {
      env: { ...process.env, PATH: getEnhancedPath() },
      stdio: ['ignore', 'pipe', 'pipe']
    })

    const stderrChunks: Buffer[] = []

    streamLines(win, child, IPC.INSTALL_PROGRESS, 'stdout')
    streamLines(win, child, IPC.INSTALL_PROGRESS, 'stderr')

    child.stderr?.on('data', (chunk: Buffer) => {
      stderrChunks.push(Buffer.from(chunk))
    })

    child.on('close', (code) => {
      if (code === 0) {
        writeTerminalLog(`[start-cli-install] "${model}" model install completed`)
        safeSend(win, IPC.INSTALL_COMPLETE, { success: true })
        return
      }

      const stderrText = decodeProcessOutput(Buffer.concat(stderrChunks)).trim()
      const lastLines = stderrText.split('\n').filter(Boolean).slice(-5).join('\n')
      const detail = lastLines
        ? `설치 중 오류가 발생했습니다. (exit code: ${code})\n${lastLines}`
        : `설치 중 오류가 발생했습니다. (exit code: ${code})`

      writeTerminalError(`[start-cli-install] "${model}" model install failed (exit code: ${code})`)
      if (stderrText) writeTerminalError(`[start-cli-install] stderr:\n${stderrText}`)
      safeSend(win, IPC.INSTALL_COMPLETE, {
        success: false,
        error: detail
      })
    })

    child.on('error', (err) => {
      safeSend(win, IPC.INSTALL_COMPLETE, {
        success: false,
        error: `npm 실행 실패: ${err.message}`
      })
    })
  })

  ipcMain.handle(IPC.CHECK_CLI_STATUS, (_event, model: string) => {
    writeTerminalLog(`[check-cli-status] checking CLI status: model=${model}`)
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
        return { cliInstalled: true, authenticated: isCodexAuthenticated() }
      }
    } catch {
      return { cliInstalled: true, authenticated: false }
    }

    return { cliInstalled: true, authenticated: false }
  })
}
