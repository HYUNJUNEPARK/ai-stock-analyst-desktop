/**
 * lib/utils.mjs — 범용 유틸리티 모듈
 *
 * analyze-stock.mjs에서 사용하는 범용 헬퍼 함수를 모아놓은 모듈이다.
 * CLI 인자 파싱, 텍스트 추출, 날짜 포맷, 파일 경로 처리 등을 담당한다.
 */

import { existsSync } from 'node:fs'
import { readdir, rm, rmdir } from 'node:fs/promises'
import path from 'node:path'

// =====================================================================
//  CLI 인자 파싱
// =====================================================================

/**
 * process.argv를 파싱하여 옵션 객체를 반환한다.
 *
 * 사용 예:
 *   node analyze-stock.mjs --request "삼성전자 분석해줘" --market "[한국주식]"
 *   node analyze-stock.mjs "삼성전자 분석해줘"  (--request 없이 첫 번째 인자를 request로 사용)
 *
 * @param {string[]} argv - process.argv.slice(2)
 * @returns {{ company, ticker, request, market, model, dryRun, validateOnly, help }}
 */
export function parseArgs(argv) {
  const options = {
    company: '',
    ticker: '',
    request: '',
    market: '',
    model: '',
    dryRun: false,
    validateOnly: false,
    help: false
  }

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--company') { options.company = argv[++i] ?? ''; continue }
    if (arg === '--ticker') { options.ticker = argv[++i] ?? ''; continue }
    if (arg === '--request') { options.request = argv[++i] ?? ''; continue }
    if (arg === '--market') { options.market = argv[++i] ?? ''; continue }
    if (arg === '--model') { options.model = argv[++i] ?? ''; continue }
    if (arg === '--dry-run') { options.dryRun = true; continue }
    if (arg === '--validate-only') { options.validateOnly = true; continue }
    if (arg === '--help' || arg === '-h') { options.help = true; continue }
    // --가 아닌 첫 번째 인자를 request로 사용
    if (!arg.startsWith('--') && !options.request) {
      options.request = arg
    }
  }

  return options
}

/** 도움말 출력 */
export function printHelp() {
  console.log(`
사용법:
  node scripts/analyze-stock.mjs --company "삼성전자" --ticker "005930" --request "삼성전자 투자할 만해?"
  node scripts/analyze-stock.mjs "하이브 352820 종합 분석"

옵션:
  --company     회사명
  --ticker      종목 코드
  --request     사용자 요청 원문
  --model       Codex 모델명
  --dry-run     실제 Codex 실행 없이 파라미터만 확인
  --validate-only 입력 종목 검증만 실행
  --help, -h    도움말 출력
`)
}

// =====================================================================
//  텍스트 추출
// =====================================================================

/**
 * 텍스트에서 종목코드 또는 티커를 추출한다.
 *
 * 우선순위:
 *   1. 한국 종목코드 (6자리 숫자, 예: 005930)
 *   2. 미국 티커 (2~5자리 대문자, 예: AAPL)
 *
 * @returns {string|null}
 */
export function extractTicker(text) {
  const krMatch = text.match(/\b\d{6}\b/)
  if (krMatch) return krMatch[0]
  const usMatch = text.match(/\b[A-Z]{2,5}\b/)
  return usMatch?.[0] ?? null
}

/**
 * 텍스트에서 회사명을 추출한다.
 *
 * "삼성전자 분석해줘"에서 "분석해줘" 같은 액션 표현을 제거하고
 * 순수 회사명만 남긴다. 종목코드와 미국 티커도 제거한다.
 *
 * @returns {string|null}
 */
export function extractCompany(text) {
  const cleaned = text
    .replace(/\b\d{6}\.K[SQ]\b/g, ' ')
    .replace(/\b\d{6}\b/g, ' ')
    .replace(/\b[A-Z]{2,5}\b/g, ' ')
    .replace(
      /(분석해\s*줘|분석\s*부탁해|분석\s*해줘요?|분석\s*해주세요|종합\s*분석|주가\s*분석|재무\s*분석)/gi,
      ' '
    )
    .replace(
      /(투자할\s*만해\??|투자해도\s*될까\??|투자해도\s*돼\??|투자\s*의견|투자\s*추천|투자\s*해줘)/gi,
      ' '
    )
    .replace(
      /(살\s*만해\??|살\s*만해요\??|사도\s*될까\??|사도\s*돼\??|지금\s*사도\s*돼\??|지금\s*살까\??)/gi,
      ' '
    )
    .replace(
      /(들어가도\s*될까\??|들어가도\s*돼\??|지금\s*들어가도\s*될까\??|매수\s*해도\s*될까\??|매수\s*타이밍)/gi,
      ' '
    )
    .replace(
      /(전망\s*알려줘|전망은\??|전망\s*어때\??|전망\s*어떻게\s*봐\??|주가\s*전망)/gi,
      ' '
    )
    .replace(
      /(지금\s*어때\??|어때요\??|어떻게\s*생각해\??|의견\s*줘|알려줘|알려주세요)/gi,
      ' '
    )
    .replace(
      /(리포트\s*만들어줘|리포트\s*작성해줘|종합\s*리포트|분석\s*리포트)/gi,
      ' '
    )
    .replace(/(analyze|report|should\s*i\s*buy|buy\s*or\s*sell)/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return cleaned || null
}

// =====================================================================
//  날짜 포맷
// =====================================================================

/** Date → "YYYYMMDD" (파일명/폴더명용) */
export function formatDate(date) {
  const year = String(date.getFullYear())
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}${month}${day}`
}

/** Date → "YYYY-MM-DD" (표시용) */
export function formatDateDisplay(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// =====================================================================
//  파일/경로 유틸리티
// =====================================================================

/**
 * 회사명을 파일 시스템에 안전한 식별자로 변환한다.
 * 예: "삼성전자" → "삼성전자",  "LG에너지솔루션" → "LG에너지솔루션"
 */
export function buildIdentifier(company) {
  const safeCompany = company
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^\p{L}\p{N}_-]/gu, '')
  return safeCompany || 'analysis'
}

/**
 * 같은 이름의 폴더가 이미 있으면 접미사(_1, _2, ...)를 붙여 고유한 경로를 반환한다.
 * 예: reports/20260623/삼성전자 → (이미 있으면) reports/20260623/삼성전자_1
 */
export function resolveUniqueFolderPath(dir, baseName) {
  const candidate = path.join(dir, baseName)
  if (!existsSync(candidate)) return candidate
  let i = 1
  while (existsSync(path.join(dir, `${baseName}_${i}`))) {
    i++
  }
  return path.join(dir, `${baseName}_${i}`)
}

// =====================================================================
//  리포트 파싱
// =====================================================================

const REQUIRED_REPORT_FIELDS = ['company', 'verdict', 'summary', 'analysis', 'strategy']

/**
 * 최종 리포트 JSON 문자열을 파싱하고 필수 필드를 검증한다.
 *
 * Codex 응답에 마크다운 코드 블록(```json)이 포함될 수 있어 이를 제거한 뒤 파싱한다.
 * 필수 필드(company, verdict, summary, analysis, strategy)가 하나라도 누락되면 에러.
 *
 * @throws {Error} JSON 파싱 실패 또는 필수 필드 누락 시
 */
export function parseJsonReport(raw) {
  const stripped = raw.replace(/```(?:json)?\s*/g, '').replace(/```/g, '')
  const match = stripped.match(/\{[\s\S]*\}/)
  let parsed
  try {
    parsed = JSON.parse(match?.[0] ?? stripped)
  } catch (err) {
    console.error(`[parseJsonReport] JSON 파싱 실패. raw=${raw.slice(0, 500)}`)
    console.log('[error] 분석에 실패하였습니다. 분석 결과 형식이 올바르지 않습니다. 잠시 후 다시 시도해 주세요.')
    throw err
  }

  const missing = REQUIRED_REPORT_FIELDS.filter((f) => !(f in parsed))
  if (missing.length > 0) {
    console.error(`[parseJsonReport] 필수 필드 누락: ${missing.join(', ')}`)
    console.log('[error] 분석에 실패하였습니다. 분석 결과가 불완전합니다. 잠시 후 다시 시도해 주세요.')
    throw new Error(`필수 필드 누락: ${missing.join(', ')}`)
  }

  return parsed
}

/** AI 모델 정보 객체를 생성한다. */
export function buildAiInfo(model) {
  return {
    model: model || 'gpt-default',
    engine: 'gpt'
  }
}

// =====================================================================
//  정리 (cleanup)
// =====================================================================

/**
 * 분석 실패 시 생성된 빈 artifact 폴더를 삭제한다.
 *
 * 안전장치:
 *   - reportsDir 하위 경로인지 확인 (경로 탈출 방지)
 *   - 날짜 폴더가 비었으면 함께 삭제
 */
export async function cleanupFailedArtifacts(artifactDir, dateDir, reportsDir) {
  if (!artifactDir) return

  const resolvedArtifactDir = path.resolve(artifactDir)
  if (!isPathInside(reportsDir, resolvedArtifactDir)) {
    console.warn(`[cleanup] skip removing path outside reports: ${resolvedArtifactDir}`)
    return
  }

  try {
    await rm(resolvedArtifactDir, { recursive: true, force: true })
    console.warn(`[cleanup] removed failed analysis artifacts: ${resolvedArtifactDir}`)

    if (dateDir && isPathInside(reportsDir, dateDir)) {
      const entries = await readdir(dateDir)
      if (entries.length === 0) {
        await rmdir(dateDir)
      }
    }
  } catch (error) {
    console.warn(
      `[cleanup] failed to remove analysis artifacts: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

/** 후보 경로가 부모 경로 내부에 있는지 확인한다 (경로 탈출 방지). */
function isPathInside(parent, candidate) {
  const resolvedParent = path.resolve(parent)
  const resolvedCandidate = path.resolve(candidate)
  return resolvedCandidate.startsWith(`${resolvedParent}${path.sep}`)
}
