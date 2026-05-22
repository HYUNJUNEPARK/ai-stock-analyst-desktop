/**
 * src/main/ipc/cli-stats.ts — CLI 사용 통계 및 보고서 목록 IPC 핸들러
 *
 * 담당 채널:
 *   - check-cli-stats      : 이번 주 CLI 사용량 조회 (양방향)
 *   - list-gpt-report-files: GPT 분석 보고서 파일 목록 조회 (양방향)
 */

import { ipcMain } from 'electron'
import { join } from 'path'
import { homedir } from 'os'
import { readFileSync, existsSync, readdirSync, statSync } from 'fs'
import { spawnSync } from 'child_process'
import { STOCK_GPT_REPORTS_DIR } from '../constants'

// ── 날짜 유틸 ─────────────────────────────────────────────────────

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

// ── 핸들러 등록 ───────────────────────────────────────────────────

/**
 * CLI 통계 및 보고서 목록 IPC 핸들러를 등록한다.
 * win을 사용하지 않지만 다른 핸들러와 등록 패턴을 통일하기 위해 인자를 받는다.
 */
export function registerCliStatsHandlers(): void {

  // ── [handle] CLI 사용 통계 조회 ─────────────────────────────────
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
  ipcMain.handle('check-cli-stats', (_event, model: string) => {
    console.log(`[IPC:handle] check-cli-stats model="${model}"`)
    const { weekStart, weekEnd, mondayTs } = getWeekRange()

    // ── Claude: stats-cache.json ──
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
        return { success: true, weekStart, weekEnd, weekly: { sessions, messages, toolCalls, tokensByModel } }
      } catch (err) {
        return { success: false, error: `stats-cache.json 읽기 실패: ${(err as Error).message}` }
      }
    }

    // ── GPT: ~/.codex/state_5.sqlite ──
    if (model === 'gpt') {
      try {
        const dbPath = join(homedir(), '.codex', 'state_5.sqlite')
        // mondayTs(Unix 초)를 기준으로 이번 주 threads를 모델별로 집계
        const query = `SELECT COALESCE(model,'unknown') as model, COUNT(*) as sessions, SUM(tokens_used) as tokens FROM threads WHERE created_at >= ${mondayTs} GROUP BY model;`
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
        return { success: true, weekStart, weekEnd, weekly: { sessions, tokensByModel } }
      } catch (err) {
        return { success: false, error: `state_5.sqlite 읽기 실패: ${(err as Error).message}` }
      }
    }

    return { success: false, error: '지원하지 않는 모델입니다.' }
  })

  // ── [handle] GPT 보고서 파일 목록 조회 ──────────────────────────
  /**
   * IPC 채널: 'list-gpt-report-files'
   * 방향: renderer → main → renderer (handle = 양방향)
   * 용도: GPT 분석으로 생성된 마크다운 보고서 목록을 UI에 표시
   *
   * STOCK_GPT_REPORTS_DIR 내 .md 파일을 스캔하고,
   * 파일 수정 시각(mtime) 기준으로 최신 순으로 정렬해 반환한다.
   *
   * 반환값 예시:
   *   [{ name: '삼성전자_20260101.md', model: 'gpt', updatedAt: '2026-01-01T...' }, ...]
   */
  ipcMain.handle('list-gpt-report-files', () => {
    console.log('[IPC:handle] list-gpt-report-files')
    try {
      if (!existsSync(STOCK_GPT_REPORTS_DIR)) return []

      return readdirSync(STOCK_GPT_REPORTS_DIR)
        .filter((name) => name.endsWith('.md'))
        .map((name) => {
          const path = join(STOCK_GPT_REPORTS_DIR, name)
          const stats = statSync(path)
          return {
            name,
            model: 'gpt',
            updatedAt: stats.mtime.toISOString()
          }
        })
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    } catch (error) {
      console.error('GPT 리포트 목록 조회 실패:', error)
      return []
    }
  })
}
