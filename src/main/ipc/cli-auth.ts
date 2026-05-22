/**
 * src/main/ipc/cli-auth.ts — CLI 로그인 IPC 핸들러
 *
 * 담당 채널:
 *   - run-claude-login : Claude CLI 로그인 실행 (단방향)
 *   - run-gpt-login    : Codex CLI 로그인 실행 (단방향)
 *
 * 두 채널 모두 내부적으로 runCliLogin() 헬퍼를 공유한다.
 */

import { ipcMain, type BrowserWindow } from 'electron'
import { spawnCommand } from '../utils/spawn'
import { resolveCliCommand, streamLines } from '../utils/cli'

// ── 로그인 공통 헬퍼 ──────────────────────────────────────────────

/**
 * Claude 또는 Codex CLI의 로그인 명령을 실행한다.
 *
 * 실행 흐름:
 *   1. resolveCliCommand로 CLI 경로 확인
 *   2. CLI 미설치 시 에러 이벤트 전송 후 종료
 *   3. 시스템 PATH 폴백 사용 시 안내 메시지 전송
 *   4. CLI 실행 → stdout/stderr를 'cli-login-progress' 채널로 실시간 스트리밍
 *   5. 프로세스 종료 시 성공/실패 결과를 'cli-login-complete' 채널로 전송
 *
 * @param win  - IPC 이벤트를 push할 BrowserWindow 인스턴스
 * @param name - 'claude' | 'codex'
 * @param args - CLI에 전달할 추가 인수 (예: ['login'])
 */
function runCliLogin(win: BrowserWindow, name: 'claude' | 'codex', args: string[] = []): void {
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

  streamLines(win, child, 'cli-login-progress', 'stdout')
  streamLines(win, child, 'cli-login-progress', 'stderr')

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

// ── 핸들러 등록 ───────────────────────────────────────────────────

/**
 * CLI 로그인 IPC 핸들러를 등록한다.
 *
 * @param win - IPC 이벤트를 push할 BrowserWindow 인스턴스
 */
export function registerCliAuthHandlers(win: BrowserWindow): void {

  // ── [on] Claude CLI 로그인 ────────────────────────────────────
  /**
   * IPC 채널: 'run-claude-login'
   * 방향: renderer → main (on = 단방향)
   * 용도: Claude 인증 화면에서 로그인 버튼 클릭 시 'claude login' 실행
   *
   * 진행/완료 이벤트: 'cli-login-progress', 'cli-login-complete' 채널로 전송
   */
  ipcMain.on('run-claude-login', () => {
    console.log('[IPC:on] run-claude-login')
    runCliLogin(win, 'claude', ['login'])
  })

  // ── [on] Codex CLI 로그인 ─────────────────────────────────────
  /**
   * IPC 채널: 'run-gpt-login'
   * 방향: renderer → main (on = 단방향)
   * 용도: GPT 인증 화면에서 로그인 버튼 클릭 시 'codex login' 실행
   *
   * 진행/완료 이벤트: 'cli-login-progress', 'cli-login-complete' 채널로 전송
   */
  ipcMain.on('run-gpt-login', () => {
    console.log('[IPC:on] run-gpt-login')
    runCliLogin(win, 'codex', ['login'])
  })
}
