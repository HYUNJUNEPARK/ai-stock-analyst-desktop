/**
 * src/main/ipc/report-files.ts — GPT 보고서 파일 CRUD 및 PDF 저장 IPC 핸들러
 *
 * 담당 채널:
 *   - list-gpt-report-files  : 보고서 파일 목록 조회 (양방향)
 *   - read-gpt-report-file   : 보고서 파일 내용 읽기 (양방향)
 *   - read-artifact-files    : artifact 역할별 분석 결과 읽기 (양방향)
 *   - delete-gpt-report-file : 보고서 폴더 삭제 (양방향)
 *   - save-report-pdf        : 보고서 화면을 PDF로 저장 (양방향)
 */

import { ipcMain, BrowserWindow, dialog } from 'electron'
import { writeFileSync, rmSync, readFileSync, existsSync, readdirSync, statSync } from 'fs'
import { IPC } from '../../shared/ipcChannels'
import { join } from 'path'
import { STOCK_GPT_REPORTS_DIR } from '../constants'

/**
 * 보고서 파일 CRUD 및 PDF 저장 IPC 핸들러를 등록한다.
 */
export function registerReportFilesHandlers(): void {

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
            const jsonPath = join(stockPath, 'aggressive-investment-strategist.json')
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
      const stockDir = join(STOCK_GPT_REPORTS_DIR, name)
      const filePath = join(stockDir, 'aggressive-investment-strategist.json')
      const content = readFileSync(filePath, 'utf-8')
      const data = JSON.parse(content)
      // artifactDir이 없는 기존 보고서에 대해 폴더 경로를 동적으로 주입
      if (!data.artifactDir) {
        data.artifactDir = stockDir
      }
      return { success: true, data }
    } catch (error) {
      console.error('[read-gpt-report-file] GPT 보고서 파일 읽기 실패:', error)
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
      financial: read('financial-analyst-kr.json') || read('financial-analyst-kr.md'),
      news: read('news-sentiment-analyst.json') || read('news-sentiment-analyst.md'),
      sector: read('sector-researcher.json') || read('sector-researcher.md'),
      price: read('price-analyst.json') || read('price-analyst.md'),
      valuation: read('valuation-analyst.json') || read('valuation-analyst.md'),
      investType: read('invest-type-classifier.json') || read('invest-type-classifier.md'),
    }
  })

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

  /**
   * IPC 채널: 'save-report-pdf'
   * 방향: renderer → main → renderer (handle = 양방향)
   * 용도: 현재 보고서 창의 전체 콘텐츠를 PDF로 캡처하여 사용자가 지정한 경로에 저장
   *
   * 처리 흐름:
   *   1. event.sender(보고서 창의 webContents)로부터 BrowserWindow 인스턴스를 획득
   *   2. dialog.showSaveDialog로 사용자에게 저장 경로를 선택받음
   *   3. printToPDF 실행 전 PRINT_CSS를 임시 주입 → 스크롤 클리핑 문제 해결
   *   4. 콘텐츠 높이를 측정하여 커스텀 페이지 사이즈로 한 장짜리 PDF를 생성
   *   5. Node.js writeFileSync로 디스크에 기록
   *   6. finally 블록에서 주입했던 CSS를 반드시 제거 (원상복구)
   */
  ipcMain.handle(IPC.SAVE_REPORT_PDF, async (event, defaultFilename: string) => {
    // event.sender: 이 IPC를 호출한 renderer의 webContents
    // BrowserWindow.fromWebContents()로 해당 webContents가 속한 창을 역조회한다.
    // dialog는 부모 창이 있어야 올바른 위치에 표시되므로 win이 필수다.
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return { success: false, error: '창을 찾을 수 없습니다.' }

    // 1. PDF 경로 선택
    const { canceled, filePath } = await dialog.showSaveDialog(win, {
      title: 'PDF로 저장',
      defaultPath: defaultFilename || 'report.pdf',
      filters: [{ name: 'PDF 파일', extensions: ['pdf'] }],
    })

    // 사용자가 취소하거나 경로를 선택하지 않은 경우 조용히 종료
    if (canceled || !filePath) return { success: false, canceled: true }

    // ─── PRINT_CSS 주입 이유 ──────────────────────────────────────────
    // Chromium의 print 렌더링 엔진은 화면 레이아웃을 그대로 사용한다.
    // 즉, overflow-y: auto / scroll 로 설정된 요소는 화면에서 보이는 높이까지만 캡처하고 스크롤 영역 아래의 콘텐츠는 잘린다(클리핑).
    //
    // 보고서 창(.page, .page-content)은 창 높이(≈940px)에 맞춰 스크롤되도록 설계되어 있기 때문에, InvestTypeSection 등 콘텐츠가 추가되면서
    // 전체 높이가 창 높이를 초과할 경우 PDF에서 하단 내용이 누락된다.
    //
    // 해결책: printToPDF 직전에 CSS를 임시 주입하여
    //   - height 고정값 해제 → auto로 전체 콘텐츠 높이만큼 늘어나게 함
    //   - overflow 제약 해제 → 클리핑 없이 전체 내용을 PDF에 포함시킴
    // ─────────────────────────────────────────────────────────────────
    const PRINT_CSS = `
      body, #root {
        height: auto !important;
        min-height: 0 !important;
        overflow: visible !important;
      }
      .page {
        height: auto !important;
        min-height: 0 !important;
        overflow: visible !important;
        padding: 0 !important;
      }
      .page-content {
        flex: none !important;
        height: auto !important;
        overflow: visible !important;
        padding: 0 !important;
      }
      .card {
        overflow: visible !important;
      }
      /* PDF에서 NavBar 숨김 — 보고서 본문(ReportView/MarkdownRenderer)만 남긴다 */
      .nav-bar {
        display: none !important;
      }
      /* content-container의 상하 여백 제거 */
      .content-container {
        padding-top: 0 !important;
        padding-bottom: 0 !important;
      }
    `

    let cssKey: string | undefined
    try {
      // 2. PDF 캡처 (CSS 임시 주입 → reflow 대기 → printToPDF)
      cssKey = await event.sender.insertCSS(PRINT_CSS)
      await new Promise<void>((r) => setTimeout(r, 300))

      const A4_WIDTH_INCH = 8.27
      const MARGIN_INCH = 0.5

      // printToPDF의 콘텐츠 영역 너비(인치 → px).
      // Chromium의 print 엔진은 1인치 = 96 CSS px로 레이아웃한다.
      const contentWidthPx = Math.round((A4_WIDTH_INCH - MARGIN_INCH * 2) * 96)

      // CDP로 printToPDF와 동일한 뷰포트 조건에서 콘텐츠 높이를 측정한다.
      const wc = event.sender
      const debugger_ = wc.debugger
      debugger_.attach('1.3')
      try {
        // 1) 뷰포트를 PDF 콘텐츠 너비에 맞추고 높이를 충분히 크게 설정하여
        //    콘텐츠가 잘리지 않는 상태에서 레이아웃을 수행시킨다.
        await debugger_.sendCommand('Emulation.setDeviceMetricsOverride', {
          width: contentWidthPx,
          height: 10000,
          deviceScaleFactor: 1,
          mobile: false,
        })

        // 2) 레이아웃 완료 대기 후 실제 콘텐츠 높이를 JS로 직접 측정한다.
        //    Page.getLayoutMetrics의 contentSize는 viewport/document 크기에 영향을 받을 수 있으므로
        //    숨겨지지 않은 실제 DOM 요소의 높이를 직접 측정하는 것이 더 정확하다.
        await new Promise<void>((r) => setTimeout(r, 200))
        const contentHeightPx: number = await wc.executeJavaScript(`
          (function() {
            // .card 요소가 실제 보고서 콘텐츠 래퍼이다.
            var card = document.querySelector('.card');
            if (card) return card.getBoundingClientRect().height;
            return Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
          })()
        `)

        await debugger_.sendCommand('Emulation.clearDeviceMetricsOverride')

        // 콘텐츠 높이 + 상하 마진으로 페이지 높이를 결정한다.
        const contentHeightInch = Math.ceil(contentHeightPx) / 96 + MARGIN_INCH * 2

        const pdfBuffer = await event.sender.printToPDF({
          printBackground: true,
          pageSize: { width: A4_WIDTH_INCH, height: contentHeightInch },
          margins: { marginType: 'custom', top: MARGIN_INCH, bottom: MARGIN_INCH, left: MARGIN_INCH, right: MARGIN_INCH },
        })

        writeFileSync(filePath, pdfBuffer)
        console.log(`[save-report-pdf] PDF 저장 완료: ${filePath}`)
        return { success: true, filePath }
      } finally {
        try { debugger_.detach() } catch (_) { /* 이미 detach된 경우 무시 */ }
      }
    } catch (err) {
      console.error('[save-report-pdf] PDF 저장 실패:', err)
      return { success: false, error: (err as Error).message }
    } finally {
      if (cssKey !== undefined) {
        event.sender.removeInsertedCSS(cssKey).catch(() => {})
      }
    }
  })
}
