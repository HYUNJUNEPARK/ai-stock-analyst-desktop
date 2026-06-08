/* eslint-disable @typescript-eslint/explicit-function-return-type */

import { spawn } from 'node:child_process'
import { mkdir, readFile, writeFile, rm, readdir, rmdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')
const promptsDir = path.join(projectRoot, 'prompts')
const reportsDir = path.join(projectRoot, 'reports')
const codexCommand = process.env.CODEX_BIN || 'codex'
let pendingArtifactDir = ''
let pendingDateDir = ''

/** 역할 → 프롬프트 템플릿 파일명 (prompts/ 디렉토리) */
const ROLE_FILES = {
  'financial-analyst-kr': 'financial-analyst-kr.md',
  'news-sentiment-analyst': 'news-sentiment-analyst.md',
  'sector-researcher': 'sector-researcher.md',
  'price-analyst': 'price-analyst.md',
  'valuation-analyst': 'valuation-analyst.md',
  'invest-type-classifier': 'invest-type-classifier.md',
  'aggressive-investment-strategist': 'aggressive-investment-strategist.md',
  'input-validator': 'input-validator.md',
  'price-fetcher': 'price-fetcher.md'
}

/** 역할 → artifact 출력 파일명 (기본값: 프롬프트 파일명과 동일, JSON 출력인 경우 .json) */
const ROLE_OUTPUT_FILES = {
  'financial-analyst-kr': 'financial-analyst-kr.json',
  'news-sentiment-analyst': 'news-sentiment-analyst.json',
  'sector-researcher': 'sector-researcher.json',
  'price-analyst': 'price-analyst.json',
  'valuation-analyst': 'valuation-analyst.json',
  'invest-type-classifier': 'invest-type-classifier.json',
  'aggressive-investment-strategist': 'aggressive-investment-strategist.json',
  'input-validator': 'input-validator.json',
  'price-fetcher': 'price-fetcher.json'
}

/** 역할별 타임아웃 (ms). 기본값 7분, 최종 전략 에이전트는 10분 */
const ROLE_TIMEOUT = {
  'financial-analyst-kr': 7 * 60 * 1000,
  'news-sentiment-analyst': 7 * 60 * 1000,
  'sector-researcher': 7 * 60 * 1000,
  'price-analyst': 7 * 60 * 1000,
  'valuation-analyst': 7 * 60 * 1000,
  'invest-type-classifier': 7 * 60 * 1000,
  'aggressive-investment-strategist': 10 * 60 * 1000,
  'input-validator': 2 * 60 * 1000,
  'price-fetcher': 2 * 60 * 1000
}

function spawnCommand(command, args, options) {
  if (process.platform === 'win32' && /\.(cmd|bat)$/i.test(command)) {
    return spawn(process.env.COMSPEC || 'cmd.exe', ['/d', '/s', '/c', command, ...args], options)
  }

  return spawn(command, args, options)
}

async function main() {
  const options = parseArgs(process.argv.slice(2))

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

  let ticker = options.ticker || extractTicker(options.request) || 'unknown'
  let company = options.company || extractCompany(options.request) || (ticker !== 'unknown' ? ticker : '미지정 종목')
  const asOfDateFile = formatDate(new Date())
  const asOfDate = formatDateDisplay(new Date())
  const identifier = buildIdentifier(company)
  const dateDir = path.join(reportsDir, asOfDateFile)
  const artifactDir = resolveUniqueFolderPath(dateDir, identifier)
  const finalReportPath = path.join(artifactDir, getOutputFileName('aggressive-investment-strategist'))
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

  if (options.dryRun) {
    console.log(JSON.stringify({ context, artifactDir, finalReportPath }, null, 2))
    pendingArtifactDir = ''
    pendingDateDir = ''
    return
  }

  // Wave 0: 입력 검증 + 기준 주가 확정
  // 0-1: 입력 검증 — 유효한 종목 분석 요청인지 사전 확인
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

  // 0-2: 주가 조회 — 모든 에이전트가 사용할 기준 가격 확정
  const priceResult = await runPriceFetcher({
    context,
    outputPath: path.join(artifactDir, getOutputFileName('price-fetcher')),
    model: options.model
  })
  if (priceResult.priceFormatted) {
    context.CURRENT_PRICE = priceResult.priceFormatted
  }

  // Wave 1: 4개 동시 시작
  // Chain A (financial + sector): 완료 즉시 valuation 시작
  // Chain B (news + price): Chain A와 독립적으로 실행
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
  const pricePromise = runRole({
    role: 'price-analyst',
    context,
    outputPath: path.join(artifactDir, getOutputFileName('price-analyst')),
    model: options.model
  })

  // Chain A 완료 대기 → valuation 즉시 시작 (Chain B는 계속 병렬 실행 중)
  const [financialOutcome, sectorOutcome] = await Promise.allSettled([financialPromise, sectorPromise])

  if (financialOutcome.status === 'rejected') {
    console.error('[실패] financial-analyst-kr')
    console.warn('[경고] 재무 분석 에이전트 실패. 해당 데이터 없이 계속 진행합니다.')
  }
  if (sectorOutcome.status === 'rejected') {
    console.error('[실패] sector-researcher')
    console.warn('[경고] 업종 분석 에이전트 실패. 해당 데이터 없이 계속 진행합니다.')
  }

  // Wave 1b: valuation — Chain A 결과 즉시 주입, Chain B와 병렬 실행
  const valuationPromise = runRole({
    role: 'valuation-analyst',
    context: {
      ...context,
      FINANCIAL_ANALYSIS: financialOutcome.status === 'fulfilled' ? financialOutcome.value.content : '',
      SECTOR_ANALYSIS: sectorOutcome.status === 'fulfilled' ? sectorOutcome.value.content : ''
    },
    outputPath: path.join(artifactDir, getOutputFileName('valuation-analyst')),
    model: options.model
  })

  // Chain B + valuation 모두 완료 대기
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
    console.warn(`[경고] valuation-analyst 실패. 해당 데이터 없이 계속 진행합니다. (${valuationOutcome.reason?.message ?? 'unknown'})`)
  }

  const resultMap = {
    'financial-analyst-kr': financialOutcome.status === 'fulfilled' ? financialOutcome.value.content : undefined,
    'sector-researcher': sectorOutcome.status === 'fulfilled' ? sectorOutcome.value.content : undefined,
    'news-sentiment-analyst': newsOutcome.status === 'fulfilled' ? newsOutcome.value.content : undefined,
    'price-analyst': priceOutcome.status === 'fulfilled' ? priceOutcome.value.content : undefined,
    'valuation-analyst': valuationOutcome.status === 'fulfilled' ? valuationOutcome.value.content : undefined
  }

  // Codex stderr에서 감지된 실제 모델명으로 aiInfo 업데이트
  const allOutcomes = [financialOutcome, sectorOutcome, newsOutcome, priceOutcome, valuationOutcome]
  const autoDetectedModel = allOutcomes
    .filter((o) => o.status === 'fulfilled' && o.value.detectedModel)
    .map((o) => o.value.detectedModel)[0]
  if (autoDetectedModel) {
    aiInfo.model = autoDetectedModel
    context.AI_MODEL = autoDetectedModel
  }

  const classifierContext = {
    ...context,
    FINANCIAL_ANALYSIS: resultMap['financial-analyst-kr'] ?? '',
    NEWS_ANALYSIS: resultMap['news-sentiment-analyst'] ?? '',
    SECTOR_ANALYSIS: resultMap['sector-researcher'] ?? '',
    PRICE_ANALYSIS: resultMap['price-analyst'] ?? '',
    VALUATION_ANALYSIS: resultMap['valuation-analyst'] ?? ''
  }

  const classifierOutputPath = path.join(artifactDir, getOutputFileName('invest-type-classifier'))
  let classifierContent = ''
  try {
    const classifierResult = await runRole({
      role: 'invest-type-classifier',
      context: classifierContext,
      outputPath: classifierOutputPath,
      model: options.model
    })
    classifierContent = classifierResult.content
  } catch (err) {
    console.error('[실패] invest-type-classifier')
    console.warn(`[경고] 투자 유형 분류 에이전트 실패. 해당 데이터 없이 계속 진행합니다. (${err?.message ?? 'unknown'})`)
  }

  const strategistContext = {
    ...context,
    FINANCIAL_ANALYSIS: resultMap['financial-analyst-kr'] ?? '',
    NEWS_ANALYSIS: resultMap['news-sentiment-analyst'] ?? '',
    SECTOR_ANALYSIS: resultMap['sector-researcher'] ?? '',
    PRICE_ANALYSIS: resultMap['price-analyst'] ?? '',
    VALUATION_ANALYSIS: resultMap['valuation-analyst'] ?? '',
    INVEST_TYPE_ANALYSIS: classifierContent
  }

  const strategistOutputPath = path.join(artifactDir, getOutputFileName('aggressive-investment-strategist'))
  let finalReport
  try {
    finalReport = await runRole({
      role: 'aggressive-investment-strategist',
      context: strategistContext,
      outputPath: strategistOutputPath,
      model: options.model
    })
  } catch (err) {
    console.error(`[실패] aggressive-investment-strategist: ${err?.message ?? 'unknown'}`)
    console.log('[error] 분석에 실패하였습니다. 최종 투자 전략을 생성하지 못했습니다. 잠시 후 다시 시도해 주세요.')
    throw err
  }

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

/** 역할에 대응하는 artifact 출력 파일명을 반환한다. */
function getOutputFileName(role) {
  return ROLE_OUTPUT_FILES[role] || ROLE_FILES[role]
}

/**
 * 입력 검증을 실행한다.
 * runRole과 달리 [start]/[done] 로그를 출력하지 않아 UI 에이전트 상태에 영향을 주지 않는다.
 * 검증 실패 시에도 분석을 중단하지 않고 fail-open으로 동작한다.
 */
async function runValidation({ context, outputPath, model }) {
  const promptTemplate = await loadPromptTemplate('input-validator')
  const prompt = applyTemplate(promptTemplate, context)
  const timeoutMs = ROLE_TIMEOUT['input-validator']

  try {
    await execCodex({ prompt, outputPath, model, timeoutMs })
    const content = await readFile(outputPath, 'utf8')
    return parseValidationResult(content)
  } catch (err) {
    console.warn(`[경고] 입력 검증 실행 실패. 검증을 건너뛰고 계속 진행합니다. (${err?.message ?? 'unknown'})`)
    return { valid: true, company: '', ticker: '', reason: '' }
  }
}

/**
 * 주가를 조회한다.
 * runValidation과 동일하게 [start]/[done] 로그를 출력하지 않아 UI 에이전트 상태에 영향을 주지 않는다.
 * 조회 실패 시에도 분석을 중단하지 않고 빈 값으로 계속 진행한다.
 */
async function runPriceFetcher({ context, outputPath, model }) {
  const promptTemplate = await loadPromptTemplate('price-fetcher')
  const prompt = applyTemplate(promptTemplate, context)
  const timeoutMs = ROLE_TIMEOUT['price-fetcher']

  try {
    await execCodex({ prompt, outputPath, model, timeoutMs })
    const content = await readFile(outputPath, 'utf8')
    return parsePriceFetcherResult(content)
  } catch (err) {
    console.warn(`[경고] 주가 조회 실패. 각 에이전트가 개별적으로 주가를 조회합니다. (${err?.message ?? 'unknown'})`)
    return { price: '', priceFormatted: '', currency: '' }
  }
}

function parsePriceFetcherResult(raw) {
  try {
    const stripped = raw.replace(/```(?:json)?\s*/g, '').replace(/```/g, '')
    const match = stripped.match(/\{[\s\S]*\}/)
    const parsed = JSON.parse(match?.[0] ?? stripped)
    return {
      price: parsed.price || '',
      priceFormatted: parsed.priceFormatted || '',
      currency: parsed.currency || ''
    }
  } catch {
    console.warn('[경고] 주가 조회 결과 파싱 실패. 각 에이전트가 개별적으로 주가를 조회합니다.')
    return { price: '', priceFormatted: '', currency: '' }
  }
}

function parseValidationResult(raw) {
  try {
    const stripped = raw.replace(/```(?:json)?\s*/g, '').replace(/```/g, '')
    const match = stripped.match(/\{[\s\S]*\}/)
    const parsed = JSON.parse(match?.[0] ?? stripped)
    return {
      valid: parsed.valid === true,
      company: parsed.company || '',
      ticker: parsed.ticker || '',
      reason: parsed.reason || ''
    }
  } catch {
    console.warn('[경고] 입력 검증 결과 파싱 실패. 검증을 건너뛰고 계속 진행합니다.')
    return { valid: true, company: '', ticker: '', reason: '' }
  }
}

async function runRole({ role, context, outputPath, model }) {
  const promptTemplate = await loadPromptTemplate(role)
  const prompt = applyTemplate(promptTemplate, context)

  console.log(`[start] ${role}`)
  const timeoutMs = ROLE_TIMEOUT[role] || 7 * 60 * 1000
  const { detectedModel } = await execCodex({ prompt, outputPath, model, timeoutMs })
  const content = await readFile(outputPath, 'utf8')
  console.log(`[done] ${role}`)

  return { role, content, outputPath, detectedModel }
}

async function loadPromptTemplate(role) {
  const fileName = ROLE_FILES[role]
  if (!fileName) {
    throw new Error(`알 수 없는 역할: ${role}`)
  }

  return readFile(path.join(promptsDir, fileName), 'utf8')
}

function applyTemplate(template, vars) {
  return template.replace(/\{\{([A-Z_]+)\}\}/g, (_match, key) => {
    return String(vars[key] ?? '')
  })
}

function execCodex({ prompt, outputPath, model, timeoutMs = 7 * 60 * 1000 }) {
  return new Promise((resolve, reject) => {
    const args = [
      'exec',
      '--skip-git-repo-check',
      '--sandbox',
      'workspace-write',
      '--cd',
      projectRoot,
      '--color',
      'never',
      '--output-last-message',
      outputPath
    ]

    if (model) {
      args.push('--model', model)
    }

    args.push('-')

    const child = spawnCommand(codexCommand, args, {
      cwd: projectRoot,
      stdio: ['pipe', 'pipe', 'pipe']
    })

    child.stdin.end(prompt)

    const timer = setTimeout(() => {
      child.kill()
      reject(new Error(`타임아웃: ${timeoutMs / 1000}초 초과`))
    }, timeoutMs)

    let detectedModel = ''

    child.stdout.on('data', (chunk) => {
      process.stdout.write(chunk)
    })

    child.stderr.on('data', (chunk) => {
      process.stderr.write(chunk)
      // Codex는 세션 시작 시 stderr에 "model: <모델명>"을 출력한다
      if (!detectedModel) {
        const modelMatch = chunk.toString().match(/^model:\s*(.+)$/m)
        if (modelMatch) detectedModel = modelMatch[1].trim()
      }
    })

    child.on('error', (error) => {
      clearTimeout(timer)
      reject(error)
    })

    child.on('close', (code) => {
      clearTimeout(timer)
      if (code === 0 && existsSync(outputPath)) {
        resolve({ detectedModel })
        return
      }
      if (code !== 0) {
        reject(new Error(`비정상 종료 (exit code: ${code ?? 'unknown'})`))
        return
      }
      reject(new Error(`출력 파일 미생성: ${outputPath}`))
    })
  })
}

function parseArgs(argv) {
  const options = {
    company: '',
    ticker: '',
    request: '',
    market: '',
    model: '',
    dryRun: false,
    help: false
  }

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--company') {
      options.company = argv[++i] ?? ''
      continue
    }
    if (arg === '--ticker') {
      options.ticker = argv[++i] ?? ''
      continue
    }
    if (arg === '--request') {
      options.request = argv[++i] ?? ''
      continue
    }
    if (arg === '--market') {
      options.market = argv[++i] ?? ''
      continue
    }
    if (arg === '--model') {
      options.model = argv[++i] ?? ''
      continue
    }
    if (arg === '--dry-run') {
      options.dryRun = true
      continue
    }
    if (arg === '--help' || arg === '-h') {
      options.help = true
      continue
    }
    if (!arg.startsWith('--') && !options.request) {
      options.request = arg
    }
  }

  return options
}

function formatDate(date) {
  const year = String(date.getFullYear())
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}${month}${day}`
}

function formatDateDisplay(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function extractTicker(text) {
  // 한국 종목코드 (6자리 숫자) 우선 매칭
  const krMatch = text.match(/\b\d{6}\b/)
  if (krMatch) return krMatch[0]
  // 미국 티커 (2~5자리 대문자 알파벳, 단독 토큰)
  const usMatch = text.match(/\b[A-Z]{2,5}\b/)
  return usMatch?.[0] ?? null
}

function extractCompany(text) {
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

function buildIdentifier(company) {
  const safeCompany = company
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^\p{L}\p{N}_-]/gu, '')
  return safeCompany || 'analysis'
}

const REQUIRED_REPORT_FIELDS = ['company', 'verdict', 'summary', 'analysis', 'strategy']

function parseJsonReport(raw) {
  // 마크다운 코드 블록 전체 제거 (여러 개 대응)
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

function buildAiInfo(model) {
  return {
    model: model || 'gpt-default',
    engine: 'gpt'
  }
}

function resolveUniqueFolderPath(dir, baseName) {
  const candidate = path.join(dir, baseName)
  if (!existsSync(candidate)) return candidate
  let i = 1
  while (existsSync(path.join(dir, `${baseName}_${i}`))) {
    i++
  }
  return path.join(dir, `${baseName}_${i}`)
}

function isPathInside(parent, candidate) {
  const resolvedParent = path.resolve(parent)
  const resolvedCandidate = path.resolve(candidate)
  return resolvedCandidate.startsWith(`${resolvedParent}${path.sep}`)
}

async function cleanupFailedArtifacts(artifactDir, dateDir) {
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
    console.warn(`[cleanup] failed to remove analysis artifacts: ${error instanceof Error ? error.message : String(error)}`)
  }
}

function printHelp() {
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
  --help, -h    도움말 출력
`)
}

main().catch(async (error) => {
  await cleanupFailedArtifacts(pendingArtifactDir, pendingDateDir)
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
