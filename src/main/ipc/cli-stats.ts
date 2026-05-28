/**
 * src/main/ipc/cli-stats.ts — CLI 사용 통계 및 보고서 목록 IPC 핸들러
 *
 * 담당 채널:
 *   - check-cli-stats      : 이번 주 CLI 사용량 조회 (양방향)
 *   - list-gpt-report-files: GPT 분석 보고서 파일 목록 조회 (양방향)
 */

import { ipcMain, BrowserWindow, shell, dialog } from 'electron'
import { writeFileSync, rmSync } from 'fs'
import { IPC } from '../../shared/ipcChannels'
import { join } from 'path'
import { homedir } from 'os'
import { readFileSync, existsSync, readdirSync, statSync } from 'fs'
import { spawnSync } from 'child_process'
import { is } from '@electron-toolkit/utils'
import { STOCK_GPT_REPORTS_DIR, STOCK_CLAUDE_DIR, STOCK_GPT_DIR } from '../constants'
import icon from '../../../resources/icon.png?asset'

function createReportsWindow(): void {
  const reportsWindow = new BrowserWindow({
    width: 560,
    height: 720,
    minWidth: 480,
    minHeight: 500,
    show: false,
    autoHideMenuBar: true,
    title: '이전 보고서',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  reportsWindow.on('ready-to-show', () => {
    reportsWindow.show()
  })

  const hash = `/reports/latest?mode=window`

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    reportsWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}#${hash}`)
  } else {
    reportsWindow.loadFile(join(__dirname, '../renderer/index.html'), { hash })
  }
}

function createGuideWindow(guide: string): void {
  const guideWindow = new BrowserWindow({
    width: 960,
    height: 720,
    minWidth: 700,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    title: '투자 가이드',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  guideWindow.on('ready-to-show', () => {
    guideWindow.show()
  })

  const hash = `/guide/${guide}?mode=window`

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    guideWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}#${hash}`)
  } else {
    guideWindow.loadFile(join(__dirname, '../renderer/index.html'), { hash })
  }
}

function createReportDetailWindow(name: string, model: string): void {
  const reportWindow = new BrowserWindow({
    width: 960,
    height: 720,
    minWidth: 840,
    minHeight: 800,
    show: false,
    autoHideMenuBar: true,
    title: '보고서',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  reportWindow.on('ready-to-show', () => {
    reportWindow.show()
  })

  const hash = `/reports/${encodeURIComponent(name)}?mode=window&model=${encodeURIComponent(model)}`

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    reportWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}#${hash}`)
  } else {
    reportWindow.loadFile(join(__dirname, '../renderer/index.html'), { hash })
  }
}

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
 * CLI 통계 및 보고서 목록 IPC 핸들러를 등록한다.
 * win을 사용하지 않지만 다른 핸들러와 등록 패턴을 통일하기 위해 인자를 받는다.
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
   * IPC 채널: 'open-external-url'
   * 방향: renderer → main (handle = 양방향)
   * 용도: 보고서 내 웹 링크를 시스템 기본 브라우저로 열기
   *
   * http:// 또는 https:// URL만 허용하며, 그 외 스킴은 무시한다.
   */
  ipcMain.handle(IPC.OPEN_EXTERNAL_URL, (_event, url: string) => {
    if (typeof url === 'string' && /^https?:\/\//.test(url)) {
      shell.openExternal(url)
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

  /**
   * IPC 채널: 'list-gpt-report-files'
   * 방향: renderer → main → renderer (handle = 양방향)
   * 용도: GPT 분석으로 생성된 마크다운 보고서 목록을 UI에 표시
   *
   * STOCK_GPT_REPORTS_DIR 내 .json 파일을 스캔하고,
   * 파일 생성 시각(birthtime, 없으면 mtime) 기준으로 최신 순으로 정렬해 반환한다.
   *
   * 반환값 예시:
   *   [{ name: '삼성전자_260101.json', model: 'gpt', createdAt: '2026-01-01T...' }, ...]
   */
  ipcMain.handle(IPC.LIST_GPT_REPORT_FILES, () => {
    console.log('[list-gpt-report-files] GPT 보고서 목록 조회')
    try {
      if (!existsSync(STOCK_GPT_REPORTS_DIR)) return []

      const dateFolders = readdirSync(STOCK_GPT_REPORTS_DIR).filter((name) => {
        if (name.startsWith('.') || name === 'useless') return false
        return statSync(join(STOCK_GPT_REPORTS_DIR, name)).isDirectory()
      })

      const files = dateFolders.flatMap((dateFolder) => {
        const datePath = join(STOCK_GPT_REPORTS_DIR, dateFolder)
        return readdirSync(datePath)
          .filter((name) => {
            if (name.startsWith('.')) return false
            return statSync(join(datePath, name)).isDirectory()
          })
          .map((stockFolder) => {
            const stockPath = join(datePath, stockFolder)
            const jsonPath = join(stockPath, `${stockFolder}.json`)
            const stats = statSync(stockPath)
            const createdAt =
              stats.birthtimeMs > 0 ? stats.birthtime.toISOString() : stats.mtime.toISOString()
            let company = ''
            let ticker = ''
            let asOfDate = ''
            try {
              const json = JSON.parse(readFileSync(jsonPath, 'utf-8'))
              company = json.company ?? ''
              ticker = json.ticker ?? ''
              asOfDate = json.asOfDate ?? ''
            } catch {
              // JSON 파싱 실패 시 빈 값 유지
            }
            return {
              name: `${dateFolder}/${stockFolder}`,
              company,
              ticker,
              asOfDate,
              model: 'gpt',
              createdAt,
              updatedAt: stats.mtime.toISOString()
            }
          })
      }).sort((a, b) => b.createdAt.localeCompare(a.createdAt))

      console.log(`[list-gpt-report-files] GPT 보고서 목록 조회 완료: ${files.length}개`)
      return files
    } catch (error) {
      console.error('[list-gpt-report-files] GPT 보고서 목록 조회 실패:', error)
      return []
    }
  })

  /**
   * IPC 채널: 'read-gpt-report-file'
   * 방향: renderer → main → renderer (handle = 양방향)
   * 용도: 특정 보고서 파일의 JSON 내용을 읽어 반환
   */
  ipcMain.handle(IPC.READ_GPT_REPORT_FILE, (_event, name: string) => {
    console.log(`[read-gpt-report-file] GPT 보고서 파일 읽기: ${name}`)
    try {
      const stockName = name.split('/').pop() ?? name
      const filePath = join(STOCK_GPT_REPORTS_DIR, name, `${stockName}.json`)
      const content = readFileSync(filePath, 'utf-8')
      return { success: true, data: JSON.parse(content) }
    } catch (error) {
      console.error('[read-gpt-report-file] GPT 보고서 파일 읽기 실패:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle(IPC.OPEN_REPORTS_WINDOW, () => {
    console.log('[open-reports-window] 보고서 목록 새 창 열기')
    try {
      createReportsWindow()
      return { success: true }
    } catch (error) {
      console.error('[open-reports-window] 보고서 목록 새 창 열기 실패:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle(IPC.OPEN_GUIDE_WINDOW, (_event, guide: string) => {
    console.log(`[open-guide-window] 가이드 새 창 열기: ${guide}`)
    try {
      createGuideWindow(guide)
      return { success: true }
    } catch (error) {
      console.error('[open-guide-window] 가이드 새 창 열기 실패:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle(IPC.OPEN_REPORT_DETAIL_WINDOW, (_event, name: string, model: string) => {
    console.log(`[open-report-detail-window] 보고서 새 창 열기: ${name}`)
    try {
      createReportDetailWindow(name, model)
      return { success: true }
    } catch (error) {
      console.error('[open-report-detail-window] 보고서 새 창 열기 실패:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  /**
   * IPC 채널: 'read-artifact-files'
   * 방향: renderer → main → renderer (handle = 양방향)
   * 용도: 분석 artifact 디렉토리에서 역할별 중간 분석 결과(MD)를 읽어 반환
   *
   * artifactDir: analyze-stock.mjs가 보고서 JSON에 포함한 절대 경로
   * 반환값: { financial, news, sector } — 각 역할의 마크다운 내용
   */
  ipcMain.handle(IPC.READ_ARTIFACT_FILES, (_event, artifactDir: string) => {
    console.log(`[read-artifact-files] artifact 파일 읽기: ${artifactDir}`)
    const read = (filename: string): string => {
      try {
        return readFileSync(join(artifactDir, filename), 'utf-8')
      } catch {
        return ''
      }
    }
    return {
      financial: read('financial-analyst-kr.md'),
      news: read('news-sentiment-analyst.md'),
      sector: read('sector-researcher.md'),
      investType: read('invest-type-classifier.md'),
    }
  })

  /**
   * IPC 채널: 'save-report-pdf'
   * 방향: renderer → main → renderer (handle = 양방향)
   * 용도: 현재 보고서 화면을 PDF로 캡처하여 사용자가 선택한 경로에 저장
   *
   * event.sender를 통해 현재 webContents(보고서 창)를 printToPDF로 캡처한다.
   * dialog.showSaveDialog로 저장 경로를 선택받은 뒤 파일로 쓴다.
   */
  /**
   * IPC 채널: 'delete-gpt-report-file'
   * 방향: renderer → main → renderer (handle = 양방향)
   * 용도: 지정한 종목 폴더(dateFolder/stockFolder)를 재귀 삭제한다.
   *       삭제 후 날짜 폴더가 비어 있으면 날짜 폴더도 함께 삭제한다.
   */
  ipcMain.handle(IPC.DELETE_GPT_REPORT_FILE, (_event, name: string) => {
    console.log(`[delete-gpt-report-file] 보고서 삭제: ${name}`)
    try {
      const stockDirPath = join(STOCK_GPT_REPORTS_DIR, name)
      if (!existsSync(stockDirPath)) {
        return { success: false, error: '파일이 존재하지 않습니다.' }
      }
      rmSync(stockDirPath, { recursive: true, force: true })

      // 날짜 폴더가 비어 있으면 함께 삭제
      const dateDirPath = join(STOCK_GPT_REPORTS_DIR, name.split('/')[0])
      if (existsSync(dateDirPath) && readdirSync(dateDirPath).length === 0) {
        rmSync(dateDirPath, { recursive: true, force: true })
      }

      console.log(`[delete-gpt-report-file] 보고서 삭제 완료: ${name}`)
      return { success: true }
    } catch (error) {
      console.error('[delete-gpt-report-file] 보고서 삭제 실패:', error)
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle(IPC.SAVE_REPORT_PDF, async (event, defaultFilename: string) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return { success: false, error: '창을 찾을 수 없습니다.' }

    const { canceled, filePath } = await dialog.showSaveDialog(win, {
      title: 'PDF로 저장',
      defaultPath: defaultFilename || 'report.pdf',
      filters: [{ name: 'PDF 파일', extensions: ['pdf'] }],
    })

    if (canceled || !filePath) return { success: false, canceled: true }

    // ─── 원인 ────────────────────────────────────────────────────────
    // ec6224d 이후 InvestTypeSection 등 콘텐츠 추가로 보고서 높이가 창 높이(1080px)를
    // 초과하게 됐다. Chromium의 print 렌더링에서 overflow-y: auto 요소는 screen과
    // 동일하게 설정된 높이까지만 캡처하고 넘치는 부분을 클리핑한다.
    // → height/overflow 제약을 해제해 전체 콘텐츠를 PDF에 포함시킨다.
    // ─────────────────────────────────────────────────────────────────
    const PRINT_CSS = `
      body, #root {
        height: auto !important;
        overflow: visible !important;
      }
      .page {
        height: auto !important;
        min-height: 0 !important;
        overflow: visible !important;
      }
      .page-content {
        flex: none !important;
        height: auto !important;
        overflow: visible !important;
      }
      .card {
        overflow: visible !important;
      }
    `

    let cssKey: string | undefined
    try {
      cssKey = await event.sender.insertCSS(PRINT_CSS)

      // CSS 적용 후 레이아웃 재계산 대기
      await new Promise<void>((r) => setTimeout(r, 300))

      const pdfBuffer = await event.sender.printToPDF({
        printBackground: true,
        pageSize: 'A4',
        margins: { marginType: 'custom', top: 0.5, bottom: 0.5, left: 0.5, right: 0.5 },
      })

      writeFileSync(filePath, pdfBuffer)
      console.log(`[save-report-pdf] PDF 저장 완료: ${filePath}`)
      return { success: true, filePath }
    } catch (err) {
      console.error('[save-report-pdf] PDF 저장 실패:', err)
      return { success: false, error: (err as Error).message }
    } finally {
      // 성공·실패 관계없이 CSS를 원상복구한다.
      if (cssKey !== undefined) {
        event.sender.removeInsertedCSS(cssKey).catch(() => {})
      }
    }
  })
}
