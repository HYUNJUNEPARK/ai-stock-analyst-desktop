/**
 * analyze-stock.mjs — 멀티 에이전트 주식 분석 오케스트레이터
 *
 * 9개 AI 에이전트를 병렬·순차 파이프라인으로 실행하여
 * 종합 투자 리포트를 생성하는 메인 스크립트이다.
 *
 * 파이프라인 흐름:
 *   Wave 0 (순차):  input-validator → price-fetcher
 *   Wave 1 (병렬):  financial, sector, news, price (4개 동시)
 *   Wave 1b:        valuation (financial + sector 완료 후)
 *   Wave 2-1:       invest-type-classifier (5개 완료 후)
 *   Wave 2-2:       aggressive-investment-strategist (모든 분석 + 유형 분류 후)
 *
 * 모듈 구조:
 *   analyze-stock.mjs     ← 이 파일. 파이프라인 오케스트레이션만 담당
 *   lib/codex.mjs         ← Codex CLI 실행, 프롬프트 관리
 *   lib/local-symbols.mjs ← 한국 종목 로컬 검증 (공공데이터포털 캐시)
 *   lib/public-data-api.mjs ← 공공데이터포털 API 공통 유틸리티
 *   lib/utils.mjs         ← CLI 인자 파싱, 텍스트 추출, 날짜, 정리
 *
 * 실행 방법:
 *   node scripts/analyze-stock.mjs --request "삼성전자 분석해줘"
 *   node scripts/analyze-stock.mjs --request "삼성전자" --validate-only
 *
 * stdout 규약 (Electron UI가 파싱):
 *   [start] <에이전트명>             → 에이전트 시작 알림
 *   [done] <에이전트명>              → 에이전트 완료 알림
 *   [error] <메시지>                 → 유저 친화적 에러 메시지
 *   최종 리포트 저장 완료: <파일경로> → 분석 완료
 */

/* eslint-disable @typescript-eslint/explicit-function-return-type */

import { mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { config as loadDotenv } from 'dotenv'

import { initCodex, getOutputFileName, runRole, runValidation, runPriceFetcher } from './lib/codex.mjs'
import { fetchKrTechnicalData } from '../../shared/kr-stock-history.mjs'
import {
  parseArgs,
  printHelp,
  extractTicker,
  extractCompany,
  formatDate,
  formatDateDisplay,
  buildIdentifier,
  resolveUniqueFolderPath,
  parseJsonReport,
  buildAiInfo,
  cleanupFailedArtifacts
} from './lib/utils.mjs'

// ── 경로 설정 ────────────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')
const promptsDir = path.join(projectRoot, 'prompts')
const reportsDir = path.join(projectRoot, 'reports')
const codexCommand = process.env.CODEX_BIN || 'codex'

// ── 환경변수 로드 ───────────────────────────────────────────────────
// 이 스크립트는 Electron에서 child_process로 실행되므로
// 부모의 환경변수를 상속받지 못할 수 있다. .env 파일을 직접 탐색하여 로드한다.
loadEnvFiles(projectRoot)

// ── Codex 모듈 초기화 ───────────────────────────────────────────────
initCodex({ projectRoot, promptsDir, codexCommand })

// ── 실패 시 정리할 디렉토리 참조 ────────────────────────────────────
let pendingArtifactDir = ''
let pendingDateDir = ''

// =====================================================================
//  메인 함수 — 파이프라인 오케스트레이션
// =====================================================================

async function main() {
  const options = parseArgs(process.argv.slice(2))

  // Codex CLI 경로가 시스템 PATH에서 발견된 경우 UI에 알림
  if (process.env.CODEX_BIN && process.env.CODEX_BIN !== 'codex') {
    console.log('[bootstrap] codex-fallback:path')
  }

  if (options.help) {
    printHelp()
    return
  }

  if (!options.request) {
    console.error('오류: 분석 요청 문구가 필요합니다.')
    printHelp()
    process.exitCode = 1
    return
  }

  // ── 초기 컨텍스트 설정 ──────────────────────────────────────────
  let ticker = options.ticker || extractTicker(options.request) || 'unknown'
  let company =
    options.company ||
    extractCompany(options.request) ||
    (ticker !== 'unknown' ? ticker : '미지정 종목')
  const asOfDateFile = formatDate(new Date())
  const asOfDate = formatDateDisplay(new Date())
  const identifier = buildIdentifier(company)
  const dateDir = path.join(reportsDir, asOfDateFile)
  const artifactDir = resolveUniqueFolderPath(dateDir, identifier)
  const finalReportPath = path.join(
    artifactDir,
    getOutputFileName('aggressive-investment-strategist')
  )
  const aiInfo = buildAiInfo(options.model)
  pendingArtifactDir = artifactDir
  pendingDateDir = dateDir

  await mkdir(artifactDir, { recursive: true })

  const context = {
    COMPANY: company,
    TICKER: ticker,
    REQUEST: options.request,
    MARKET: options.market,
    AS_OF_DATE: asOfDate,
    AI_MODEL: aiInfo.model
  }

  // --dry-run: 파라미터만 확인하고 종료
  if (options.dryRun) {
    console.log(JSON.stringify({ context, artifactDir, finalReportPath }, null, 2))
    pendingArtifactDir = ''
    pendingDateDir = ''
    return
  }

  // ══════════════════════════════════════════════════════════════════
  //  Wave 0: 입력 검증 + 기준 주가 확정
  // ══════════════════════════════════════════════════════════════════

  // 0-1: 입력 검증 — 유효한 종목 분석 요청인지 확인
  //   한국 종목: 로컬 캐시에서 즉시 검증 (AI 호출 없음)
  //   미국 종목/매칭 실패: AI(input-validator.md)로 fallback
  const validationResult = await runValidation({
    context,
    outputPath: path.join(artifactDir, getOutputFileName('input-validator')),
    model: options.model
  })

  if (!validationResult.valid) {
    const reason = validationResult.reason || '유효한 종목 분석 요청이 아닙니다.'
    console.log('[error] 기업명 또는 종목코드를 포함해 다시 입력해 주세요.')
    throw new Error(`입력 검증 실패: ${reason}`)
  }

  // 검증에서 추출한 정식 기업명/티커로 컨텍스트 업데이트
  if (validationResult.company) {
    context.COMPANY = validationResult.company
    company = validationResult.company
  }
  if (validationResult.ticker) {
    context.TICKER = validationResult.ticker
    ticker = validationResult.ticker
  }

  // --validate-only: 종목 검증 결과만 출력하고 종료 (개발/디버깅용)
  if (options.validateOnly) {
    console.log(JSON.stringify({ context, validationResult, artifactDir }, null, 2))
    pendingArtifactDir = ''
    pendingDateDir = ''
    return
  }

  // 0-2: 주가 조회 — 모든 에이전트가 사용할 기준 가격 확정
  const priceResult = await runPriceFetcher({
    context,
    outputPath: path.join(artifactDir, getOutputFileName('price-fetcher')),
    model: options.model
  })
  if (priceResult.priceFormatted) {
    context.CURRENT_PRICE = priceResult.priceFormatted
  }

  // ══════════════════════════════════════════════════════════════════
  //  Wave 1: 4개 분석 에이전트 병렬 실행
  // ══════════════════════════════════════════════════════════════════

  // Chain A: 재무 + 섹터 → 완료 즉시 밸류에이션 시작
  // Chain B: 뉴스 + 기술적 분석 → Chain A와 독립적으로 실행
  const financialPromise = runRole({
    role: 'financial-analyst-kr',
    context,
    outputPath: path.join(artifactDir, getOutputFileName('financial-analyst-kr')),
    model: options.model
  })
  const sectorPromise = runRole({
    role: 'sector-researcher',
    context,
    outputPath: path.join(artifactDir, getOutputFileName('sector-researcher')),
    model: options.model
  })
  const newsPromise = runRole({
    role: 'news-sentiment-analyst',
    context,
    outputPath: path.join(artifactDir, getOutputFileName('news-sentiment-analyst')),
    model: options.model
  })
  // 한국 종목: 공공데이터포털에서 일봉 데이터를 가져와 기술적 지표를 사전 계산
  // 기술적 지표가 있으면 price-analyst에게 TECHNICAL_DATA로 주입하여 "확인 불가" 방지
  const technicalData = await fetchKrTechnicalData({
    ticker: context.TICKER,
    company: context.COMPANY,
    currentPrice: Number(context.CURRENT_PRICE?.replace(/[^0-9.]/g, '')) || undefined
  })
  const priceAnalystContext = technicalData
    ? { ...context, TECHNICAL_DATA: JSON.stringify(technicalData, null, 2) }
    : context

  const pricePromise = runRole({
    role: 'price-analyst',
    context: priceAnalystContext,
    outputPath: path.join(artifactDir, getOutputFileName('price-analyst')),
    model: options.model
  })

  // Chain A 완료 대기 (Chain B는 백그라운드에서 계속 실행 중)
  const [financialOutcome, sectorOutcome] = await Promise.allSettled([
    financialPromise,
    sectorPromise
  ])

  if (financialOutcome.status === 'rejected') {
    console.error('[실패] financial-analyst-kr')
    console.warn('[경고] 재무 분석 에이전트 실패. 해당 데이터 없이 계속 진행합니다.')
  }
  if (sectorOutcome.status === 'rejected') {
    console.error('[실패] sector-researcher')
    console.warn('[경고] 업종 분석 에이전트 실패. 해당 데이터 없이 계속 진행합니다.')
  }

  // ══════════════════════════════════════════════════════════════════
  //  Wave 1b: 밸류에이션 (Chain A 결과 주입, Chain B와 병렬)
  // ══════════════════════════════════════════════════════════════════

  const valuationPromise = runRole({
    role: 'valuation-analyst',
    context: {
      ...context,
      FINANCIAL_ANALYSIS:
        financialOutcome.status === 'fulfilled' ? financialOutcome.value.content : '',
      SECTOR_ANALYSIS:
        sectorOutcome.status === 'fulfilled' ? sectorOutcome.value.content : ''
    },
    outputPath: path.join(artifactDir, getOutputFileName('valuation-analyst')),
    model: options.model
  })

  // Chain B + 밸류에이션 모두 완료 대기
  const [newsOutcome, priceOutcome, valuationOutcome] = await Promise.allSettled([
    newsPromise,
    pricePromise,
    valuationPromise
  ])

  if (newsOutcome.status === 'rejected') {
    console.error('[실패] news-sentiment-analyst')
    console.warn('[경고] 뉴스 분석 에이전트 실패. 해당 데이터 없이 계속 진행합니다.')
  }
  if (priceOutcome.status === 'rejected') {
    console.error('[실패] price-analyst')
    console.warn('[경고] 기술 분석 에이전트 실패. 해당 데이터 없이 계속 진행합니다.')
  }
  if (valuationOutcome.status === 'rejected') {
    console.warn(
      `[경고] valuation-analyst 실패. 해당 데이터 없이 계속 진행합니다. (${valuationOutcome.reason?.message ?? 'unknown'})`
    )
  }

  // 각 에이전트 결과를 맵으로 수집
  const resultMap = {
    'financial-analyst-kr':
      financialOutcome.status === 'fulfilled' ? financialOutcome.value.content : undefined,
    'sector-researcher':
      sectorOutcome.status === 'fulfilled' ? sectorOutcome.value.content : undefined,
    'news-sentiment-analyst':
      newsOutcome.status === 'fulfilled' ? newsOutcome.value.content : undefined,
    'price-analyst':
      priceOutcome.status === 'fulfilled' ? priceOutcome.value.content : undefined,
    'valuation-analyst':
      valuationOutcome.status === 'fulfilled' ? valuationOutcome.value.content : undefined
  }

  // Codex stderr에서 감지된 실제 모델명으로 업데이트
  const allOutcomes = [
    financialOutcome,
    sectorOutcome,
    newsOutcome,
    priceOutcome,
    valuationOutcome
  ]
  const autoDetectedModel = allOutcomes
    .filter((o) => o.status === 'fulfilled' && o.value.detectedModel)
    .map((o) => o.value.detectedModel)[0]
  if (autoDetectedModel) {
    aiInfo.model = autoDetectedModel
    context.AI_MODEL = autoDetectedModel
  }

  // ══════════════════════════════════════════════════════════════════
  //  Wave 2-1: 투자 유형 분류 (5개 분석 결과 종합)
  // ══════════════════════════════════════════════════════════════════

  const classifierContext = {
    ...context,
    FINANCIAL_ANALYSIS: resultMap['financial-analyst-kr'] ?? '',
    NEWS_ANALYSIS: resultMap['news-sentiment-analyst'] ?? '',
    SECTOR_ANALYSIS: resultMap['sector-researcher'] ?? '',
    PRICE_ANALYSIS: resultMap['price-analyst'] ?? '',
    VALUATION_ANALYSIS: resultMap['valuation-analyst'] ?? ''
  }

  let classifierContent = ''
  try {
    const classifierResult = await runRole({
      role: 'invest-type-classifier',
      context: classifierContext,
      outputPath: path.join(artifactDir, getOutputFileName('invest-type-classifier')),
      model: options.model
    })
    classifierContent = classifierResult.content
  } catch (err) {
    console.error('[실패] invest-type-classifier')
    console.warn(
      `[경고] 투자 유형 분류 에이전트 실패. 해당 데이터 없이 계속 진행합니다. (${err?.message ?? 'unknown'})`
    )
  }

  // ══════════════════════════════════════════════════════════════════
  //  Wave 2-2: 최종 투자 전략 생성 (모든 분석 + 유형 분류 종합)
  // ══════════════════════════════════════════════════════════════════

  const strategistContext = {
    ...context,
    FINANCIAL_ANALYSIS: resultMap['financial-analyst-kr'] ?? '',
    NEWS_ANALYSIS: resultMap['news-sentiment-analyst'] ?? '',
    SECTOR_ANALYSIS: resultMap['sector-researcher'] ?? '',
    PRICE_ANALYSIS: resultMap['price-analyst'] ?? '',
    VALUATION_ANALYSIS: resultMap['valuation-analyst'] ?? '',
    INVEST_TYPE_ANALYSIS: classifierContent
  }

  let finalReport
  try {
    finalReport = await runRole({
      role: 'aggressive-investment-strategist',
      context: strategistContext,
      outputPath: path.join(
        artifactDir,
        getOutputFileName('aggressive-investment-strategist')
      ),
      model: options.model
    })
  } catch (err) {
    console.error(`[실패] aggressive-investment-strategist: ${err?.message ?? 'unknown'}`)
    console.log(
      '[error] 분석에 실패하였습니다. 최종 투자 전략을 생성하지 못했습니다. 잠시 후 다시 시도해 주세요.'
    )
    throw err
  }

  // ══════════════════════════════════════════════════════════════════
  //  리포트 저장
  // ══════════════════════════════════════════════════════════════════

  const parsedReport = parseJsonReport(finalReport.content)
  const reportJson = {
    asOfDate,
    generatedAt: new Date().toISOString(),
    ...parsedReport,
    'ai-model': parsedReport['ai-model'] || aiInfo.model,
    aiInfo,
    artifactDir,
    company: parsedReport.company || company,
    ticker: parsedReport.ticker || ticker
  }
  await writeFile(finalReportPath, JSON.stringify(reportJson, null, 2), 'utf8')

  console.log(`최종 리포트 저장 완료: ${finalReportPath}`)
  pendingArtifactDir = ''
  pendingDateDir = ''
}

// =====================================================================
//  환경변수 로드
// =====================================================================

/**
 * .env 파일을 자동 탐색하여 환경변수를 로드한다.
 *
 * 이 스크립트는 Electron main process에서 child_process로 실행되기 때문에
 * 부모 프로세스의 환경변수를 상속받지 못할 수 있다.
 * 시작 디렉토리부터 상위 8단계까지 .env.local / .env를 탐색한다.
 */
function loadEnvFiles(startDir) {
  const candidates = []
  let current = startDir

  for (let i = 0; i < 8; i += 1) {
    candidates.push(path.join(current, '.env.local'), path.join(current, '.env'))
    const parent = path.dirname(current)
    if (parent === current) break
    current = parent
  }

  for (const envPath of candidates) {
    if (existsSync(envPath)) {
      loadDotenv({ path: envPath, override: false, quiet: true })
    }
  }
}

// =====================================================================
//  실행
// =====================================================================

main().catch(async (error) => {
  await cleanupFailedArtifacts(pendingArtifactDir, pendingDateDir, reportsDir)
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
