/**
 * 앱 전용 Codex CLI의 호환성 점검 및 업데이트 유틸리티.
 *
 * Codex 데스크톱 앱과 CLI는 모델 캐시를 공유한다. CLI가 너무 오래되면 최신
 * 캐시 형식을 읽지 못할 수 있으므로, 분석 시작 전에 최소 버전을 보장한다.
 */
import { existsSync, readFileSync } from 'fs'
import { spawnCommand } from './spawn'
import { CLI_PREFIX } from '../constants'
import { getEnhancedPath } from './cli'

const CODEX_PACKAGE = '@openai/codex'
// max/ultra reasoning effort가 포함된 모델 캐시를 읽을 수 있는 첫 버전.
const MINIMUM_CODEX_VERSION = '0.144.4'

function compareVersions(left: string, right: string): number {
  const leftParts = left.split('.').map(Number)
  const rightParts = right.split('.').map(Number)

  for (let index = 0; index < Math.max(leftParts.length, rightParts.length); index += 1) {
    const difference = (leftParts[index] ?? 0) - (rightParts[index] ?? 0)
    if (difference !== 0) return difference
  }
  return 0
}

function getLocalCodexVersion(): string | null {
  const packagePath = `${CLI_PREFIX}/node_modules/@openai/codex/package.json`
  if (!existsSync(packagePath)) return null

  try {
    const packageJson: unknown = JSON.parse(readFileSync(packagePath, 'utf-8'))
    if (typeof packageJson === 'object' && packageJson !== null && 'version' in packageJson) {
      const version = packageJson.version
      return typeof version === 'string' ? version : null
    }
  } catch {
    // 손상된 설치는 아래 업데이트 단계에서 복구한다.
  }
  return null
}

export function isCodexModelsCacheCompatibilityError(value: string): boolean {
  return (
    value.includes('codex_models_manager::cache') && value.includes('failed to load models cache')
  )
}

/** npm을 통해 앱 전용 Codex CLI를 최신 버전으로 교체한다. */
export function updateCodexCli(): Promise<void> {
  return new Promise((resolve, reject) => {
    const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
    const child = spawnCommand(
      npmCommand,
      ['install', '--prefix', CLI_PREFIX, `${CODEX_PACKAGE}@latest`],
      {
        env: { ...process.env, PATH: getEnhancedPath() },
        stdio: ['ignore', 'pipe', 'pipe']
      }
    )
    const stderr: Buffer[] = []

    child.stderr.on('data', (chunk: Buffer) => stderr.push(Buffer.from(chunk)))
    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0) {
        resolve()
        return
      }
      const detail = Buffer.concat(stderr).toString().trim()
      reject(new Error(detail || `Codex CLI 업데이트 실패 (exit code: ${code})`))
    })
  })
}

/** 분석에 필요한 최소 버전을 충족하지 않으면 업데이트하고, 실제 업데이트 여부를 반환한다. */
export async function ensureCodexCliCompatibility(): Promise<boolean> {
  const version = getLocalCodexVersion()
  if (version && compareVersions(version, MINIMUM_CODEX_VERSION) >= 0) return false

  await updateCodexCli()
  return true
}
