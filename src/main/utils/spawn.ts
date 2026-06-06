/**
 * src/main/utils/spawn.ts — child_process 실행 유틸리티
 *
 * Electron/IPC와 무관한 순수 플랫폼 유틸 함수 모음.
 * Windows와 macOS/Linux의 차이를 이 파일에서 흡수해 호출부가 플랫폼을 신경 쓰지 않아도 된다.
 */

import { spawn, type ChildProcessByStdio, type SpawnOptions } from 'child_process'
import { type BrowserWindow } from 'electron'
import { inspect } from 'util'
import iconv from 'iconv-lite'

/** spawn 옵션 중 stdio가 ['ignore', 'pipe', 'pipe']로 고정된 타입 */
export type PipedSpawnOptions = SpawnOptions & { stdio: ['ignore', 'pipe', 'pipe'] }

/** stdout/stderr가 Readable 스트림인 child_process 타입 */
export type PipedChildProcess = ChildProcessByStdio<null, import('stream').Readable, import('stream').Readable>

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
export function spawnCommand(
  command: string,
  args: string[],
  options: PipedSpawnOptions
): PipedChildProcess {
  writeTerminalLog(`프로세스 실행: ${command} ${JSON.stringify(args)}`)
  if (process.platform === 'win32' && /\.(cmd|bat)$/i.test(command)) {
    return spawn(process.env['ComSpec'] ?? 'cmd.exe', ['/d', '/s', '/c', command, ...args], options)
  }
  return spawn(command, args, options)
}

/**
 * BrowserWindow가 살아있을 때만 IPC 이벤트를 전송하는 안전 래퍼.
 *
 * 분석 중 창이 닫히거나 destroy된 경우 win.webContents.send()를 호출하면
 * "Object has been destroyed" TypeError가 발생한다.
 * 이 함수는 전송 전에 win과 webContents의 상태를 확인해 해당 오류를 방지한다.
 */
export function safeSend(win: BrowserWindow, channel: string, ...args: unknown[]): void {
  if (!win.isDestroyed() && !win.webContents.isDestroyed()) {
    win.webContents.send(channel, ...args)
  }
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
export function writeTerminalLine(message: string, isError = false): void {
  if (process.platform === 'win32') {
    const stream = isError ? process.stderr : process.stdout
    if (process.env['AI_CLI_LAUNCHER_UTF8_CONSOLE'] === '1') {
      stream.write(`${message}\n`)
      return
    }
    stream.write(iconv.encode(`${message}\n`, 'cp949'))
    return
  }

  if (isError) {
    console.error(message)
    return
  }

  console.log(message)
}

function formatTerminalPart(part: unknown): string {
  if (typeof part === 'string') return part
  if (part instanceof Error) return part.stack ?? part.message
  return inspect(part, { depth: 3, colors: false, breakLength: 120 })
}

function formatTerminalMessage(parts: unknown[]): string {
  return parts.map(formatTerminalPart).join(' ')
}

export function writeTerminalLog(...parts: unknown[]): void {
  writeTerminalLine(formatTerminalMessage(parts))
}

export function writeTerminalWarn(...parts: unknown[]): void {
  writeTerminalLine(formatTerminalMessage(parts), true)
}

export function writeTerminalError(...parts: unknown[]): void {
  writeTerminalLine(formatTerminalMessage(parts), true)
}
