/**
 * src/main/utils/system-certs.ts — macOS 시스템 인증서 내보내기
 *
 * macOS 키체인에 등록된 CA 인증서를 PEM 파일로 내보내어
 * NODE_EXTRA_CA_CERTS 환경변수로 child process에 전달한다.
 *
 * 문제 배경:
 *   Node.js의 fetch(undici)는 자체 CA 번들만 사용하므로,
 *   프록시/보안 소프트웨어가 삽입한 인증서를 신뢰하지 않는다.
 *   Finder에서 실행하면 셸 환경을 상속받지 않아 문제가 발생한다.
 */

import { execSync } from 'child_process'
import { writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { app } from 'electron'

let cachedCertPath: string | null = null

/**
 * macOS 시스템 키체인의 CA 인증서를 PEM 파일로 내보내고 경로를 반환한다.
 * 이미 내보낸 파일이 있으면 캐시된 경로를 재사용한다.
 * macOS가 아니거나 실패하면 null을 반환한다.
 */
export function exportSystemCerts(): string | null {
  if (cachedCertPath) return cachedCertPath
  if (process.platform !== 'darwin') return null

  try {
    const certDir = join(app.getPath('userData'), 'certs')
    const certPath = join(certDir, 'system-ca.pem')

    if (!existsSync(certDir)) {
      mkdirSync(certDir, { recursive: true })
    }

    // macOS 시스템 키체인 + 시스템 루트 키체인에서 신뢰된 CA 인증서를 PEM으로 추출
    const pem = execSync(
      'security find-certificate -a -p /Library/Keychains/System.keychain /System/Library/Keychains/SystemRootCertificates.keychain',
      { encoding: 'utf8', timeout: 10_000 }
    )

    if (pem && pem.includes('BEGIN CERTIFICATE')) {
      writeFileSync(certPath, pem, 'utf8')
      cachedCertPath = certPath
      return certPath
    }
  } catch {
    // 인증서 추출 실패 시 기본 동작 유지
  }

  return null
}

/**
 * process.env에 NODE_EXTRA_CA_CERTS를 설정한다.
 * child process가 process.env를 상속하므로 한 번만 호출하면 된다.
 */
export function applySystemCerts(): void {
  if (process.env.NODE_EXTRA_CA_CERTS) return
  const certPath = exportSystemCerts()
  if (certPath) {
    process.env.NODE_EXTRA_CA_CERTS = certPath
  }
}
