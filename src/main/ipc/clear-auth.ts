/**
 * clear-auth.ts — CLI 인증 정보 삭제
 *
 * 담당 IPC 채널:
 *   renderer → main : clear-auth (저장된 인증 파일 삭제)
 *
 * 모델별 삭제 대상:
 *   - claude : ~/.claude/.credentials.json
 *   - gpt    : ~/.codex/auth.json
 */

import { existsSync, unlinkSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'
import { ipcMain } from 'electron'
import { IPC } from '../../shared/ipcChannels'
import { writeTerminalError, writeTerminalLog } from '../utils/spawn'

/**
 * 인증 정보 삭제 IPC 핸들러를 등록한다.
 * model 파라미터에 따라 해당 CLI의 인증 파일을 삭제하고 결과를 반환한다.
 */
export function registerClearAuthHandlers(): void {
  ipcMain.handle(IPC.CLEAR_AUTH, (_event, model: string) => {
    writeTerminalLog(`[clear-auth] clearing auth for model=${model}`)

    // 모델에 대응하는 인증 파일 경로 결정
    const AUTH_PATHS: Record<string, string> = {
      claude: join(homedir(), '.claude', '.credentials.json'),
      gpt: join(homedir(), '.codex', 'auth.json'),
    }

    const target = AUTH_PATHS[model]
    if (!target) {
      return { success: false, error: `[clear-auth] 알 수 없는 경우: ${target}` }
    }

    const targets = [target]

    // 각 파일을 순회하며 삭제 시도, 실패 시 에러 수집
    const errors: string[] = []
    for (const filePath of targets) {
      try {
        if (existsSync(filePath)) {
          unlinkSync(filePath)
          writeTerminalLog(`[clear-auth] deleted ${filePath}`)
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        writeTerminalError(`[clear-auth] failed to delete ${filePath}: ${msg}`)
        errors.push(msg)
      }
    }

    if (errors.length > 0) {
      return { success: false, error: errors.join('; ') }
    }
    return { success: true }
  })
}
