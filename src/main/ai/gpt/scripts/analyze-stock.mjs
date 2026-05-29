/* eslint-disable @typescript-eslint/explicit-function-return-type */

import { spawn } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
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

const ROLE_FILES = {
  'financial-analyst-kr': 'financial-analyst-kr.md',
  'news-sentiment-analyst': 'news-sentiment-analyst.md',
  'sector-researcher': 'sector-researcher.md',
  'price-analyst': 'price-analyst.md',
  'invest-type-classifier': 'invest-type-classifier.md',
  'aggressive-investment-strategist': 'aggressive-investment-strategist.md'
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

  const company = options.company || extractCompany(options.request) || '미지정 종목'
  const ticker = options.ticker || extractTicker(options.request) || 'unknown'
  const asOfDateFile = formatDate(new Date())
  const asOfDate = formatDateDisplay(new Date())
  const identifier = buildIdentifier(company)
  const dateDir = path.join(reportsDir, asOfDateFile)
  const artifactDir = resolveUniqueFolderPath(dateDir, identifier)
  const finalReportPath = path.join(artifactDir, `${path.basename(artifactDir)}.json`)
  const aiInfo = buildAiInfo(options.model)

  await mkdir(artifactDir, { recursive: true })

  const context = {
    COMPANY: company,
    TICKER: ticker,
    REQUEST: options.request,
    AS_OF_DATE: asOfDate,
    AI_MODEL: aiInfo.model
  }

  if (options.dryRun) {
    console.log(JSON.stringify({ context, artifactDir, finalReportPath }, null, 2))
    return
  }

  const specialistRoles = ['financial-analyst-kr', 'news-sentiment-analyst', 'sector-researcher', 'price-analyst']

  const settledResults = await Promise.allSettled(
    specialistRoles.map((role) => {
      const outputPath = path.join(artifactDir, `${role}.md`)
      return runRole({
        role,
        context,
        outputPath,
        model: options.model
      })
    })
  )

  const failedRoles = settledResults
    .map((r, i) => (r.status === 'rejected' ? specialistRoles[i] : null))
    .filter(Boolean)

  if (failedRoles.length > 0) {
    for (const role of failedRoles) {
      console.error(`[실패] ${role}`)
    }
    if (failedRoles.length === specialistRoles.length) {
      throw new Error('모든 전문가 에이전트가 실패했습니다.')
    }
    console.warn(`[경고] ${failedRoles.length}개 에이전트 실패. 나머지 결과로 분석을 계속합니다.`)
  }

  const resultMap = Object.fromEntries(
    settledResults
      .filter((r) => r.status === 'fulfilled')
      .map((r) => [r.value.role, r.value.content])
  )

  const classifierContext = {
    ...context,
    FINANCIAL_ANALYSIS: resultMap['financial-analyst-kr'],
    NEWS_ANALYSIS: resultMap['news-sentiment-analyst'],
    SECTOR_ANALYSIS: resultMap['sector-researcher'],
    PRICE_ANALYSIS: resultMap['price-analyst']
  }

  const classifierOutputPath = path.join(artifactDir, 'invest-type-classifier.md')
  const classifierResult = await runRole({
    role: 'invest-type-classifier',
    context: classifierContext,
    outputPath: classifierOutputPath,
    model: options.model
  })

  const strategistContext = {
    ...context,
    FINANCIAL_ANALYSIS: resultMap['financial-analyst-kr'],
    NEWS_ANALYSIS: resultMap['news-sentiment-analyst'],
    SECTOR_ANALYSIS: resultMap['sector-researcher'],
    PRICE_ANALYSIS: resultMap['price-analyst'],
    INVEST_TYPE_ANALYSIS: classifierResult.content
  }

  const strategistOutputPath = path.join(artifactDir, 'aggressive-investment-strategist.md')
  const finalReport = await runRole({
    role: 'aggressive-investment-strategist',
    context: strategistContext,
    outputPath: strategistOutputPath,
    model: options.model
  })

  const parsedReport = parseJsonReport(finalReport.content)
  const reportJson = {
    asOfDate,
    generatedAt: new Date().toISOString(),
    ...parsedReport,
    'ai-model': parsedReport['ai-model'] || aiInfo.model,
    aiInfo,
    company: parsedReport.company || company,
    ticker: parsedReport.ticker || ticker,
    artifactDir
  }
  await writeFile(finalReportPath, JSON.stringify(reportJson, null, 2), 'utf8')

  console.log(`최종 리포트 저장 완료: ${finalReportPath}`)
}

async function runRole({ role, context, outputPath, model }) {
  const promptTemplate = await loadPromptTemplate(role)
  const prompt = applyTemplate(promptTemplate, context)

  console.log(`[start] ${role}`)
  await execCodex({
    prompt,
    outputPath,
    model
  })
  const content = await readFile(outputPath, 'utf8')
  console.log(`[done] ${role}`)

  return { role, content, outputPath }
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

function execCodex({ prompt, outputPath, model, timeoutMs = 5 * 60 * 1000 }) {
  return new Promise((resolve, reject) => {
    const args = [
      'exec',
      '--skip-git-repo-check',
      '--sandbox',
      'workspace-write',
      '--dangerously-bypass-approvals-and-sandbox',
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

    args.push(prompt)

    const child = spawnCommand(codexCommand, args, {
      cwd: projectRoot,
      stdio: ['ignore', 'pipe', 'pipe']
    })

    const timer = setTimeout(() => {
      child.kill()
      reject(new Error(`codex exec 타임아웃: ${timeoutMs / 1000}초 초과`))
    }, timeoutMs)

    child.stdout.on('data', (chunk) => {
      process.stdout.write(chunk)
    })

    child.stderr.on('data', (chunk) => {
      process.stderr.write(chunk)
    })

    child.on('error', (error) => {
      clearTimeout(timer)
      reject(error)
    })

    child.on('close', (code) => {
      clearTimeout(timer)
      if (code === 0 && existsSync(outputPath)) {
        resolve()
        return
      }
      reject(new Error(`codex exec 실패: ${code ?? 'unknown'}`))
    })
  })
}

function parseArgs(argv) {
  const options = {
    company: '',
    ticker: '',
    request: '',
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
    .replace(/\b\d{6}\b/g, ' ')
    .replace(/\b[A-Z]{2,5}\b/g, ' ')
    .replace(/(분석해줘|투자할 만해\?|종합 분석|리포트 만들어줘|analyze|report|should I buy)/gi, ' ')
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

function parseJsonReport(raw) {
  // 마크다운 코드 블록 전체 제거 (여러 개 대응)
  const stripped = raw.replace(/```(?:json)?\s*/g, '').replace(/```/g, '')
  const match = stripped.match(/\{[\s\S]*\}/)
  try {
    return JSON.parse(match?.[0] ?? stripped)
  } catch {
    console.error('[parseJsonReport] JSON 파싱 실패. raw 응답을 확인하세요.')
    return { raw }
  }
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

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
