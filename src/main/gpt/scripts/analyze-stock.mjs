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
  'aggressive-investment-strategist': 'aggressive-investment-strategist.md'
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

  const company = options.company ?? extractCompany(options.request) ?? '미지정 종목'
  const ticker = options.ticker ?? extractTicker(options.request) ?? 'unknown'
  const asOfDate = formatDate(new Date())
  const identifier = buildIdentifier(company, ticker)
  const artifactDir = path.join(reportsDir, '.artifacts', `${identifier}_${asOfDate}`)
  const finalReportPath = path.join(reportsDir, `${identifier}_${asOfDate}.md`)

  await mkdir(artifactDir, { recursive: true })

  const context = {
    COMPANY: company,
    TICKER: ticker,
    REQUEST: options.request,
    AS_OF_DATE: asOfDate
  }

  if (options.dryRun) {
    console.log(JSON.stringify({ context, artifactDir, finalReportPath }, null, 2))
    return
  }

  const specialistRoles = ['financial-analyst-kr', 'news-sentiment-analyst', 'sector-researcher']

  const specialistResults = await Promise.all(
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

  const resultMap = Object.fromEntries(specialistResults.map((item) => [item.role, item.content]))

  const strategistContext = {
    ...context,
    FINANCIAL_ANALYSIS: resultMap['financial-analyst-kr'],
    NEWS_ANALYSIS: resultMap['news-sentiment-analyst'],
    SECTOR_ANALYSIS: resultMap['sector-researcher']
  }

  const strategistOutputPath = path.join(artifactDir, 'aggressive-investment-strategist.md')
  const finalReport = await runRole({
    role: 'aggressive-investment-strategist',
    context: strategistContext,
    outputPath: strategistOutputPath,
    model: options.model
  })

  await writeFile(finalReportPath, finalReport.content, 'utf8')

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

function execCodex({ prompt, outputPath, model }) {
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

    const child = spawn(codexCommand, args, {
      cwd: projectRoot,
      stdio: ['ignore', 'pipe', 'pipe']
    })

    child.stdout.on('data', (chunk) => {
      process.stdout.write(chunk)
    })

    child.stderr.on('data', (chunk) => {
      process.stderr.write(chunk)
    })

    child.on('error', (error) => {
      reject(error)
    })

    child.on('close', (code) => {
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
    search: true,
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
    if (arg === '--no-search') {
      options.search = false
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
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}${month}${day}`
}

function extractTicker(text) {
  const match = text.match(/\b\d{6}\b/)
  return match?.[0] ?? null
}

function extractCompany(text) {
  const cleaned = text
    .replace(/\b\d{6}\b/g, ' ')
    .replace(/(분석해줘|투자할 만해\?|종합 분석|리포트 만들어줘)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return cleaned || null
}

function buildIdentifier(company, ticker) {
  const safeCompany = company
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^\p{L}\p{N}_-]/gu, '')
  const safeTicker = ticker
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^\p{L}\p{N}_-]/gu, '')

  if (safeCompany && safeTicker && safeTicker !== 'unknown') {
    return `${safeCompany}_${safeTicker}`
  }
  if (safeTicker && safeTicker !== 'unknown') {
    return safeTicker
  }
  if (safeCompany) {
    return safeCompany
  }
  return 'analysis'
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
  --no-search   웹 검색 비활성화
  --dry-run     실제 Codex 실행 없이 파라미터만 확인
  --help, -h    도움말 출력
`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
