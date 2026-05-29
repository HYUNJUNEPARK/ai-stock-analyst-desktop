/**
 * src/main/ipc/cli-stats.ts — CLI 사용 통계 IPC 핸들러
 *
 * 담당 채널:
 *   - check-cli-stats : 이번 주 CLI 사용량 조회 (양방향)
 *   - get-model-info  : 선택된 모델의 구체적인 모델명 반환 (양방향)
 */

import { ipcMain } from 'electron'
import { IPC } from '../../shared/ipcChannels'
import { join } from 'path'
import { homedir } from 'os'
import { readFileSync } from 'fs'
import { spawnSync } from 'child_process'
import { STOCK_CLAUDE_DIR, STOCK_GPT_DIR } from '../constants'

/**
 * 이번 주 월요일 ~ 오늘 날짜 범위를 계산한다.
 *
 * CLI 사용 통계를 '이번 주' 기준으로 집계하기 위해 사용한다.
 * 일요일(getDay() === 0)은 주의 마지막 날이므로 6일 전을 월요일로 계산한다.
 *
 * 반환값:
 *   weekStart  : 'YYYY-MM-DD' 형식의 이번 주 월요일
 *   weekEnd    : 'YYYY-MM-DD' 형식의 오늘
 *   mondayTs   : Unix timestamp(초 단위) — SQLite 쿼리의 WHERE 조건에 사용
 */
function getWeekRange(): { weekStart: string; weekEnd: string; mondayTs: number } {
  const today = new Date()
  const dow = today.getDay()
  const daysFromMon = dow === 0 ? 6 : dow - 1
  const monday = new Date(today)
  monday.setDate(today.getDate() - daysFromMon)
  monday.setHours(0, 0, 0, 0)

  function fmt(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }
  return { weekStart: fmt(monday), weekEnd: fmt(today), mondayTs: Math.floor(monday.getTime() / 1000) }
}

/**
 * CLI 사용 통계 IPC 핸들러를 등록한다.
 */
export function registerCliStatsHandlers(): void {

  /**
   * IPC 채널: 'get-model-info'
   * 방향: renderer → main → renderer (handle = 양방향)
   * 용도: 선택된 모델의 구체적인 모델명을 반환
   *
   * Claude: 에이전트 .md 파일의 frontmatter에서 model 필드 파싱
   * GPT   : analyze-stock.mjs의 buildAiInfo 기본값에서 파싱
   */
  ipcMain.handle(IPC.GET_MODEL_INFO, (_event, model: string) => {
    try {
      if (model === 'claude') {
        const agentMdPath = join(STOCK_CLAUDE_DIR, '.claude', 'agents', 'financial-analyst-kr.md')
        const content = readFileSync(agentMdPath, 'utf-8')
        const match = content.match(/^model:\s*(.+)$/m)
        return { modelName: match?.[1]?.trim() ?? 'claude' }
      }
      if (model === 'gpt') {
        const scriptPath = join(STOCK_GPT_DIR, 'scripts', 'analyze-stock.mjs')
        const content = readFileSync(scriptPath, 'utf-8')
        const match = content.match(/model:\s*model\s*\|\|\s*['"]([^'"]+)['"]/)
        return { modelName: match?.[1]?.trim() ?? 'gpt' }
      }
      return { modelName: null }
    } catch {
      return { modelName: null }
    }
  })

  /**
   * IPC 채널: 'check-cli-stats'
   * 방향: renderer → main → renderer (handle = 양방향)
   * 용도: 설정 화면 등에서 이번 주 CLI 사용량(토큰, 세션 수 등)을 표시
   *
   * 모델별 데이터 소스:
   *   Claude: ~/.claude/stats-cache.json (Claude CLI가 자동 생성·갱신하는 캐시 파일)
   *   GPT   : ~/.codex/state_5.sqlite (Codex CLI가 관리하는 SQLite DB)
   *           — sqlite3 CLI 도구를 spawn해서 쿼리 실행
   *
   * 반환값 예시:
   *   { success: true, weekStart, weekEnd, weekly: { sessions, messages, toolCalls, tokensByModel } }
   */
  ipcMain.handle(IPC.CHECK_CLI_STATS, (_event, model: string) => {
    console.log(`[check-cli-stats] CLI 사용 통계 조회: 모델=${model}`)
    const { weekStart, weekEnd, mondayTs } = getWeekRange()

    if (model === 'claude') {
      try {
        interface DailyActivity { date: string; messageCount: number; sessionCount: number; toolCallCount: number }
        interface DailyModelTokens { date: string; tokensByModel: Record<string, number> }
        interface StatsCache { dailyActivity: DailyActivity[]; dailyModelTokens: DailyModelTokens[] }

        const raw = readFileSync(join(homedir(), '.claude', 'stats-cache.json'), 'utf-8')
        const stats: StatsCache = JSON.parse(raw)
        const inWeek = (d: string): boolean => d >= weekStart && d <= weekEnd

        let messages = 0, sessions = 0, toolCalls = 0
        const tokensByModel: Record<string, number> = {}

        for (const d of stats.dailyActivity) {
          if (inWeek(d.date)) {
            messages += d.messageCount
            sessions += d.sessionCount
            toolCalls += d.toolCallCount
          }
        }
        for (const d of stats.dailyModelTokens) {
          if (inWeek(d.date)) {
            for (const [m, t] of Object.entries(d.tokensByModel)) {
              tokensByModel[m] = (tokensByModel[m] ?? 0) + t
            }
          }
        }
        console.log(`[check-cli-stats] CLI 사용 통계 조회 완료: 모델=${model} 세션=${sessions} 메시지=${messages}`)
        return { success: true, weekStart, weekEnd, weekly: { sessions, messages, toolCalls, tokensByModel } }
      } catch (err) {
        console.error(`[check-cli-stats] CLI 사용 통계 조회 실패: 모델=${model}`, (err as Error).message)
        return { success: false, error: `stats-cache.json 읽기 실패: ${(err as Error).message}` }
      }
    }

    if (model === 'gpt') {
      try {
        const dbPath = join(homedir(), '.codex', 'state_5.sqlite')
        // mondayTs(Unix 초)를 기준으로 이번 주 threads를 모델별로 집계
        const query = `SELECT COALESCE(model,'unknown') as model, COUNT(*) as sessions, SUM(tokens_used) as tokens FROM threads WHERE created_at >= ${mondayTs} GROUP BY model;`
        // 실행 명령: sqlite3 ~/.codex/state_5.sqlite -separator | "SELECT ... FROM threads WHERE created_at >= <mondayTs> GROUP BY model;"
        const result = spawnSync('sqlite3', [dbPath, '-separator', '|', query], { encoding: 'utf-8' })

        if (result.error) throw result.error
        if (result.status !== 0) throw new Error(result.stderr || 'sqlite3 실행 실패')

        const tokensByModel: Record<string, number> = {}
        let sessions = 0

        // sqlite3 출력 형식: "modelName|sessionCount|tokenCount\n..."
        for (const line of result.stdout.trim().split('\n').filter(Boolean)) {
          const [modelName, sessionCount, tokenCount] = line.split('|')
          if (modelName) tokensByModel[modelName] = (tokensByModel[modelName] ?? 0) + Number(tokenCount ?? 0)
          sessions += Number(sessionCount ?? 0)
        }
        console.log(`[check-cli-stats] CLI 사용 통계 조회 완료: 모델=${model} 세션=${sessions}`)
        return { success: true, weekStart, weekEnd, weekly: { sessions, tokensByModel } }
      } catch (err) {
        console.error(`[check-cli-stats] CLI 사용 통계 조회 실패: 모델=${model}`, (err as Error).message)
        return { success: false, error: `state_5.sqlite 읽기 실패: ${(err as Error).message}` }
      }
    }

    return { success: false, error: '지원하지 않는 모델입니다.' }
  })
}
