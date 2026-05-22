/**
 * src/main/utils/cli.ts — CLI 경로 탐색 및 스트림 유틸리티
 *
 * CLI 실행 파일을 찾는 로직과 stdout/stderr 스트림을 IPC 채널로 중계하는
 * 공통 유틸 함수를 제공한다.
 *
 * 의존:
 *   - constants.ts (CLI_BIN)
 *   - utils/spawn.ts (spawnCommand 타입)
 */

import { join } from 'path'
import { existsSync } from 'fs'
import { spawn, spawnSync } from 'child_process'
import type { BrowserWindow } from 'electron'
import { CLI_BIN } from '../constants'

// ── CLI 경로 탐색 ─────────────────────────────────────────────────

/**
 * 앱 전용 설치 경로에서 CLI 실행 파일 경로를 반환한다.
 *
 * Windows는 npm이 .cmd 파일로 래퍼를 생성하므로 확장자를 붙인다.
 * 예) macOS: ~/.ai-cli-launcher/node_modules/.bin/claude
 *     Windows: ~/.ai-cli-launcher/node_modules/.bin/claude.cmd
 */
export function getCliCommand(name: 'claude' | 'codex'): string {
  console.log(`CLI 경로 조회: ${name}`)
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
export function resolveCliCommand(name: 'claude' | 'codex'): {
  command: string | null
  source: 'local' | 'path' | 'missing'
} {
  console.log(`CLI 탐색 시작: ${name}`)
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
    console.log(`CLI 탐색 완료: ${name} → 시스템 PATH 사용 (${fallbackCommand})`)
    return { command: fallbackCommand, source: 'path' }
  }

  console.log(`CLI 탐색 완료: ${name} → 설치되지 않음`)
  return { command: null, source: 'missing' }
}

// ── 스트림 중계 ───────────────────────────────────────────────────

/**
 * child_process의 stdout 또는 stderr를 줄 단위로 읽어 IPC 채널로 전송한다.
 *
 * 설치 진행 로그나 로그인 진행 메시지처럼 실시간으로 renderer에 스트리밍할 때 사용한다.
 * 빈 줄은 전송하지 않아 UI 노이즈를 줄인다.
 *
 * win을 인자로 받는 이유:
 *   IPC push(win.webContents.send)는 BrowserWindow 참조가 필요하므로
 *   호출부에서 주입받는 방식을 사용한다.
 *
 * @param win     - 이벤트를 전송할 BrowserWindow
 * @param child   - 실행 중인 child_process
 * @param channel - renderer로 보낼 IPC 채널명
 * @param source  - 읽을 스트림 ('stdout' | 'stderr')
 */
export function streamLines(
  win: BrowserWindow,
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
