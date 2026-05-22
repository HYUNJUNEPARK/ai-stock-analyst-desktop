/**
 * src/main/constants.ts — 앱 전역 경로 상수
 *
 * main 프로세스 여러 모듈에서 공통으로 참조하는 경로를 한 곳에서 관리한다.
 * 경로가 바뀌면 이 파일만 수정하면 된다.
 */
import { join } from 'path'
import { homedir } from 'os'
import { existsSync } from 'fs'
import { app } from 'electron'
import { is } from '@electron-toolkit/utils'

/**
 * CLI 전용 설치 디렉토리: ~/.ai-cli-launcher
 *
 * npm install -g 대신 --prefix 옵션으로 이 경로에 설치한다.
 * 이유: 전역 설치는 관리자 권한이 필요해 EACCES(exit 243) 오류가 발생할 수 있기 때문.
 * 사용자 홈 하위 경로이므로 권한 문제 없이 설치 가능.
 */
export const CLI_PREFIX = join(homedir(), '.ai-cli-launcher')

/**
 * CLI 실행 파일 위치: ~/.ai-cli-launcher/node_modules/.bin
 * npm install --prefix 로 설치하면 실행 파일이 이 경로에 생성된다.
 * (예: ~/.ai-cli-launcher/node_modules/.bin/claude)
 */
export const CLI_BIN = join(CLI_PREFIX, 'node_modules', '.bin')

function resolveExistingDir(candidates: string[]): string {
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate
  }
  return candidates[0]
}

/**
 * Claude 멀티 에이전트 주식 분석 프로젝트 루트 경로
 *
 * 개발 환경(is.dev): 프로젝트 소스 기준 src/main/ai/claude
 * 프로덕션 빌드  : electron-builder의 extraResources로 패키징된 경로
 *
 * 이 디렉토리를 cwd로 설정해 Claude CLI를 실행하면,
 * Claude가 해당 디렉토리의 CLAUDE.md와 .claude/agents/ 설정을 자동으로 읽는다.
 */
export const STOCK_CLAUDE_DIR = is.dev
  ? resolveExistingDir([
      join(app.getAppPath(), 'src', 'main', 'ai', 'claude'),
      join(app.getAppPath(), 'src', 'main', 'claude')
    ])
  : resolveExistingDir([
      join(process.resourcesPath, 'ai', 'claude'),
      join(process.resourcesPath, 'claude')
    ])

/**
 * GPT(Codex) 멀티 에이전트 주식 분석 프로젝트 루트 경로
 * Claude와 동일한 방식으로 개발/프로덕션을 분기한다.
 */
export const STOCK_GPT_DIR = is.dev
  ? resolveExistingDir([
      join(app.getAppPath(), 'src', 'main', 'ai', 'gpt'),
      join(app.getAppPath(), 'src', 'main', 'gpt')
    ])
  : resolveExistingDir([
      join(process.resourcesPath, 'ai', 'gpt'),
      join(process.resourcesPath, 'gpt')
    ])

/** GPT 분석 결과 마크다운 보고서가 저장되는 디렉토리 */
export const STOCK_GPT_REPORTS_DIR = join(STOCK_GPT_DIR, 'reports')
