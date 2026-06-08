/**
 * src/main/ipc/node-install.ts — Node.js 설치 확인 및 자동 설치
 *
 * 담당 IPC 채널:
 *   renderer → main : check-node-status (Node.js 설치 여부 확인)
 *   renderer → main : install-node (Node.js 인스톨러 다운로드 및 실행)
 *   main → renderer : node-install-progress (설치 진행 로그)
 *   main → renderer : node-install-complete (설치 완료/실패)
 */
import { createWriteStream, existsSync, unlinkSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { spawn, spawnSync } from 'child_process'
import { ipcMain, type BrowserWindow } from 'electron'
import { IPC } from '../../shared/ipcChannels'
import { clearPathCache, getEnhancedPath } from '../utils/cli'
import { safeSend, writeTerminalLog, writeTerminalError } from '../utils/spawn'
import { net } from 'electron'

/** Node.js 설치 여부를 확인한다 */
function checkNodeInstalled(): { installed: boolean; version: string | null } {
  const nodeCmd = process.platform === 'win32' ? 'node.exe' : 'node'
  const result = spawnSync(nodeCmd, ['--version'], {
    env: { ...process.env, PATH: getEnhancedPath() },
    encoding: 'utf-8',
    timeout: 5000,
    stdio: ['ignore', 'pipe', 'pipe']
  })

  if (result.status === 0 && result.stdout) {
    const version = result.stdout.trim()
    writeTerminalLog(`[check-node-status] Node.js 발견: ${version}`)
    return { installed: true, version }
  }

  writeTerminalLog('[check-node-status] Node.js 미설치')
  return { installed: false, version: null }
}

/** npm 설치 여부를 확인한다 */
function checkNpmInstalled(): { installed: boolean; version: string | null } {
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm'
  const result = spawnSync(npmCmd, ['--version'], {
    env: { ...process.env, PATH: getEnhancedPath() },
    encoding: 'utf-8',
    timeout: 5000,
    stdio: ['ignore', 'pipe', 'pipe']
  })

  if (result.status === 0 && result.stdout) {
    return { installed: true, version: result.stdout.trim() }
  }

  return { installed: false, version: null }
}

/** nodejs.org API에서 최신 LTS 버전 정보를 가져온다 */
async function fetchLatestLtsVersion(): Promise<{
  version: string
  lts: string
} | null> {
  return new Promise((resolve) => {
    const request = net.request('https://nodejs.org/dist/index.json')

    let body = ''
    request.on('response', (response) => {
      response.on('data', (chunk) => {
        body += chunk.toString()
      })
      response.on('end', () => {
        try {
          const releases = JSON.parse(body) as Array<{
            version: string
            lts: string | false
          }>
          const lts = releases.find((r) => r.lts !== false)
          if (lts) {
            resolve({ version: lts.version, lts: lts.lts as string })
          } else {
            resolve(null)
          }
        } catch {
          resolve(null)
        }
      })
    })
    request.on('error', () => resolve(null))
    request.end()
  })
}

/** 플랫폼에 맞는 Node.js 인스톨러 URL을 반환한다 */
function getInstallerUrl(version: string): { url: string; filename: string } | null {
  const platform = process.platform
  const arch = process.arch

  if (platform === 'win32') {
    const msiArch = arch === 'arm64' ? 'arm64' : arch === 'ia32' ? 'x86' : 'x64'
    const filename = `node-${version}-${msiArch}.msi`
    return {
      url: `https://nodejs.org/dist/${version}/${filename}`,
      filename
    }
  }

  if (platform === 'darwin') {
    const filename = `node-${version}.pkg`
    return {
      url: `https://nodejs.org/dist/${version}/${filename}`,
      filename
    }
  }

  return null
}

/** 파일을 다운로드한다 (Electron net 모듈 사용) */
function downloadFile(
  win: BrowserWindow,
  url: string,
  destPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = net.request({ url, redirect: 'follow' })

    request.on('response', (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`다운로드 실패 (HTTP ${response.statusCode})`))
        return
      }

      const contentLengthHeader = response.headers['content-length']
      const totalSize = contentLengthHeader
        ? parseInt(Array.isArray(contentLengthHeader) ? contentLengthHeader[0] : contentLengthHeader, 10)
        : 0
      let downloadedSize = 0
      let lastReportedPercent = -1

      const fileStream = createWriteStream(destPath)

      response.on('data', (chunk) => {
        fileStream.write(chunk)
        downloadedSize += chunk.length
        if (totalSize > 0) {
          const percent = Math.round((downloadedSize / totalSize) * 100)
          // 같은 퍼센트를 반복 전송하지 않도록 필터링
          if (percent !== lastReportedPercent) {
            lastReportedPercent = percent
            safeSend(win, IPC.NODE_INSTALL_PROGRESS, `다운로드 중... ${percent}%`)
          }
        }
      })

      response.on('end', () => {
        fileStream.end(() => resolve())
      })

      response.on('error', (err) => {
        fileStream.close()
        reject(err)
      })
    })

    request.on('error', (err) => reject(err))
    request.end()
  })
}

/** 인스톨러를 실행한다 */
function runInstaller(
  win: BrowserWindow,
  installerPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (process.platform === 'win32') {
      // Windows: msiexec로 MSI 실행 (사용자에게 UAC 프롬프트 표시)
      // detached 없이 실행해야 msiexec가 설치 완료까지 대기한다.
      safeSend(win, IPC.NODE_INSTALL_PROGRESS, 'Node.js 설치 프로그램을 실행합니다...')
      const child = spawn('msiexec', ['/i', installerPath], {
        stdio: 'ignore'
      })

      child.on('error', (err) => {
        reject(new Error(`인스톨러 실행 실패: ${err.message}`))
      })

      child.on('close', (code) => {
        if (code === 0) {
          resolve()
        } else if (code === 1602) {
          // 1602 = 사용자가 설치를 취소함
          reject(new Error('설치가 취소되었습니다.'))
        } else {
          reject(new Error(`인스톨러가 종료되었습니다 (exit code: ${code})`))
        }
      })
    } else if (process.platform === 'darwin') {
      // macOS: open -W로 PKG 실행. Installer.app이 닫힐 때까지 대기한다.
      // -W 플래그는 열린 앱이 종료될 때까지 open 프로세스가 대기하게 한다.
      safeSend(win, IPC.NODE_INSTALL_PROGRESS, 'Node.js 설치 프로그램을 실행합니다. 설치 창의 안내를 따라 주세요.')
      const child = spawn('open', ['-W', installerPath], {
        stdio: 'ignore'
      })

      child.on('error', (err) => {
        reject(new Error(`인스톨러 실행 실패: ${err.message}`))
      })

      child.on('close', (code) => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`인스톨러가 종료되었습니다 (exit code: ${code})`))
        }
      })
    } else {
      reject(new Error('지원하지 않는 플랫폼입니다.'))
    }
  })
}

export function registerNodeInstallHandlers(win: BrowserWindow): void {
  /** Node.js + npm 설치 상태를 확인한다 */
  ipcMain.handle(IPC.CHECK_NODE_STATUS, () => {
    // 매번 PATH 캐시를 초기화해 새로 설치된 Node.js를 감지한다.
    // 이 핸들러는 설치 흐름에서만 호출되므로 성능 부담은 없다.
    clearPathCache()

    const node = checkNodeInstalled()
    const npm = checkNpmInstalled()
    return {
      nodeInstalled: node.installed,
      nodeVersion: node.version,
      npmInstalled: npm.installed,
      npmVersion: npm.version
    }
  })

  /** Node.js를 다운로드하고 인스톨러를 실행한다 */
  ipcMain.on(IPC.INSTALL_NODE, async () => {
    try {
      // 1. 최신 LTS 버전 조회
      safeSend(win, IPC.NODE_INSTALL_PROGRESS, '최신 LTS 버전을 확인하고 있습니다...')
      const lts = await fetchLatestLtsVersion()
      if (!lts) {
        safeSend(win, IPC.NODE_INSTALL_COMPLETE, {
          success: false,
          error: 'Node.js 버전 정보를 가져올 수 없습니다. 인터넷 연결을 확인하세요.'
        })
        return
      }
      writeTerminalLog(`[install-node] 최신 LTS: ${lts.version} (${lts.lts})`)
      safeSend(win, IPC.NODE_INSTALL_PROGRESS, `Node.js ${lts.version} (${lts.lts}) LTS를 다운로드합니다...`)

      // 2. 인스톨러 URL 결정
      const installer = getInstallerUrl(lts.version)
      if (!installer) {
        safeSend(win, IPC.NODE_INSTALL_COMPLETE, {
          success: false,
          error: '현재 플랫폼에서 자동 설치를 지원하지 않습니다.'
        })
        return
      }

      // 3. 인스톨러 다운로드
      const destPath = join(tmpdir(), installer.filename)
      writeTerminalLog(`[install-node] 다운로드: ${installer.url} → ${destPath}`)

      try {
        await downloadFile(win, installer.url, destPath)
      } catch (err) {
        safeSend(win, IPC.NODE_INSTALL_COMPLETE, {
          success: false,
          error: `다운로드 실패: ${(err as Error).message}`
        })
        return
      }

      safeSend(win, IPC.NODE_INSTALL_PROGRESS, '다운로드 완료. 설치 프로그램을 실행합니다...')

      // 4. 인스톨러 실행
      try {
        await runInstaller(win, destPath)
      } catch (err) {
        safeSend(win, IPC.NODE_INSTALL_COMPLETE, {
          success: false,
          error: `설치 실패: ${(err as Error).message}`
        })
        return
      }

      // 5. 임시 파일 정리
      try {
        if (existsSync(destPath)) unlinkSync(destPath)
      } catch {
        // 정리 실패는 무시
      }

      // 6. PATH 캐시 초기화 후 설치 확인
      clearPathCache()
      safeSend(win, IPC.NODE_INSTALL_PROGRESS, '설치 확인 중...')

      safeSend(win, IPC.NODE_INSTALL_COMPLETE, { success: true })
      writeTerminalLog('[install-node] Node.js 설치 완료')
    } catch (err) {
      writeTerminalError(`[install-node] 예기치 않은 오류: ${(err as Error).message}`)
      safeSend(win, IPC.NODE_INSTALL_COMPLETE, {
        success: false,
        error: `예기치 않은 오류: ${(err as Error).message}`
      })
    }
  })
}
