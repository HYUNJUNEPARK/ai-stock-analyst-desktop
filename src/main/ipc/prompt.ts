import { ipcMain, type BrowserWindow } from 'electron'
import { IPC } from '../../shared/ipcChannels'
import { isCodexAuthErrorOutput } from '../utils/auth'
import { decodeProcessOutput, getCliCommand, getEnhancedPath } from '../utils/cli'
import { safeSend, spawnCommand, writeTerminalError, writeTerminalLog } from '../utils/spawn'

export function registerPromptHandlers(win: BrowserWindow): void {
  ipcMain.on(IPC.RUN_PROMPT, (_event, { model, prompt }: { model: string; prompt: string }) => {
    writeTerminalLog(`[run-prompt] prompt execution started: model=${model}`)

    const cmd = model === 'gpt' ? getCliCommand('codex') : getCliCommand('claude')
    const args =
      model === 'gpt'
        ? ['exec', '--skip-git-repo-check', '--color', 'never', prompt]
        : ['-p', prompt, '--output-format', 'text']

    const child = spawnCommand(cmd, args, {
      env: { ...process.env, PATH: getEnhancedPath() },
      stdio: ['ignore', 'pipe', 'pipe']
    })

    const stderrChunks: Buffer[] = []

    child.stdout.on('data', (data: Buffer) => {
      safeSend(win, IPC.PROMPT_RESPONSE_CHUNK, data.toString())
    })

    child.stderr.on('data', (data: Buffer) => {
      stderrChunks.push(Buffer.from(data))
      const text = decodeProcessOutput(Buffer.from(data))
      if (text.toLowerCase().includes('error')) {
        safeSend(win, IPC.PROMPT_RESPONSE_CHUNK, text)
      }
    })

    child.on('close', (code) => {
      if (code === 0) {
        writeTerminalLog(`[run-prompt] prompt execution completed: model=${model}`)
        safeSend(win, IPC.PROMPT_RESPONSE_DONE, { success: true })
        return
      }

      const stderrText = decodeProcessOutput(Buffer.concat(stderrChunks))
      const authRequired = model === 'gpt' && isCodexAuthErrorOutput(stderrText)

      writeTerminalError(
        `[run-prompt] prompt execution failed: model=${model} (exit code: ${code})`
      )
      safeSend(win, IPC.PROMPT_RESPONSE_DONE, {
        success: false,
        error: authRequired
          ? 'Codex 인증이 만료되었거나 유효하지 않습니다. 다시 인증해 주세요.'
          : `CLI 실행 실패 (exit code: ${code})`,
        authRequired
      })
    })

    child.on('error', (err) => {
      safeSend(win, IPC.PROMPT_RESPONSE_DONE, {
        success: false,
        error: `CLI 실행 오류: ${err.message}`
      })
    })
  })
}
