/**
 * src/main/ipc/cli-install.ts — CLI 설치 및 상태 확인 IPC 핸들러
 *
 * 담당 채널:
 *   - start-cli-install  : CLI npm 패키지 설치 (단방향)
 *   - check-cli-status   : CLI 설치 여부 + 인증 상태 조회 (양방향)
 */

import { ipcMain, type BrowserWindow } from 'electron'
import { join } from 'path'
import { homedir } from 'os'
import { mkdirSync, existsSync, readFileSync } from 'fs'
import { IPC } from '../../shared/ipcChannels'
import { CLI_PREFIX } from '../constants'
import { spawnCommand, safeSend } from '../utils/spawn'
import { getEnhancedPath } from '../utils/cli'
import { resolveCliCommand, streamLines } from '../utils/cli'

/**
 * 모델명 → npm 패키지명 매핑
 * 새 모델을 추가할 때 이 객체에만 추가하면 된다.
 */
const CLI_PACKAGES: Record<string, string> = {
  gpt: '@openai/codex',
  claude: '@anthropic-ai/claude-code'
}

/**
 * CLI 설치 및 상태 확인 IPC 핸들러를 등록한다.
 *
 * @param win - IPC 이벤트를 push할 BrowserWindow 인스턴스
 */
export function registerCliInstallHandlers(win: BrowserWindow): void {
  /**
   * CLI 설치
   * 
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
  ipcMain.on(IPC.START_CLI_INSTALL, (_event, model: string) => {
    console.log(`[start-cli-install] "${model}" 모델 설치 시작`)
    const pkg = CLI_PACKAGES[model]
    if (!pkg) {
      safeSend(win,IPC.INSTALL_COMPLETE, {
        success: false,
        error: `알 수 없는 모델: ${model}`
      })
      return
    }

    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm'
    // -g 대신 --prefix로 사용자 홈 하위 경로에 설치 → EACCES(exit 243) 방지
    mkdirSync(CLI_PREFIX, { recursive: true })
    // 실행 명령: npm install --prefix ~/.ai-cli-launcher @anthropic-ai/claude-code
    //          npm install --prefix ~/.ai-cli-launcher @openai/codex
    const child = spawnCommand(npmCmd, ['install', '--prefix', CLI_PREFIX, pkg], {
      env: { ...process.env, PATH: getEnhancedPath() },
      stdio: ['ignore', 'pipe', 'pipe']
    })

    const stderrChunks: string[] = []

    streamLines(win, child, IPC.INSTALL_PROGRESS, 'stdout')
    streamLines(win, child, IPC.INSTALL_PROGRESS, 'stderr')

    child.stderr?.on('data', (chunk: Buffer) => {
      stderrChunks.push(chunk.toString())
    })

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`[start-cli-install] "${model}" 모델 설치 완료`)
        safeSend(win,IPC.INSTALL_COMPLETE, { success: true })
      } else {
        const stderrText = stderrChunks.join('').trim()
        const lastLines = stderrText.split('\n').filter(Boolean).slice(-5).join('\n')
        const detail = lastLines
          ? `설치 중 오류가 발생했습니다. (exit code: ${code})\n${lastLines}`
          : `설치 중 오류가 발생했습니다. (exit code: ${code})`
        console.error(`[start-cli-install] "${model}" 모델 설치 실패 (exit code: ${code})`)
        if (stderrText) console.error(`[start-cli-install] stderr:\n${stderrText}`)
        safeSend(win,IPC.INSTALL_COMPLETE, {
          success: false,
          error: detail
        })
      }
    })

    child.on('error', (err) => {
      safeSend(win,IPC.INSTALL_COMPLETE, {
        success: false,
        error: `npm 실행 실패: ${err.message}`
      })
    })
  })

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
  ipcMain.handle(IPC.CHECK_CLI_STATUS, (_event, model: string) => {
    console.log(`[check-cli-status] CLI 상태 확인: 모델=${model}`)
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
}
