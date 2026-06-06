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
import { existsSync, readdirSync } from 'fs'
import { execSync, spawn, spawnSync } from 'child_process'
import { homedir } from 'os'
import type { BrowserWindow } from 'electron'
import { safeSend, writeTerminalLog, writeTerminalWarn } from './spawn'
import { CLI_BIN } from '../constants'

/**
 * 패키징된 Electron 앱에서 사용할 보강된 PATH를 반환한다.
 *
 * 문제 배경:
 *   macOS에서 .app 번들로 실행하면 쉘 프로필(.zshrc 등)이 로드되지 않아
 *   PATH가 /usr/bin:/bin:/usr/sbin:/sbin 정도로 매우 제한적이다.
 *   npm으로 설치한 CLI(codex, claude 등)를 찾으려면 추가 경로가 필요하다.
 *
 * 해결 방법:
 *   1. 사용자의 기본 쉘에서 실제 PATH를 가져온다 (가장 정확)
 *   2. 실패 시 일반적인 경로를 수동으로 추가한다
 */
let _cachedEnhancedPath: string | null = null

export function getEnhancedPath(): string {
  if (_cachedEnhancedPath) return _cachedEnhancedPath

  const currentPath = process.env['PATH'] ?? ''

  // 사용자 쉘에서 실제 PATH 가져오기 시도
  try {
    const shell = process.env['SHELL'] ?? '/bin/zsh'
    const shellPath = execSync(`${shell} -ilc 'echo $PATH'`, {
      encoding: 'utf-8',
      timeout: 5000
    }).trim()
    if (shellPath) {
      writeTerminalLog('[getEnhancedPath] 쉘에서 PATH 획득 성공')
      _cachedEnhancedPath = shellPath
      return _cachedEnhancedPath
    }
  } catch (err) {
    writeTerminalWarn('[getEnhancedPath] 쉘 PATH 획득 실패, 폴백 사용:', (err as Error).message)
  }

  // 폴백: 일반적인 npm/node 설치 경로를 수동으로 추가
  const home = homedir()
  const extraPaths = [
    join(home, '.npm-global', 'bin'),
    ...findNvmBinPaths(home),
    '/usr/local/bin',
    '/opt/homebrew/bin',                       // Apple Silicon Homebrew
    '/opt/homebrew/sbin',
    join(home, '.local', 'bin'),
    join(home, 'bin')
  ].filter(existsSync)

  _cachedEnhancedPath = [...new Set([...currentPath.split(':'), ...extraPaths])].join(':')
  writeTerminalLog('[getEnhancedPath] 폴백 PATH 구성:', _cachedEnhancedPath)
  return _cachedEnhancedPath
}

/**
 * nvm이 설치한 Node.js 버전들의 실제 bin 디렉토리 목록을 반환한다.
 *
 * 기존 코드는 ~/.nvm/versions/node 디렉토리 자체만 추가해서
 * 실제 실행 파일(npm, node 등)이 있는 bin/ 경로가 PATH에 포함되지 않았다.
 * 이 함수는 설치된 모든 버전의 bin/ 경로를 반환한다.
 */
function findNvmBinPaths(home: string): string[] {
  const nvmNodeDir = join(home, '.nvm', 'versions', 'node')
  if (!existsSync(nvmNodeDir)) return []

  try {
    const versions: string[] = readdirSync(nvmNodeDir)
    // 가장 최신 버전이 먼저 오도록 역순 정렬
    return versions
      .sort()
      .reverse()
      .map((v: string) => join(nvmNodeDir, v, 'bin'))
      .filter(existsSync)
  } catch {
    return []
  }
}

/**
 * 앱 전용 설치 경로에서 CLI 실행 파일 경로를 반환한다.
 *
 * Windows는 npm이 .cmd 파일로 래퍼를 생성하므로 확장자를 붙인다.
 * 예) macOS: ~/.ai-cli-launcher/node_modules/.bin/claude
 *     Windows: ~/.ai-cli-launcher/node_modules/.bin/claude.cmd
 */
export function getCliCommand(name: 'claude' | 'codex'): string {
  writeTerminalLog(`CLI 경로 조회: ${name}`)
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
  writeTerminalLog(`CLI 탐색 시작: ${name}`)
  const localCommand = getCliCommand(name)
  if (existsSync(localCommand)) {
    return { command: localCommand, source: 'local' }
  }

  // 시스템 PATH에서 탐색 (폴백)
  const fallbackCommand = process.platform === 'win32' ? `${name}.cmd` : name
  const resolver = process.platform === 'win32' ? 'where' : 'which'
  const result = spawnSync(resolver, [fallbackCommand], {
    env: { ...process.env, PATH: getEnhancedPath() },
    stdio: 'ignore'
  })

  if (result.status === 0) {
    writeTerminalLog(`CLI 탐색 완료: ${name} → 시스템 PATH 사용 (${fallbackCommand})`)
    return { command: fallbackCommand, source: 'path' }
  }

  writeTerminalLog(`CLI 탐색 완료: ${name} → 설치되지 않음`)
  return { command: null, source: 'missing' }
}

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
  channel: string,
  source: 'stdout' | 'stderr'
): void {
  const stream = child[source]
  if (!stream) return

  stream.on('data', (data: Buffer) => {
    const lines = data.toString().split('\n')
    for (const line of lines) {
      if (line.trim()) {
        safeSend(win, channel, line)
      }
    }
  })
}
