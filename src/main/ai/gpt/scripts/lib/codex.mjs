/**
 * lib/codex.mjs — Codex CLI 실행 및 프롬프트 관리 모듈
 *
 * OpenAI Codex CLI를 child_process로 실행하여 AI 에이전트 분석을 수행한다.
 * 각 에이전트(재무 분석, 뉴스 분석 등)는 프롬프트 템플릿에 컨텍스트를 주입한
 * 텍스트를 Codex의 stdin으로 전달하고, 결과를 파일로 받아온다.
 *
 * 주요 함수:
 *   - runRole()           : 에이전트 하나를 실행 ([start]/[done] 로그 포함)
 *   - runValidation()     : input-validator 실행 (로컬 검증 우선, AI fallback)
 *   - runPriceFetcher()   : price-fetcher 실행 (기준 주가 조회)
 *   - execCodex()         : Codex CLI 프로세스 실행 (저수준)
 */

import { spawn } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { validateWithLocalSymbols } from '../../../shared/local-symbols.mjs'
import { fetchStockPrice } from '../../../shared/stock-price.mjs'

// ── 경로 설정 (analyze-stock.mjs에서 initCodex()로 주입) ─────────────
let projectRoot = ''
let promptsDir = ''
let codexCommand = 'codex'

/**
 * 모듈 초기화. analyze-stock.mjs 시작 시 한 번 호출해야 한다.
 * Codex CLI 경로와 프롬프트 디렉토리 등 실행에 필요한 설정을 주입한다.
 */
export function initCodex({ projectRoot: root, promptsDir: prompts, codexCommand: cmd }) {
  projectRoot = root
  promptsDir = prompts
  codexCommand = cmd
}

// ── 에이전트 설정 ────────────────────────────────────────────────────

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

/** 역할 → artifact 출력 파일명 */
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

/** 역할별 타임아웃 (ms). 기본 7분, 최종 전략 에이전트는 10분 */
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

// =====================================================================
//  공개 API
// =====================================================================

/** 역할에 대응하는 artifact 출력 파일명을 반환한다. */
export function getOutputFileName(role) {
  return ROLE_OUTPUT_FILES[role] || ROLE_FILES[role]
}

/**
 * 에이전트 하나를 실행한다.
 *
 * stdout에 [start]/[done] 로그를 출력하여
 * Electron UI(stock-analysis.ts)가 진행 상황을 파싱할 수 있게 한다.
 *
 * @param {object} params
 * @param {string} params.role       - 에이전트 역할명 (예: 'financial-analyst-kr')
 * @param {object} params.context    - 프롬프트 템플릿에 주입할 변수 맵
 * @param {string} params.outputPath - Codex 출력 파일 경로
 * @param {string} params.model      - Codex 모델명 (옵션)
 * @returns {{ role, content, outputPath, detectedModel }}
 */
export async function runRole({ role, context, outputPath, model }) {
  const promptTemplate = await loadPromptTemplate(role)
  const prompt = applyTemplate(promptTemplate, context)

  console.log(`[start] ${role}`)
  const timeoutMs = ROLE_TIMEOUT[role] || 7 * 60 * 1000
  const { detectedModel } = await execCodex({ prompt, outputPath, model, timeoutMs })
  const content = await readFile(outputPath, 'utf8')
  console.log(`[done] ${role}`)

  return { role, content, outputPath, detectedModel }
}

/**
 * 입력 검증을 실행한다.
 *
 * 실행 순서:
 *   1. 로컬 종목 마스터에서 먼저 매칭 시도 (API 비용 없음, 즉시 완료)
 *   2. 로컬 매칭 실패 시 → Codex AI(input-validator.md)로 fallback
 *   3. AI도 실패 시 → fail-open (valid: true로 통과시켜 분석 계속)
 *
 * [start]/[done] 로그를 출력하지 않아 UI 에이전트 상태에 영향을 주지 않는다.
 */
export async function runValidation({ context, outputPath, model }) {
  // 한국 종목은 로컬 마스터로 먼저 검증
  const localResult = await validateWithLocalSymbols({ context, outputPath })
  if (localResult) return localResult

  // 로컬 매칭 실패 → AI fallback
  const promptTemplate = await loadPromptTemplate('input-validator')
  const prompt = applyTemplate(promptTemplate, context)
  const timeoutMs = ROLE_TIMEOUT['input-validator']

  try {
    await execCodex({ prompt, outputPath, model, timeoutMs })
    const content = await readFile(outputPath, 'utf8')
    return parseValidationResult(content)
  } catch (err) {
    console.warn(
      `[경고] 입력 검증 실행 실패. 검증을 건너뛰고 계속 진행합니다. (${err?.message ?? 'unknown'})`
    )
    return { valid: true, company: '', ticker: '', reason: '' }
  }
}

/**
 * 기준 주가를 조회한다.
 *
 * 모든 분석 에이전트가 동일한 가격을 기준으로 분석하도록,
 * 파이프라인 초기에 한 번 주가를 확정한다.
 *
 * [start]/[done] 로그를 출력하지 않아 UI 에이전트 상태에 영향을 주지 않는다.
 * 조회 실패 시에도 분석을 중단하지 않고 빈 값으로 계속 진행한다.
 */
export async function runPriceFetcher({ context, outputPath, model }) {
  // 한국 종목은 공공데이터포털 API로 먼저 조회 (AI 호출 없음, 즉시 완료)
  const localResult = await fetchStockPrice({
    ticker: context.TICKER,
    company: context.COMPANY,
    market: context.MARKET
  })
  if (localResult) {
    const { writeFile } = await import('node:fs/promises')
    await writeFile(outputPath, JSON.stringify(localResult, null, 2), 'utf8')
    console.log(
      `[price] 공공데이터 API 조회 성공: ${localResult.company} ${localResult.priceFormatted}`
    )
    return localResult
  }

  // 공공데이터 조회 실패 → AI fallback
  const promptTemplate = await loadPromptTemplate('price-fetcher')
  const prompt = applyTemplate(promptTemplate, context)
  const timeoutMs = ROLE_TIMEOUT['price-fetcher']

  try {
    await execCodex({ prompt, outputPath, model, timeoutMs })
    const content = await readFile(outputPath, 'utf8')
    return parsePriceFetcherResult(content)
  } catch (err) {
    console.warn(
      `[경고] 주가 조회 실패. 각 에이전트가 개별적으로 주가를 조회합니다. (${err?.message ?? 'unknown'})`
    )
    return { price: '', priceFormatted: '', currency: '' }
  }
}

// =====================================================================
//  Codex CLI 실행 (저수준)
// =====================================================================

/**
 * Codex CLI를 child_process로 실행한다.
 *
 * 실행 명령 구조:
 *   codex exec --skip-git-repo-check --sandbox workspace-write \
 *     --cd <projectRoot> --color never --output-last-message <outputPath> \
 *     [--model <model>] -
 *
 * stdin으로 프롬프트를 전달하고, Codex가 결과를 outputPath 파일에 기록한다.
 * stderr에서 "model: <이름>" 라인을 감지해 실제 사용된 모델명을 반환한다.
 *
 * @param {object} params
 * @param {string} params.prompt     - Codex에 전달할 프롬프트 텍스트
 * @param {string} params.outputPath - Codex가 결과를 기록할 파일 경로
 * @param {string} params.model      - 사용할 모델명 (빈 문자열이면 기본값)
 * @param {number} params.timeoutMs  - 타임아웃 (ms, 기본 7분)
 * @returns {{ detectedModel: string }}
 */
export function execCodex({ prompt, outputPath, model, timeoutMs = 7 * 60 * 1000 }) {
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

    // '-'는 stdin에서 프롬프트를 읽겠다는 의미
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

// =====================================================================
//  프롬프트 템플릿 로딩
// =====================================================================

/** prompts/ 디렉토리에서 역할에 대응하는 .md 파일을 읽어 반환한다. */
async function loadPromptTemplate(role) {
  const fileName = ROLE_FILES[role]
  if (!fileName) {
    throw new Error(`알 수 없는 역할: ${role}`)
  }
  return readFile(path.join(promptsDir, fileName), 'utf8')
}

/**
 * 프롬프트 템플릿의 {{PLACEHOLDER}}를 실제 값으로 치환한다.
 * 예: "회사명: {{COMPANY}}" + { COMPANY: "삼성전자" } → "회사명: 삼성전자"
 */
function applyTemplate(template, vars) {
  return template.replace(/\{\{([A-Z_]+)\}\}/g, (_match, key) => {
    return String(vars[key] ?? '')
  })
}

// =====================================================================
//  응답 파싱
// =====================================================================

/** input-validator 응답을 파싱한다. 파싱 실패 시 fail-open (valid: true). */
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

/** price-fetcher 응답을 파싱한다. 파싱 실패 시 빈 값 반환. */
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

// =====================================================================
//  내부 유틸리티
// =====================================================================

/** Windows cmd/bat 파일인 경우 COMSPEC을 통해 실행한다. */
function spawnCommand(command, args, options) {
  if (process.platform === 'win32' && /\.(cmd|bat)$/i.test(command)) {
    return spawn(process.env.COMSPEC || 'cmd.exe', ['/d', '/s', '/c', command, ...args], options)
  }
  return spawn(command, args, options)
}
